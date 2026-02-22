"use client";
import Link from "next/link";
import {
  AcademicCapIcon,
  BoltIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  ShieldCheckIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: BoltIcon,
    title: "Instant Generation",
    desc: "Generate complete quizzes in seconds, not hours. AI handles the heavy lifting.",
  },
  {
    icon: DocumentDuplicateIcon,
    title: "Two Versions, One Click",
    desc: "Get Version A and Version B automatically. Same skills, different questions — perfect for preventing cheating.",
  },
  {
    icon: KeyIcon,
    title: "Answer Keys Included",
    desc: "Every generation includes a professionally formatted answer key with explanations.",
  },
  {
    icon: AcademicCapIcon,
    title: "Standards-Aligned",
    desc: "Specify your standards (Common Core, NGSS, etc.) and Claude ensures full alignment.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Multiple Question Types",
    desc: "Multiple choice, short answer, word problems, and diagram-based questions.",
  },
  {
    icon: StarIcon,
    title: "Professional PDFs",
    desc: "Download print-ready PDFs with proper formatting, point values, and student info fields.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">QuizForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-outline text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-700/60 border border-primary-500/40 rounded-full px-4 py-1.5 text-sm mb-6">
            <BoltIcon className="w-4 h-4 text-yellow-400" />
            <span>Powered by Claude AI</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Generate Perfect Quizzes
            <br />
            <span className="text-primary-200">in Seconds, Not Hours</span>
          </h1>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            QuizForge uses AI to instantly create standards-aligned worksheets, quizzes, and answer
            keys — with two unique versions so every student gets a different test.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-8 py-3 bg-white text-primary-700 hover:bg-primary-50">
              Start for Free — No Credit Card
            </Link>
            <Link href="/login" className="btn-outline text-base px-8 py-3 border-white/30 text-white hover:bg-white/10">
              Sign In
            </Link>
          </div>
          <p className="text-primary-300 text-sm mt-4">3 free generations per day • No setup required</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Everything Teachers Need
          </h2>
          <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">
            From a single input to print-ready PDFs — no formatting, no copying, no wasted prep time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="group">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <f.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to save hours of prep time?
          </h2>
          <p className="text-slate-600 mb-8">
            Join thousands of teachers using QuizForge to generate better assessments faster.
          </p>
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <AcademicCapIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">QuizForge</span>
          </div>
          <span>© {new Date().getFullYear()} QuizForge. Built for teachers.</span>
        </div>
      </footer>
    </div>
  );
}
