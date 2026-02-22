"use client";
import Link from "next/link";
import { useState } from "react";
import { AcademicCapIcon, EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send this to an API endpoint or Formspree / similar
    // For now, we just show a success state
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">QuizForge</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Contact Us</h1>
          <p className="text-slate-500">
            Have a question, feedback, or need help? We&apos;d love to hear from you.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Message Sent!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Thanks for reaching out. We typically respond within 1–2 business days.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Jane Smith"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="jane@school.edu"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Subject</label>
                <select
                  className="input-field"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                >
                  <option value="">Select a subject...</option>
                  <option value="billing">Billing / Subscription</option>
                  <option value="bug">Report a Bug</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Help</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Message</label>
                <textarea
                  className="input-field min-h-[140px] resize-y"
                  placeholder="Tell us how we can help..."
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3">
                Send Message
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                You can also email us directly at{" "}
                <a
                  href="mailto:support@quizforge.app"
                  className="text-indigo-600 hover:underline"
                >
                  support@quizforge.app
                </a>
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-sm mt-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>© {new Date().getFullYear()} QuizForge</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-200">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-200">Terms</Link>
            <Link href="/contact" className="hover:text-slate-200">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
