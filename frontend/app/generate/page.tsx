"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AuthGuard from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { generationsApi } from "@/lib/api";
import type { GenerationRequest, Difficulty } from "@/lib/types";
import {
  BoltIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English Language Arts",
  "Social Studies",
  "History",
  "Biology",
  "Chemistry",
  "Physics",
  "Algebra",
  "Geometry",
  "Other",
];
const GRADES = [
  "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "College",
];
const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy", label: "Easy", desc: "Recall & recognition" },
  { value: "medium", label: "Medium", desc: "Application & analysis" },
  { value: "hard", label: "Hard", desc: "Evaluation & synthesis" },
  { value: "mixed", label: "Mixed", desc: "All levels" },
];

const TEMPLATES = [
  {
    label: "Math Quiz",
    emoji: "🔢",
    values: {
      topic: "Fractions and Decimals",
      subject: "Mathematics",
      grade_level: "6",
      difficulty: "medium" as Difficulty,
      question_count: 10,
      include_multiple_choice: true,
      include_short_answer: false,
      include_word_problems: true,
    },
  },
  {
    label: "Science Test",
    emoji: "🔬",
    values: {
      topic: "Photosynthesis",
      subject: "Science",
      grade_level: "7",
      difficulty: "medium" as Difficulty,
      question_count: 10,
      include_multiple_choice: true,
      include_short_answer: true,
      include_word_problems: false,
    },
  },
  {
    label: "ELA Quiz",
    emoji: "📚",
    values: {
      topic: "Parts of Speech",
      subject: "English Language Arts",
      grade_level: "5",
      difficulty: "easy" as Difficulty,
      question_count: 8,
      include_multiple_choice: true,
      include_short_answer: true,
      include_word_problems: false,
    },
  },
  {
    label: "History Review",
    emoji: "🌍",
    values: {
      topic: "The American Revolution",
      subject: "History",
      grade_level: "8",
      difficulty: "hard" as Difficulty,
      question_count: 12,
      include_multiple_choice: true,
      include_short_answer: true,
      include_word_problems: false,
    },
  },
];

const TOPIC_MAX = 200;

const PROGRESS_MESSAGES = [
  "Crafting questions...",
  "Building Version A...",
  "Shuffling Version B...",
  "Generating answer key...",
  "Creating PDFs...",
  "Almost done...",
];

interface FormData extends GenerationRequest {}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState(PROGRESS_MESSAGES[0]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      defaultValues: {
        topic: searchParams.get("topic") || "",
        subject: searchParams.get("subject") || "Mathematics",
        grade_level: searchParams.get("grade_level") || "7",
        difficulty: (searchParams.get("difficulty") as Difficulty) || "medium",
        question_count: Number(searchParams.get("question_count")) || 10,
        include_multiple_choice: true,
        include_short_answer: true,
        include_word_problems: false,
        include_diagrams: false,
        points_per_question: 10,
      },
    });

  const difficulty = watch("difficulty");
  const mc = watch("include_multiple_choice");
  const sa = watch("include_short_answer");
  const wp = watch("include_word_problems");
  const topic = watch("topic");

  // Cycle through progress messages while loading
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PROGRESS_MESSAGES.length;
      setProgressMsg(PROGRESS_MESSAGES[i]);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const applyTemplate = (
    values: Partial<FormData> & { difficulty: Difficulty }
  ) => {
    Object.entries(values).forEach(([key, val]) => {
      setValue(key as keyof FormData, val as never);
    });
    toast.success("Template applied!");
  };

  const onSubmit = async (data: FormData) => {
    if (!mc && !sa && !wp) {
      toast.error("Select at least one question type");
      return;
    }
    setLoading(true);
    setProgressMsg(PROGRESS_MESSAGES[0]);
    try {
      const gen = await generationsApi.create(data);
      toast.success("Quiz generated successfully!");
      router.push(`/generation/${gen.id}`);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { detail?: string }; status?: number };
      };
      if (error?.response?.status === 429) {
        toast.error(
          "Daily limit reached. Upgrade to Pro for more generations."
        );
      } else {
        toast.error(
          error?.response?.data?.detail || "Generation failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Generate a Quiz</h1>
            <p className="text-gray-500 text-sm mt-1">
              Fill in the details below and get Version A, Version B, and an Answer
              Key instantly.
            </p>
          </div>

          {/* Quick Templates */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Quick Templates
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t.values)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-full bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-indigo-700">
                1. Quiz Details
              </h2>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label">Topic *</label>
                  <span
                    className={clsx(
                      "text-xs",
                      topic.length > TOPIC_MAX * 0.9
                        ? "text-red-500"
                        : "text-gray-400"
                    )}
                  >
                    {topic.length}/{TOPIC_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Photosynthesis, The American Revolution, Fractions..."
                  maxLength={TOPIC_MAX}
                  {...register("topic", {
                    required: "Topic is required",
                    minLength: {
                      value: 2,
                      message: "At least 2 characters",
                    },
                  })}
                />
                {errors.topic && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.topic.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject *</label>
                  <select
                    className="input-field"
                    {...register("subject", { required: true })}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Grade Level *</label>
                  <select
                    className="input-field"
                    {...register("grade_level", { required: true })}
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Standards
                  <span className="text-gray-400 font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pr-8"
                    placeholder="e.g., CCSS.MATH.CONTENT.6.RP.A.1, NGSS MS-LS1-6..."
                    title="Enter Common Core, NGSS, or other curriculum standards to align your quiz"
                    {...register("standards")}
                  />
                  <InformationCircleIcon
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    title="Enter Common Core, NGSS, or other curriculum standards"
                  />
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-indigo-700">
                2. Difficulty
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setValue("difficulty", d.value)}
                    className={clsx(
                      "p-3 rounded-lg border-2 text-left transition-all",
                      difficulty === d.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <p className="font-semibold text-sm text-gray-900">
                      {d.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types & Count */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-indigo-700">
                3. Question Types
              </h2>

              <div className="space-y-2">
                {[
                  {
                    field: "include_multiple_choice",
                    label: "Multiple Choice",
                    desc: "4 options, single correct answer",
                  },
                  {
                    field: "include_short_answer",
                    label: "Short Answer",
                    desc: "Written response questions",
                  },
                  {
                    field: "include_word_problems",
                    label: "Word Problems",
                    desc: "Scenario-based applied questions",
                  },
                  {
                    field: "include_diagrams",
                    label: "Diagram Placeholders",
                    desc: "Adds [Diagram] sections to PDFs",
                  },
                ].map((item) => (
                  <label
                    key={item.field}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded"
                      {...register(item.field as keyof FormData)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="label">Number of Questions</label>
                  <input
                    type="number"
                    className="input-field"
                    min={1}
                    max={50}
                    {...register("question_count", {
                      valueAsNumber: true,
                      min: 1,
                      max: 50,
                    })}
                  />
                  <p className="text-xs text-gray-400 mt-1">1–50 questions</p>
                </div>
                <div>
                  <label className="label">Points per Question</label>
                  <input
                    type="number"
                    className="input-field"
                    min={1}
                    max={100}
                    {...register("points_per_question", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Word problems get 2× points
                  </p>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex gap-3">
              <InformationCircleIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-800">
                <p className="font-medium mb-1">What you&apos;ll get:</p>
                <ul className="space-y-0.5 text-indigo-700">
                  <li>• Version A worksheet PDF</li>
                  <li>
                    • Version B worksheet PDF (different numbers/phrasing,
                    shuffled order)
                  </li>
                  <li>• Complete Answer Key PDF with explanations</li>
                </ul>
              </div>
            </div>

            {/* Progress indicator */}
            {loading && (
              <div className="bg-white border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-indigo-700 font-medium">
                  {progressMsg}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Quiz
                  <BoltIcon className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}
