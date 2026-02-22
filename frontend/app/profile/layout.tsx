import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile & Settings",
  description: "Manage your QuizForge account settings and subscription.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
