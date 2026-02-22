"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/lib/store";
import { billingApi } from "@/lib/api";
import toast from "react-hot-toast";

const FREE_FEATURES = [
  "3 quiz generations per day",
  "Version A & B worksheets",
  "Answer key PDFs",
  "Multiple question types",
  "MockGenerator (offline)",
];

const PRO_FEATURES = [
  "100 quiz generations per day",
  "Everything in Free",
  "Claude AI generation",
  "Standards alignment",
  "Priority processing",
  "Email support",
];

export default function UpgradePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPro = user?.tier === "pro";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { checkout_url } = await billingApi.createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to start checkout";
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const { portal_url } = await billingApi.portal();
      window.location.href = portal_url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to open billing portal";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
            <p className="mt-2 text-gray-600">
              Unlock the full power of AI-generated quizzes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="card border-2 border-gray-200 relative">
              {user?.tier === "free" && (
                <div className="absolute top-4 right-4">
                  <span className="badge badge-gray text-xs">Current Plan</span>
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Free</h2>
                <div className="mt-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Perfect for trying out QuizForge
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg
                      className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="w-full btn-outline"
                onClick={() => router.push("/generate")}
              >
                Continue with Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-indigo-500 relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              {isPro && (
                <div className="absolute top-4 right-4">
                  <span className="badge badge-blue text-xs">Current Plan</span>
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Pro</h2>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-indigo-600">$12</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  For active teachers who need more
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg
                      className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <button
                  className="w-full btn-outline"
                  onClick={handleManage}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Manage Subscription"}
                </button>
              ) : (
                <button
                  className="w-full btn-primary"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? "Redirecting..." : "Upgrade to Pro →"}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Cancel anytime. No long-term commitment.
            Billing powered by Stripe.
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
