import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://quizforge.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "QuizForge — AI Quiz & Worksheet Generator for Teachers",
    template: "%s — QuizForge",
  },
  description:
    "Generate standards-aligned quizzes, worksheets, and answer keys instantly with AI. Two unique versions to prevent cheating. Perfect for K-12 teachers.",
  keywords: [
    "quiz generator",
    "worksheet generator",
    "AI quiz maker",
    "teacher tools",
    "K-12 assessment",
    "Common Core aligned",
    "answer key generator",
  ],
  authors: [{ name: "QuizForge" }],
  creator: "QuizForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "QuizForge",
    title: "QuizForge — AI Quiz & Worksheet Generator for Teachers",
    description:
      "Generate standards-aligned quizzes, worksheets, and answer keys instantly with AI. Two unique versions to prevent cheating.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QuizForge — AI Quiz Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizForge — AI Quiz Generator for Teachers",
    description:
      "Generate quizzes, worksheets, and answer keys instantly with AI. Two unique versions to prevent cheating.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                fontSize: "14px",
                borderRadius: "10px",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#f8fafc" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#f8fafc" } },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
