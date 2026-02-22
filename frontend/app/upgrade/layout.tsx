import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade to Pro",
  description: "Get unlimited quiz generations with QuizForge Pro.",
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
