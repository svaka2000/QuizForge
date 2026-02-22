"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import AuthGuard from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { generationsApi } from "@/lib/api";
import type { GenerationListItem } from "@/lib/types";
import {
  DocumentArrowDownIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-green",
  processing: "badge-yellow",
  pending: "badge-gray",
  failed: "badge-red",
};

export default function HistoryPage() {
  const [generations, setGenerations] = useState<GenerationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const data = await generationsApi.list(0, 100);
      setGenerations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this generation? This cannot be undone.")) return;
    try {
      await generationsApi.delete(id);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = generations.filter(
    (g) =>
      search === "" ||
      g.topic.toLowerCase().includes(search.toLowerCase()) ||
      g.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Generation History</h1>
              <p className="text-slate-500 text-sm mt-1">
                {generations.length} total generations
              </p>
            </div>
            <Link href="/generate" className="btn-primary">
              <PlusCircleIcon className="w-4 h-4" />
              New Quiz
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Search by topic or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <PlusCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {search ? "No results match your search." : "No generations yet."}
                </p>
                {!search && (
                  <Link href="/generate" className="btn-primary mt-4">
                    Create your first quiz
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Topic</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Subject</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Grade</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Questions</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Created</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((gen) => (
                      <tr key={gen.id} className="hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <Link href={`/generation/${gen.id}`} className="font-medium text-slate-900 hover:text-primary-600 line-clamp-1">
                            {gen.topic}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5 md:hidden">{gen.subject}</p>
                        </td>
                        <td className="py-3 px-2 text-slate-600 hidden md:table-cell">{gen.subject}</td>
                        <td className="py-3 px-2 text-slate-600 hidden sm:table-cell">{gen.grade_level}</td>
                        <td className="py-3 px-2 text-slate-600 hidden lg:table-cell">{gen.question_count}</td>
                        <td className="py-3 px-2">
                          <span className={clsx("badge", STATUS_BADGE[gen.status] || "badge-gray")}>
                            {gen.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 text-xs hidden md:table-cell">
                          {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-2">
                            {gen.status === "completed" && (
                              <Link href={`/generation/${gen.id}`} className="btn-secondary text-xs py-1 px-2">
                                <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Download</span>
                              </Link>
                            )}
                            <button
                              onClick={(e) => handleDelete(gen.id, e)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
