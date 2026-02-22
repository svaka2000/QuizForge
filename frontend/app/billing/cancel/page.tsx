"use client";

import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upgrade Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          No worries — you can upgrade anytime. Your free account is still active
          and you can continue generating quizzes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/upgrade" className="btn-primary">
            Try Upgrading Again
          </Link>
          <Link href="/dashboard" className="btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
