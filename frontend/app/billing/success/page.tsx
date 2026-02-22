"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/dashboard"), 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="h-10 w-10 text-green-600"
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
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Pro! 🎉
        </h1>
        <p className="text-gray-600 mb-4">
          Your subscription is active. You now have 100 quiz generations per day
          with Claude AI.
        </p>
        <p className="text-sm text-gray-400">
          Redirecting to your dashboard in a few seconds…
        </p>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-block btn-primary"
          >
            Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
