"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { generationsApi } from "@/lib/api";
import type { Generation } from "@/lib/types";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GenerationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generationsApi.get(Number(id))
      .then(setGeneration)
      .catch(() => {
        toast.error("Generation not found");
        router.push("/history");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const downloadPDF = async (type: "version_a" | "version_b" | "answer_key", label: string) => {
    const token = localStorage.getItem("qf_token");
    const url = `${API_URL}/api/generations/${id}/download/${type}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { toast.error("Download failed"); return; }
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${label}_${id}.pdf`;
    a.click();
    toast.success(`${label} downloaded`);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50"><Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!generation) return null;

  const isCompleted = generation.status === "completed";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Back */}
          <button onClick={() => router.back()} className="btn-outline text-sm mb-6">
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="card mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{generation.topic}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-blue">{generation.subject}</span>
                  <span className="badge badge-gray">Grade {generation.grade_level}</span>
                  <span className="badge badge-gray capitalize">{generation.difficulty}</span>
                  <span className="badge badge-gray">{generation.question_count} questions</span>
                  {generation.generator_used && (
                    <span className={clsx("badge", generation.generator_used === "claude" ? "badge-blue" : "badge-gray")}>
                      {generation.generator_used === "claude" ? "⚡ AI Generated" : "📝 Mock"}
                    </span>
                  )}
                </div>
                {generation.standards && (
                  <p className="text-xs text-slate-500 mt-2">Standards: {generation.standards}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {isCompleted ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Ready</span>
                  </div>
                ) : generation.status === "failed" ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <ClockIcon className="w-5 h-5" />
                    <span className="text-sm font-medium capitalize">{generation.status}</span>
                  </div>
                )}
                {generation.generation_time_seconds && (
                  <p className="text-xs text-slate-400 mt-1">
                    Generated in {generation.generation_time_seconds}s
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Download cards */}
          {isCompleted && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                {
                  type: "version_a" as const,
                  label: "Version A",
                  desc: "Student worksheet — Version A",
                  color: "bg-blue-50 border-blue-200",
                  textColor: "text-blue-700",
                  btnClass: "bg-blue-600 hover:bg-blue-700",
                },
                {
                  type: "version_b" as const,
                  label: "Version B",
                  desc: "Student worksheet — Version B",
                  color: "bg-purple-50 border-purple-200",
                  textColor: "text-purple-700",
                  btnClass: "bg-purple-600 hover:bg-purple-700",
                },
                {
                  type: "answer_key" as const,
                  label: "Answer Key",
                  desc: "Teacher use only",
                  color: "bg-green-50 border-green-200",
                  textColor: "text-green-700",
                  btnClass: "bg-green-600 hover:bg-green-700",
                },
              ].map((item) => (
                <div key={item.type} className={clsx("border rounded-xl p-5 flex flex-col gap-3", item.color)}>
                  <div>
                    <p className={clsx("font-semibold text-lg", item.textColor)}>{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => downloadPDF(item.type, item.label.replace(" ", "_"))}
                    className={clsx("flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-colors", item.btnClass)}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Failed message */}
          {generation.status === "failed" && generation.error_message && (
            <div className="card border-red-200 bg-red-50 mb-6">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Generation Failed</p>
                  <p className="text-sm text-red-600 mt-1">{generation.error_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Question preview */}
          {isCompleted && generation.questions_a && generation.questions_a.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
                <SparklesIcon className="w-5 h-5 text-primary-500" />
                Question Preview — Version A
              </h2>
              <div className="space-y-6">
                {generation.questions_a.slice(0, 5).map((q, idx) => (
                  <div key={q.id} className="border-l-4 border-primary-200 pl-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {idx + 1}. {q.question}
                      </p>
                      <span className="badge badge-gray shrink-0 text-xs">{q.points} pts</span>
                    </div>
                    {q.type === "multiple_choice" && q.options && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((opt, i) => (
                          <li key={i} className={clsx(
                            "text-xs px-2 py-1 rounded",
                            opt === q.correct_answer ? "text-green-700 bg-green-50 font-medium" : "text-slate-600"
                          )}>
                            {opt === q.correct_answer ? "✓ " : ""}{opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type !== "multiple_choice" && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Answer: {q.correct_answer.slice(0, 120)}{q.correct_answer.length > 120 ? "..." : ""}
                      </p>
                    )}
                  </div>
                ))}
                {generation.questions_a.length > 5 && (
                  <p className="text-sm text-slate-400 text-center pt-2">
                    + {generation.questions_a.length - 5} more questions in the PDF
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
