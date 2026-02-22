"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { AcademicCapIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface RegisterForm {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  school_name: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authApi.register(data.email, data.password, data.full_name || undefined, data.school_name || undefined);
      const tokenData = await authApi.login(data.email, data.password);
      const user = await authApi.me();
      setAuth(tokenData, user);
      toast.success("Account created! Welcome to QuizForge.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">QuizForge</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Create your free teacher account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Jane Smith"
                  {...register("full_name")}
                />
              </div>
              <div>
                <label className="label">School (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Lincoln Middle School"
                  {...register("school_name")}
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@school.edu"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "At least 8 characters" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Repeat password"
                {...register("confirm_password", {
                  validate: (v) => v === password || "Passwords do not match",
                })}
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? "Creating account..." : "Create Free Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-4 card bg-primary-50 border-primary-100 p-4">
          <p className="text-xs text-primary-800 font-medium mb-1">Free plan includes:</p>
          <ul className="text-xs text-primary-700 space-y-1">
            <li>✓ 3 quiz generations per day</li>
            <li>✓ Version A & B + Answer Key PDFs</li>
            <li>✓ Multiple question types</li>
            <li>✓ Generation history</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
