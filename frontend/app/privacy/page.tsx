import Link from "next/link";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "Privacy Policy — QuizForge",
};

export default function PrivacyPage() {
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

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: January 1, 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed mb-3">
              When you create an account, we collect your email address, name, and optionally your school name.
              When you use QuizForge to generate quizzes, we store the quiz content, your settings, and the generated PDFs so you can access them in your history.
            </p>
            <p className="text-sm leading-relaxed">
              We also collect basic usage data (like which features you use) to improve the product, and technical logs for debugging and security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>To provide and improve the QuizForge service</li>
              <li>To send you transactional emails (account confirmation, password reset)</li>
              <li>To process payments via Stripe (we do not store your payment card information)</li>
              <li>To generate quizzes using Claude AI — your topic and settings are sent to Anthropic&apos;s API</li>
              <li>To enforce our usage limits and terms of service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Third-Party Services</h2>
            <p className="text-sm leading-relaxed mb-3">
              QuizForge uses the following third-party services:
            </p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Anthropic Claude API</strong> — to generate quiz content. Quiz topics and settings are sent to Anthropic. Review Anthropic&apos;s privacy policy at anthropic.com.</li>
              <li><strong>Stripe</strong> — to process Pro subscription payments. Stripe handles all payment card data. Review Stripe&apos;s privacy policy at stripe.com.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Retention</h2>
            <p className="text-sm leading-relaxed">
              We retain your account data and quiz history for as long as your account is active.
              If you delete your account, your data is removed within 30 days. You can delete your account at any time from your profile settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Your Rights</h2>
            <p className="text-sm leading-relaxed mb-3">
              You have the right to access, correct, or delete your personal data. You can:
            </p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>Update your profile information in account settings</li>
              <li>Change your password in account settings</li>
              <li>Delete your account from the Danger Zone in profile settings</li>
              <li>Contact us at the address below with any data requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Security</h2>
            <p className="text-sm leading-relaxed">
              We use industry-standard encryption for data in transit (HTTPS) and at rest. Passwords are hashed using bcrypt. We never store your payment card information — Stripe handles this securely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Contact</h2>
            <p className="text-sm leading-relaxed">
              If you have questions about this Privacy Policy, please{" "}
              <Link href="/contact" className="text-indigo-600 hover:underline">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
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
