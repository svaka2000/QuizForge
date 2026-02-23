"""Tests for billing endpoints. Stripe is mocked so no live API calls are made."""
import pytest
from unittest.mock import MagicMock, patch


def _fresh_auth(client, email: str) -> dict:
    """Register a brand-new user and return auth headers."""
    client.post("/api/auth/register", json={
        "email": email,
        "password": "TestPass123!",
        "full_name": "Billing Test User",
    })
    resp = client.post("/api/auth/login", data={
        "username": email,
        "password": "TestPass123!",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# /api/billing/status — works without Stripe
# ---------------------------------------------------------------------------

def test_billing_status_no_subscription(client):
    """A brand-new user with no subscription gets a free/inactive status."""
    headers = _fresh_auth(client, "billing_status@test.edu")
    resp = client.get("/api/billing/status", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "tier" in data
    assert "subscription_status" in data


def test_billing_status_requires_auth(client):
    resp = client.get("/api/billing/status")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# /api/billing/create-checkout-session — returns 501 without Stripe config
# ---------------------------------------------------------------------------

def test_checkout_session_without_stripe_key(client):
    """Without STRIPE_SECRET_KEY configured, endpoint returns 501."""
    from app.core.config import settings
    headers = _fresh_auth(client, "billing_no_key@test.edu")
    original = settings.STRIPE_SECRET_KEY
    settings.STRIPE_SECRET_KEY = None
    try:
        resp = client.post("/api/billing/create-checkout-session", headers=headers)
        assert resp.status_code == 501
    finally:
        settings.STRIPE_SECRET_KEY = original


def test_checkout_session_without_price_id(client):
    """Without STRIPE_PRICE_ID_MONTHLY configured, endpoint returns 501."""
    from app.core.config import settings
    headers = _fresh_auth(client, "billing_no_price@test.edu")
    orig_key = settings.STRIPE_SECRET_KEY
    orig_price = settings.STRIPE_PRICE_ID_MONTHLY
    settings.STRIPE_SECRET_KEY = "sk_test_fake"
    settings.STRIPE_PRICE_ID_MONTHLY = None
    try:
        resp = client.post("/api/billing/create-checkout-session", headers=headers)
        assert resp.status_code == 501
    finally:
        settings.STRIPE_SECRET_KEY = orig_key
        settings.STRIPE_PRICE_ID_MONTHLY = orig_price


def test_checkout_session_requires_auth(client):
    resp = client.post("/api/billing/create-checkout-session")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# /api/billing/create-checkout-session — mocked Stripe
# ---------------------------------------------------------------------------

def test_checkout_session_with_mock_stripe(client):
    """With Stripe mocked, checkout session returns a checkout URL."""
    from app.core.config import settings
    headers = _fresh_auth(client, "billing_checkout@test.edu")

    mock_customer = MagicMock()
    mock_customer.id = "cus_test123"

    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/pay/test_session_id"

    mock_stripe = MagicMock()
    mock_stripe.Customer.create.return_value = mock_customer
    mock_stripe.checkout.Session.create.return_value = mock_session

    orig_key = settings.STRIPE_SECRET_KEY
    orig_price = settings.STRIPE_PRICE_ID_MONTHLY
    settings.STRIPE_SECRET_KEY = "sk_test_fake"
    settings.STRIPE_PRICE_ID_MONTHLY = "price_test123"

    try:
        with patch("app.routers.billing._get_stripe", return_value=mock_stripe):
            resp = client.post("/api/billing/create-checkout-session", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "checkout_url" in data
        assert data["checkout_url"] == "https://checkout.stripe.com/pay/test_session_id"
    finally:
        settings.STRIPE_SECRET_KEY = orig_key
        settings.STRIPE_PRICE_ID_MONTHLY = orig_price


# ---------------------------------------------------------------------------
# /api/billing/portal (GET) — mocked Stripe
# ---------------------------------------------------------------------------

def test_billing_portal_requires_auth(client):
    resp = client.get("/api/billing/portal")
    assert resp.status_code == 401


def test_billing_portal_no_stripe_key(client):
    from app.core.config import settings
    headers = _fresh_auth(client, "billing_portal_key@test.edu")
    original = settings.STRIPE_SECRET_KEY
    settings.STRIPE_SECRET_KEY = None
    try:
        resp = client.get("/api/billing/portal", headers=headers)
        assert resp.status_code == 501
    finally:
        settings.STRIPE_SECRET_KEY = original


def test_billing_portal_no_subscription(client):
    """Trying to open portal without a Stripe customer ID should return 404."""
    from app.core.config import settings
    headers = _fresh_auth(client, "billing_portal_nosub@test.edu")
    orig_key = settings.STRIPE_SECRET_KEY
    settings.STRIPE_SECRET_KEY = "sk_test_fake"

    mock_stripe = MagicMock()

    try:
        with patch("app.routers.billing._get_stripe", return_value=mock_stripe):
            resp = client.get("/api/billing/portal", headers=headers)
        # No customer_id on file → 404
        assert resp.status_code == 404
    finally:
        settings.STRIPE_SECRET_KEY = orig_key


# ---------------------------------------------------------------------------
# /api/billing/webhook — signature verification
# ---------------------------------------------------------------------------

def test_webhook_missing_signature(client):
    """Webhook with webhook secret set but no Stripe-Signature header returns 400."""
    from app.core.config import settings
    orig = settings.STRIPE_WEBHOOK_SECRET
    settings.STRIPE_WEBHOOK_SECRET = "whsec_test"

    mock_stripe = MagicMock()
    mock_stripe.Webhook.construct_event.side_effect = Exception("No signature")

    try:
        with patch("app.routers.billing._get_stripe", return_value=mock_stripe):
            resp = client.post(
                "/api/billing/webhook",
                content=b'{"type": "test"}',
                headers={"Content-Type": "application/json"},
            )
        assert resp.status_code == 400
    finally:
        settings.STRIPE_WEBHOOK_SECRET = orig


def test_webhook_invalid_signature(client):
    """Webhook with an invalid Stripe-Signature should return 400."""
    from app.core.config import settings
    orig = settings.STRIPE_WEBHOOK_SECRET
    settings.STRIPE_WEBHOOK_SECRET = "whsec_test"

    # Stripe raises ValueError on bad signatures
    mock_stripe = MagicMock()
    mock_stripe.Webhook.construct_event.side_effect = ValueError("Invalid signature")

    try:
        with patch("app.routers.billing._get_stripe", return_value=mock_stripe):
            resp = client.post(
                "/api/billing/webhook",
                content=b'{"type": "test"}',
                headers={
                    "Content-Type": "application/json",
                    "Stripe-Signature": "t=bad,v1=invalidsignature",
                },
            )
        assert resp.status_code == 400
    finally:
        settings.STRIPE_WEBHOOK_SECRET = orig


def test_webhook_no_secret_configured(client):
    """Without webhook secret configured, endpoint returns 501."""
    from app.core.config import settings
    orig = settings.STRIPE_WEBHOOK_SECRET
    settings.STRIPE_WEBHOOK_SECRET = None
    try:
        resp = client.post(
            "/api/billing/webhook",
            content=b'{"type": "test"}',
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 501
    finally:
        settings.STRIPE_WEBHOOK_SECRET = orig
