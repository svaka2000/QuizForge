import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your QuizForge dashboard — generate quizzes and track your usage.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
