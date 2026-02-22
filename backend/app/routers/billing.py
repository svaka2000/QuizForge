from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.user import User, UserTier
from app.models.subscription import Subscription, SubscriptionStatus
from app.repositories.user_repository import UserRepository
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["billing"])


def _get_stripe():
    """Import stripe lazily so the app still starts without STRIPE_SECRET_KEY."""
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        return stripe
    except ImportError:
        raise HTTPException(status_code=501, detail="Stripe not configured")


def _get_or_create_subscription(db: Session, user: User) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(user_id=user.id, status=SubscriptionStatus.INACTIVE)
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


@router.post("/create-checkout-session")
def create_checkout_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Billing not configured")
    if not settings.STRIPE_PRICE_ID_MONTHLY:
        raise HTTPException(status_code=501, detail="Price ID not configured")

    stripe = _get_stripe()
    sub = _get_or_create_subscription(db, current_user)

    # Get or create Stripe customer
    if not sub.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name or current_user.email,
            metadata={"user_id": str(current_user.id)},
        )
        sub.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": settings.STRIPE_PRICE_ID_MONTHLY, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/billing/cancel",
        metadata={"user_id": str(current_user.id)},
    )
    return {"checkout_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=501, detail="Webhook secret not configured")

    stripe = _get_stripe()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        logger.warning(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(db, data)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, data)
    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(db, data)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(db, data)

    return {"received": True}


def _handle_checkout_completed(db: Session, session_data):
    customer_id = session_data.get("customer")
    subscription_id = session_data.get("subscription")
    if not customer_id or not subscription_id:
        return

    stripe = _get_stripe()
    stripe_sub = stripe.Subscription.retrieve(subscription_id)

    sub = db.query(Subscription).filter(
        Subscription.stripe_customer_id == customer_id
    ).first()
    if not sub:
        logger.warning(f"No local subscription for customer {customer_id}")
        return

    sub.stripe_subscription_id = subscription_id
    sub.stripe_price_id = stripe_sub["items"]["data"][0]["price"]["id"]
    sub.status = SubscriptionStatus.ACTIVE
    sub.current_period_start = datetime.fromtimestamp(
        stripe_sub["current_period_start"], tz=timezone.utc
    )
    sub.current_period_end = datetime.fromtimestamp(
        stripe_sub["current_period_end"], tz=timezone.utc
    )
    db.commit()

    # Upgrade user to PRO
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(sub.user_id)
    if user:
        user_repo.update(user, tier=UserTier.PRO)
    logger.info(f"User {sub.user_id} upgraded to PRO")


def _handle_subscription_deleted(db: Session, stripe_sub):
    sub_id = stripe_sub.get("id")
    sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == sub_id
    ).first()
    if not sub:
        return

    sub.status = SubscriptionStatus.CANCELED
    db.commit()

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(sub.user_id)
    if user:
        user_repo.update(user, tier=UserTier.FREE)
    logger.info(f"User {sub.user_id} downgraded to FREE (subscription canceled)")


def _handle_payment_failed(db: Session, invoice_data):
    customer_id = invoice_data.get("customer")
    sub = db.query(Subscription).filter(
        Subscription.stripe_customer_id == customer_id
    ).first()
    if sub:
        sub.status = SubscriptionStatus.PAST_DUE
        db.commit()
    logger.warning(f"Payment failed for customer {customer_id}")


def _handle_subscription_updated(db: Session, stripe_sub):
    sub_id = stripe_sub.get("id")
    sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == sub_id
    ).first()
    if not sub:
        return

    status_map = {
        "active": SubscriptionStatus.ACTIVE,
        "canceled": SubscriptionStatus.CANCELED,
        "past_due": SubscriptionStatus.PAST_DUE,
        "trialing": SubscriptionStatus.TRIALING,
        "incomplete": SubscriptionStatus.INACTIVE,
    }
    new_status = status_map.get(stripe_sub.get("status"), SubscriptionStatus.INACTIVE)
    sub.status = new_status
    sub.cancel_at_period_end = stripe_sub.get("cancel_at_period_end", False)
    db.commit()


@router.get("/portal")
def billing_portal(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Billing not configured")

    stripe = _get_stripe()
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/profile",
    )
    return {"portal_url": session.url}


@router.get("/status")
def billing_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        return {
            "tier": current_user.tier,
            "subscription_status": SubscriptionStatus.INACTIVE,
            "stripe_customer_id": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
        }
    return {
        "tier": current_user.tier,
        "subscription_status": sub.status,
        "stripe_customer_id": sub.stripe_customer_id,
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }
