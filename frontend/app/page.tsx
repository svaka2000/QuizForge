"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  AcademicCapIcon,
  BoltIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  ShieldCheckIcon,
  StarIcon,
  CheckIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// ---------------------------------------------------------------------------
// 11E: Animated counter hook (Intersection Observer)
// ---------------------------------------------------------------------------
function useAnimatedCounter(target: number, duration = 1600, startOnMount = false) {
  const [value, setValue] = useState(0);
  const [triggered, setTriggered] = useState(startOnMount);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!triggered) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [triggered, target, duration]);

  return { value, ref };
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

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

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: PencilSquareIcon,
    title: "Describe Your Quiz",
    desc: "Enter the topic, subject, grade level, difficulty, and question types. Takes less than 60 seconds.",
  },
  {
    step: "2",
    icon: SparklesIcon,
    title: "AI Generates Everything",
    desc: "Claude creates two unique quiz versions and a complete answer key with explanations — aligned to your standards.",
  },
  {
    step: "3",
    icon: ArrowDownTrayIcon,
    title: "Download & Print",
    desc: "Download print-ready PDFs instantly. Hand out Version A and B to different rows — cheating stopped.",
  },
];

// 11D: enriched testimonials with school name
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "8th Grade Science Teacher",
    school: "Riverside Middle School, CA",
    text: "QuizForge saves me 3+ hours every week. I used to spend all Sunday making tests. Now I generate them in minutes before class.",
    initials: "SM",
    color: "bg-violet-600",
  },
  {
    name: "James T.",
    role: "High School Math Dept. Head",
    school: "Lincoln Unified School District, TX",
    text: "The two-version feature is brilliant. My students can't share answers anymore, and the questions are genuinely high quality.",
    initials: "JT",
    color: "bg-indigo-600",
  },
  {
    name: "Lisa K.",
    role: "5th Grade ELA Teacher",
    school: "Maplewood Elementary, NY",
    text: "Standards alignment is the best part. I enter my Common Core codes and the quiz actually matches what I need to assess.",
    initials: "LK",
    color: "bg-emerald-600",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for trying out QuizForge",
    features: [
      "3 quiz generations per day",
      "All question types",
      "Version A & B worksheets",
      "Answer key included",
      "PDF downloads",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    desc: "For teachers who quiz regularly",
    features: [
      "Unlimited quiz generations",
      "All question types",
      "Version A & B worksheets",
      "Answer key included",
      "PDF downloads",
      "Generation history",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/register?plan=pro",
    highlight: true,
  },
];

const FAQS = [
  {
    q: "How many quizzes can I generate for free?",
    a: "Free accounts get 3 quiz generations per day — plenty to try out QuizForge and see the quality. Pro accounts get unlimited generations.",
  },
  {
    q: "What subjects and grade levels does QuizForge support?",
    a: "QuizForge supports all K–12 subjects including Math, Science, ELA, Social Studies, History, Biology, Chemistry, Physics, Algebra, Geometry, and more. It works for grades K through 12 and College level.",
  },
  {
    q: "Can I align quizzes to specific curriculum standards?",
    a: "Yes! You can enter Common Core, NGSS, or any other curriculum standards code in the Standards field, and Claude will align the quiz questions accordingly.",
  },
  {
    q: "How different are Version A and Version B?",
    a: "The AI generates genuinely different questions covering the same learning objectives — not just shuffled options. Word problems use different numbers and scenarios. Multiple choice options are reformulated. This prevents answer sharing between students.",
  },
  {
    q: "What formats are the downloads in?",
    a: "All downloads are print-ready PDFs with proper formatting, student name/date fields, point values per question, and professional layout. The answer key includes explanations for each answer.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Absolutely. You can cancel anytime from your account settings. You'll keep Pro access until the end of your current billing period.",
  },
];

// ---------------------------------------------------------------------------
// 11A: Live demo browser chrome
// ---------------------------------------------------------------------------
function HeroBrowserDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 2000);
    return () => clearInterval(id);
  }, []);

  const formRows = [
    { label: "Topic", value: "Photosynthesis", done: step >= 1 },
    { label: "Grade", value: "7th Grade", done: step >= 2 },
    { label: "Questions", value: "10 questions", done: step >= 3 },
  ];

  return (
    <div className="mt-12 max-w-2xl mx-auto">
      {/* Browser chrome */}
      <div className="bg-slate-800 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 mx-4 bg-slate-700 rounded text-slate-400 text-xs py-1 px-3 text-center truncate">
          app.quizforge.io/generate
        </div>
      </div>

      {/* App window */}
      <div className="bg-white rounded-b-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          {/* Left: form */}
          <div className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quiz Settings</p>
            <div className="space-y-2.5">
              {formRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      row.done ? "bg-indigo-600" : "border border-slate-300"
                    }`}
                  >
                    {row.done && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400">{row.label}</p>
                    <p className={`text-xs font-medium transition-colors ${row.done ? "text-slate-800" : "text-slate-300"}`}>
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className={`mt-5 w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                step >= 3
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step >= 3 ? "✓ Generated!" : "Generate Quiz"}
            </button>
          </div>

          {/* Right: output */}
          <div className="p-5 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Output</p>
            <div className="space-y-2">
              {[
                { label: "Version A PDF", ready: step >= 3 },
                { label: "Version B PDF", ready: step >= 3 },
                { label: "Answer Key PDF", ready: step >= 3 },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border transition-all ${
                    item.ready
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.ready ? (
                    <span className="text-green-600 font-bold">✓ Ready</span>
                  ) : (
                    <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-400 rounded-full animate-spin inline-block" />
                  )}
                </div>
              ))}
            </div>
            {step >= 3 && (
              <p className="text-[10px] text-indigo-600 font-semibold mt-3 text-center animate-pulse">
                ⚡ Generated in 38 seconds
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11B + 11E: Stat bar with animated counters
// ---------------------------------------------------------------------------
function StatBar() {
  const quizzes = useAnimatedCounter(2847, 1800);
  const teachers = useAnimatedCounter(127, 1400);
  const seconds = useAnimatedCounter(45, 1200);

  return (
    <section className="bg-white border-b border-slate-100 py-6 px-4">
      <div ref={quizzes.ref} className="max-w-3xl mx-auto grid grid-cols-3 divide-x divide-slate-200 text-center">
        <div className="px-4">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ChartBarIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-2xl font-bold text-slate-900">{quizzes.value.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-500">quizzes generated</p>
        </div>
        <div className="px-4">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <UserGroupIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-2xl font-bold text-slate-900">{teachers.value.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-500">teachers active</p>
        </div>
        <div className="px-4">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ClockIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-2xl font-bold text-slate-900">{seconds.value}s</span>
          </div>
          <p className="text-xs text-slate-500">avg generation time</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 11C: Version A vs B side-by-side demo
// ---------------------------------------------------------------------------
function VersionCompareDemo() {
  const versionA = [
    { num: 1, q: "What is the primary pigment used in photosynthesis?", opts: ["A. Chlorophyll", "B. Carotene", "C. Xanthophyll", "D. Anthocyanin"], ans: "A" },
    { num: 2, q: "Where does the light-dependent reaction occur?", opts: ["A. Stroma", "B. Thylakoid membrane", "C. Cytoplasm", "D. Nucleus"], ans: "B" },
  ];
  const versionB = [
    { num: 1, q: "Which molecule absorbs sunlight to power photosynthesis?", opts: ["A. ATP", "B. NADPH", "C. Chlorophyll", "D. Glucose"], ans: "C" },
    { num: 2, q: "In which organelle does photosynthesis take place?", opts: ["A. Mitochondria", "B. Nucleus", "C. Ribosome", "D. Chloroplast"], ans: "D" },
  ];

  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            Anti-Cheating Technology
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Same Topic. Genuinely Different Questions.
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            QuizForge doesn't just shuffle options — it generates entirely new questions testing the same
            learning objectives. Students can&apos;t share answers even if they try.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Version A */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
              <span className="text-white font-bold text-sm">Version A</span>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">Student Copy</span>
            </div>
            <div className="p-5 space-y-5">
              {versionA.map((q) => (
                <div key={q.num}>
                  <p className="text-sm font-semibold text-slate-800 mb-2">{q.num}. {q.q}</p>
                  <ul className="space-y-1">
                    {q.opts.map((opt) => (
                      <li
                        key={opt}
                        className={`text-xs px-3 py-1.5 rounded-lg ${
                          opt.startsWith(q.ans)
                            ? "bg-indigo-50 text-indigo-700 font-medium border border-indigo-200"
                            : "text-slate-500"
                        }`}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Version B */}
          <div className="bg-white rounded-2xl border-2 border-violet-200 shadow-sm overflow-hidden">
            <div className="bg-violet-600 px-5 py-3 flex items-center justify-between">
              <span className="text-white font-bold text-sm">Version B</span>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">Student Copy</span>
            </div>
            <div className="p-5 space-y-5">
              {versionB.map((q) => (
                <div key={q.num}>
                  <p className="text-sm font-semibold text-slate-800 mb-2">{q.num}. {q.q}</p>
                  <ul className="space-y-1">
                    {q.opts.map((opt) => (
                      <li
                        key={opt}
                        className={`text-xs px-3 py-1.5 rounded-lg ${
                          opt.startsWith(q.ans)
                            ? "bg-violet-50 text-violet-700 font-medium border border-violet-200"
                            : "text-slate-500"
                        }`}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Both versions cover the same 7th Grade Science standard on Photosynthesis (NGSS MS-LS1-6)
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-start justify-between gap-4"
      >
        <span className="font-medium text-slate-900 text-sm leading-relaxed">{q}</span>
        <ChevronDownIcon
          className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-slate-600 text-sm pb-5 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">QuizForge</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900">How It Works</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
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
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-700/60 border border-indigo-500/40 rounded-full px-4 py-1.5 text-sm mb-6">
            <BoltIcon className="w-4 h-4 text-yellow-400" />
            <span>Powered by Claude AI</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Generate Perfect Quizzes
            <br />
            <span className="text-indigo-200">in Seconds, Not Hours</span>
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            QuizForge uses AI to instantly create standards-aligned worksheets, quizzes, and answer
            keys — with two unique versions so every student gets a different test.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              Start for Free — No Credit Card
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
          <p className="text-indigo-300 text-sm mt-4">3 free generations per day • No setup required</p>

          {/* 11A: Browser-chrome live demo */}
          <HeroBrowserDemo />
        </div>
      </section>

      {/* 11B: Stat bar */}
      <StatBar />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">
            How It Works
          </h2>
          <p className="text-slate-500 text-center mb-14 max-w-lg mx-auto">
            From topic to print-ready PDF in under two minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-6 h-6 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center justify-center">
                  {step.step}
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11C: Version A vs B demo */}
      <VersionCompareDemo />

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
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <f.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11D: Testimonials with enriched avatars */}
      <section className="py-20 px-4 bg-indigo-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">
            Loved by Teachers
          </h2>
          <p className="text-slate-500 text-center mb-14 max-w-lg mx-auto">
            Join thousands of educators saving hours every week.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 ${t.color} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{t.school}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">
            Simple, Honest Pricing
          </h2>
          <p className="text-slate-500 text-center mb-14 max-w-lg mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-8 ${
                  plan.highlight
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm ml-1">/ {plan.period}</span>
                </div>
                <p className="text-slate-500 text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-center mb-12">
            Everything you need to know about QuizForge.
          </p>
          <div className="bg-white rounded-2xl shadow-sm px-6">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">
            Still have questions?{" "}
            <Link href="/contact" className="text-indigo-600 hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 px-4 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to save hours of prep time?
          </h2>
          <p className="text-indigo-200 mb-8">
            Join thousands of teachers using QuizForge to generate better assessments faster.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            Create Your Free Account
          </Link>
          <p className="text-indigo-300 text-sm mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 text-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-base">QuizForge</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                AI-powered quiz generator for K–12 teachers. Create standards-aligned assessments in seconds.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3">Product</p>
              <ul className="space-y-2">
                <li><a href="#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-slate-200 transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-slate-200 transition-colors">FAQ</a></li>
                <li><Link href="/register" className="hover:text-slate-200 transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3">Company</p>
              <ul className="space-y-2">
                <li><Link href="/contact" className="hover:text-slate-200 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-slate-200 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-slate-200 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} QuizForge. Built for teachers.</span>
            <span className="text-slate-600">Powered by Claude AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
