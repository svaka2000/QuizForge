"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AcademicCapIcon, HomeIcon, PlusCircleIcon, ClockIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/generate", label: "Generate Quiz", icon: PlusCircleIcon },
  { href: "/history", label: "History", icon: ClockIcon },
];

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearAuth();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">QuizForge</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User section */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-900 truncate max-w-[120px]">
                  {user.full_name || user.email.split("@")[0]}
                </p>
                <span className={clsx(
                  "text-xs px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide",
                  user.tier === "free" ? "bg-slate-100 text-slate-600" : "bg-primary-100 text-primary-700"
                )}>
                  {user.tier}
                </span>
              </div>
            </div>
          )}
          {user?.is_admin && (
            <Link href="/admin" className="btn-outline text-xs py-1.5 px-3">
              <Cog6ToothIcon className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
          <button onClick={handleLogout} className="btn-outline text-xs py-1.5 px-3 text-red-600 border-red-200 hover:bg-red-50">
            <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors",
              pathname === item.href ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
