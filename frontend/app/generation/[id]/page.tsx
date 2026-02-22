"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { generationsApi } from "@/lib/api";
import { PrintPreview } from "@/components/quiz/PrintPreview";
import type { Generation, Question, GenerationPreview, PreviewVersion } from "@/lib/types";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  ShareIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type QuestionTab = "version_a" | "version_b";

export default function GenerationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QuestionTab>("version_a");
  const [showAll, setShowAll] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<GenerationPreview | null>(null);
  const [previewVersion, setPreviewVersion] = useState<PreviewVersion>("A");
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    generationsApi
      .get(Number(id))
      .then(setGeneration)
      .catch(() => {
        toast.error("Generation not found");
        router.push("/history");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const openPreview = async () => {
    if (!previewData) {
      try {
        const data = await generationsApi.preview(Number(id));
        setPreviewData(data);
      } catch {
        toast.error("Could not load preview");
        return;
      }
    }
    setPreviewOpen(true);
  };

  const downloadPDF = async (
    type: "version_a" | "version_b" | "answer_key",
    label: string
  ) => {
    const token = localStorage.getItem("qf_token");
    const url = `${API_URL}/api/generations/${id}/download/${type}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      toast.error("Download failed");
      return;
    }
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${label}_${id}.pdf`;
    a.click();
    toast.success(`${label} downloaded`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleRegenerate = () => {
    if (!generation) return;
    const params = new URLSearchParams({
      topic: generation.topic,
      subject: generation.subject,
      grade_level: generation.grade_level,
      difficulty: generation.difficulty,
      question_count: String(generation.question_count),
    });
    router.push(`/generate?${params.toString()}`);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse mb-6" />
            <div className="flex gap-3 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card">
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse mb-3" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!generation) return null;

  const isCompleted = generation.status === "completed";
  const activeQuestions: Question[] =
    activeTab === "version_a"
      ? generation.questions_a || []
      : generation.questions_b || [];
  const displayedQuestions = showAll
    ? activeQuestions
    : activeQuestions.slice(0, 5);

  const PDF_CARDS = [
    {
      type: "version_a" as const,
      label: "Version A",
      desc: "Student worksheet — Version A",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
      btnClass: "bg-blue-600 hover:bg-blue-700",
      previewVersion: "A" as PreviewVersion,
    },
    {
      type: "version_b" as const,
      label: "Version B",
      desc: "Student worksheet — Version B",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-700",
      btnClass: "bg-purple-600 hover:bg-purple-700",
      previewVersion: "B" as PreviewVersion,
    },
    {
      type: "answer_key" as const,
      label: "Answer Key",
      desc: "Teacher use only",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      btnClass: "bg-green-600 hover:bg-green-700",
      previewVersion: "answer_key" as PreviewVersion,
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="card mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {generation.topic}
                </h1>
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
                  <p className="text-xs text-gray-500 mt-2">Standards: {generation.standards}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
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
                  <p className="text-xs text-gray-400">Generated in {generation.generation_time_seconds}s</p>
                )}
                {generation.estimated_print_time && (
                  <p className="text-xs text-gray-400">
                    <PrinterIcon className="w-3 h-3 inline mr-1" />
                    {generation.estimated_print_time}
                  </p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ShareIcon className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    Re-generate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Download + Preview cards */}
          {isCompleted && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {PDF_CARDS.map((item) => (
                <div
                  key={item.type}
                  className={clsx("border rounded-xl p-5 flex flex-col gap-3", item.color)}
                >
                  <div>
                    <p className={clsx("font-semibold text-lg", item.textColor)}>{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => downloadPDF(item.type, item.label.replace(" ", "_"))}
                      className={clsx(
                        "flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-colors",
                        item.btnClass
                      )}
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        setPreviewVersion(item.previewVersion);
                        setShowAnswers(item.type === "answer_key");
                        openPreview();
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-current text-sm font-medium transition-colors hover:bg-white/60"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Failed message */}
          {generation.status === "failed" && (
            <div className="card border-red-200 bg-red-50 mb-6">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Generation Failed</p>
                  <p className="text-sm text-red-600 mt-1">An error occurred while generating your quiz. Please try again.</p>
                </div>
              </div>
            </div>
          )}

          {/* Question preview with tabs */}
          {isCompleted && activeQuestions.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-indigo-500" />
                  Question Preview
                </h2>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {(["version_a", "version_b"] as QuestionTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setShowAll(false);
                      }}
                      className={clsx(
                        "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                        activeTab === tab
                          ? "bg-white text-gray-900 shadow"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {tab === "version_a" ? "Version A" : "Version B"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                {displayedQuestions.map((q, idx) => (
                  <div key={q.id} className="border-l-4 border-indigo-200 pl-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {idx + 1}. {q.question}
                      </p>
                      <span className="badge badge-gray shrink-0 text-xs">{q.points} pts</span>
                    </div>
                    {q.type === "multiple_choice" && q.options && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((opt, i) => (
                          <li
                            key={i}
                            className={clsx(
                              "text-xs px-2 py-1 rounded",
                              opt === q.correct_answer
                                ? "text-green-700 bg-green-50 font-medium"
                                : "text-gray-600"
                            )}
                          >
                            {opt === q.correct_answer ? "✓ " : ""}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type !== "multiple_choice" && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Answer: {q.correct_answer.slice(0, 150)}{q.correct_answer.length > 150 ? "..." : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {activeQuestions.length > 5 && (
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {showAll ? "Show less" : `Show all ${activeQuestions.length} questions`}
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Print Preview Modal */}
      {previewOpen && previewData && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/80">
          {/* Modal toolbar */}
          <div className="no-print flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* Version tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(["A", "B", "answer_key"] as PreviewVersion[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setPreviewVersion(v);
                      if (v !== "answer_key") setShowAnswers(false);
                    }}
                    className={clsx(
                      "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                      previewVersion === v
                        ? "bg-white text-gray-900 shadow"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {v === "answer_key" ? "Answer Key" : `Version ${v}`}
                  </button>
                ))}
              </div>
              {/* Show answers toggle (only on Answer Key) */}
              {previewVersion === "answer_key" && (
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={showAnswers}
                    onChange={(e) => setShowAnswers(e.target.checked)}
                    className="rounded"
                  />
                  Show Answers
                </label>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <PrinterIcon className="w-4 h-4" />
                Print This Version
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close preview"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Scrollable preview area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <PrintPreview
              generation={previewData}
              version={previewVersion}
              showAnswers={showAnswers}
            />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
