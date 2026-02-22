"use client";
import type { GenerationPreview, PreviewVersion, Question } from "@/lib/types";

interface PrintPreviewProps {
  generation: GenerationPreview;
  version: PreviewVersion;
  showAnswers: boolean;
}

function AnswerBubble({ letter, correct, showAnswers }: { letter: string; correct: boolean; showAnswers: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-semibold mr-2 shrink-0 print-bubble ${
        showAnswers && correct
          ? "bg-black text-white border-black"
          : "border-gray-700 text-gray-700 bg-white"
      }`}
    >
      {letter}
    </span>
  );
}

function QuestionBlock({
  q,
  num,
  showAnswers,
  answerKeyEntry,
}: {
  q: Question;
  num: number;
  showAnswers: boolean;
  answerKeyEntry?: { answer: string; explanation: string };
}) {
  const LETTERS = ["A", "B", "C", "D", "E"];

  return (
    <div className="mb-6 break-inside-avoid">
      <div className="flex items-start gap-2">
        <span className="font-semibold text-sm w-6 shrink-0">{num}.</span>
        <div className="flex-1">
          <p className="text-sm leading-snug mb-1">
            {q.question}
            <span className="ml-2 text-xs text-gray-500">({q.points} pts)</span>
          </p>

          {q.type === "multiple_choice" && q.options && (
            <div className="mt-2 space-y-1.5 ml-1">
              {q.options.map((opt, i) => {
                const isCorrect = opt === q.correct_answer;
                return (
                  <div key={i} className={`flex items-start ${showAnswers && isCorrect ? "font-semibold" : ""}`}>
                    <AnswerBubble letter={LETTERS[i]} correct={isCorrect} showAnswers={showAnswers} />
                    <span className="text-sm">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {q.type === "short_answer" && (
            <div className="mt-2 ml-1 space-y-3">
              {showAnswers && answerKeyEntry ? (
                <p className="text-sm italic text-gray-700 border-l-2 border-gray-400 pl-2">
                  {answerKeyEntry.answer}
                </p>
              ) : (
                <>
                  <div className="border-b border-gray-400 h-5 w-full" />
                  <div className="border-b border-gray-400 h-5 w-full" />
                  <div className="border-b border-gray-400 h-5 w-3/4" />
                </>
              )}
            </div>
          )}

          {q.type === "word_problem" && (
            <div className="mt-2 ml-1 space-y-3">
              {showAnswers && answerKeyEntry ? (
                <p className="text-sm italic text-gray-700 border-l-2 border-gray-400 pl-2">
                  {answerKeyEntry.answer}
                  {answerKeyEntry.explanation && (
                    <span className="block text-xs text-gray-500 mt-1">{answerKeyEntry.explanation}</span>
                  )}
                </p>
              ) : (
                <>
                  <div className="border-b border-gray-400 h-5 w-full" />
                  <div className="border-b border-gray-400 h-5 w-full" />
                  <div className="border-b border-gray-400 h-5 w-full" />
                  <div className="border-b border-gray-400 h-5 w-2/3" />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PrintPreview({ generation, version, showAnswers }: PrintPreviewProps) {
  const isAnswerKey = version === "answer_key";
  const questions: Question[] = isAnswerKey
    ? generation.questions_a
    : version === "A"
    ? generation.questions_a
    : generation.questions_b;

  const answerKeyData = isAnswerKey
    ? generation.answer_key?.version_a
    : version === "A"
    ? generation.answer_key?.version_a
    : generation.answer_key?.version_b;

  const versionLabel = isAnswerKey ? "Answer Key" : `Version ${version}`;
  const totalPoints = isAnswerKey
    ? generation.answer_key?.total_points_a ?? 0
    : version === "A"
    ? generation.answer_key?.total_points_a ?? 0
    : generation.answer_key?.total_points_b ?? 0;

  return (
    <>
      {/* Print-only styles injected globally */}
      <style>{`
        @media print {
          body > *:not(#print-preview-root) { display: none !important; }
          #print-preview-root { display: block !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 0.75in !important; }
        }
      `}</style>

      <div
        id="print-preview-root"
        className="print-page bg-white shadow-xl mx-auto"
        style={{ maxWidth: "816px", minHeight: "1056px", padding: "72px 80px", fontFamily: "serif" }}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-3 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{generation.subject}: {generation.topic}</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Grade {generation.grade_level} &bull; {generation.difficulty.charAt(0).toUpperCase() + generation.difficulty.slice(1)} &bull; {versionLabel}
              </p>
              {generation.standards && (
                <p className="text-xs text-gray-500 mt-0.5">Standards: {generation.standards}</p>
              )}
            </div>
            <div className="text-right text-sm font-semibold">
              <p>Total Points: {totalPoints}</p>
              {isAnswerKey && (
                <p className="text-xs font-bold text-red-700 mt-1">TEACHER COPY — DO NOT DISTRIBUTE</p>
              )}
            </div>
          </div>

          {!isAnswerKey && (
            <div className="flex gap-8 mt-3">
              <div className="flex-1">
                <span className="text-xs text-gray-500">Name: </span>
                <span className="inline-block border-b border-black w-48" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500">Date: </span>
                <span className="inline-block border-b border-black w-32" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500">Period: </span>
                <span className="inline-block border-b border-black w-20" />
              </div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div>
          {questions.map((q, idx) => {
            const keyEntry = answerKeyData?.find((k) => k.id === q.id);
            return (
              <QuestionBlock
                key={`${q.id}-${idx}`}
                q={q}
                num={idx + 1}
                showAnswers={showAnswers || isAnswerKey}
                answerKeyEntry={keyEntry}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-2 mt-8 flex justify-between text-xs text-gray-400">
          <span>Generated by QuizForge</span>
          <span>{versionLabel}</span>
          <span>Page 1</span>
        </div>
      </div>
    </>
  );
}

export default PrintPreview;
