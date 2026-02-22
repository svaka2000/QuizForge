"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { hydrate } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    hydrate();
    const token =
      typeof window !== "undefined" ? localStorage.getItem("qf_token") : null;
    if (!token) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [hydrate, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
