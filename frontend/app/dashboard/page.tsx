"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  PlusCircleIcon,
  DocumentArrowDownIcon,
  BoltIcon,
  ChartBarIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/lib/store";
import { authApi, generationsApi } from "@/lib/api";
import type { UserStats, GenerationListItem } from "@/lib/types";
import clsx from "clsx";

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-green",
  processing: "badge-yellow",
  pending: "badge-gray",
  failed: "badge-red",
};

const GENERATOR_LABEL: Record<string, string> = {
  claude: "AI",
  mock: "Mock",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recent, setRecent] = useState<GenerationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([authApi.stats(), generationsApi.list(0, 5)])
      .then(([s, r]) => {
        setStats(s);
        setRecent(r);
      })
      .finally(() => setLoading(false));
  }, []);

  const usedPercent = stats ? Math.min(100, (stats.generations_today / stats.daily_limit) * 100) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.full_name?.split(" ")[0] || "Teacher"} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {user?.school_name ? `${user.school_name} · ` : ""}Ready to create your next quiz?
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "—" : stats?.total_generations ?? 0}
                </p>
                <p className="text-xs text-slate-500">Total Quizzes Generated</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BoltIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "—" : `${stats?.generations_today ?? 0}/${stats?.daily_limit ?? 3}`}
                </p>
                <p className="text-xs text-slate-500">Used Today</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                  <div
                    className={clsx("h-1.5 rounded-full transition-all", usedPercent >= 100 ? "bg-red-500" : "bg-green-500")}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 capitalize">
                  {user?.tier ?? "free"}
                </p>
                <p className="text-xs text-slate-500">Current Plan</p>
                {user?.tier === "free" && (
                  <Link href="/upgrade" className="text-xs text-primary-600 font-medium hover:underline">
                    Upgrade →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Generate CTA */}
          <div className="mb-8">
            <Link
              href="/generate"
              className="btn-primary w-full sm:w-auto text-base px-8 py-3"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Generate New Quiz
            </Link>
          </div>

          {/* Recent generations */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-slate-400" />
                Recent Generations
              </h2>
              <Link href="/history" className="text-sm text-primary-600 hover:underline font-medium">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-10">
                <PlusCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No generations yet.</p>
                <Link href="/generate" className="btn-primary mt-4 text-sm">
                  Create your first quiz
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((gen) => (
                  <div key={gen.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/generation/${gen.id}`} className="font-medium text-slate-900 hover:text-primary-600 truncate block">
                        {gen.topic}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {gen.subject} · Grade {gen.grade_level} · {gen.question_count} questions ·{" "}
                        {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {gen.generator_used && (
                        <span className={clsx("badge", gen.generator_used === "claude" ? "badge-blue" : "badge-gray")}>
                          {GENERATOR_LABEL[gen.generator_used] || gen.generator_used}
                        </span>
                      )}
                      <span className={clsx("badge", STATUS_BADGE[gen.status] || "badge-gray")}>
                        {gen.status}
                      </span>
                      {gen.status === "completed" && (
                        <Link href={`/generation/${gen.id}`} className="btn-secondary text-xs py-1 px-2">
                          <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                          Download
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
