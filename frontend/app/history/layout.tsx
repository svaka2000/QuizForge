import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generation History",
  description: "View and download your past quiz generations.",
  robots: { index: false, follow: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
