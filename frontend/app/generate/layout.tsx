import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Quiz",
  description: "Create a new AI-powered quiz or worksheet with QuizForge.",
  robots: { index: false, follow: false },
};

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
