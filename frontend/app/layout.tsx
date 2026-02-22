import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "QuizForge — AI Quiz & Worksheet Generator for Teachers",
  description:
    "Generate standards-aligned quizzes, worksheets, and answer keys instantly with AI. Perfect for K-12 teachers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
