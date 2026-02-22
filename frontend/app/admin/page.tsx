"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { User } from "@/lib/types";

interface AdminStats {
  total_users: number;
  total_generations: number;
  generations_today: number;
  free_users: number;
  pro_users: number;
  generations_by_day: { day: string; count: number }[];
  top_subjects: { subject: string; count: number }[];
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "generations">("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.is_admin) return;
    const loadData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          adminApi.stats(),
          adminApi.users(),
        ]);
        setStats(statsData);
        setUsers(usersData);
      } catch {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handlePromote = async (userId: number) => {
    setActionLoading(userId);
    try {
      await adminApi.promoteUser(userId);
      toast.success("User promoted to PRO");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, tier: "pro" } : u))
      );
    } catch {
      toast.error("Failed to promote user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async (userId: number) => {
    setActionLoading(userId);
    try {
      await adminApi.disableUser(userId);
      toast.success("User disabled");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
      );
    } catch {
      toast.error("Failed to disable user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnable = async (userId: number) => {
    setActionLoading(userId);
    try {
      await adminApi.enableUser(userId);
      toast.success("User enabled");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: true } : u))
      );
    } catch {
      toast.error("Failed to enable user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/users/export`,
      "_blank"
    );
  };

  if (!user?.is_admin) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <span className="badge badge-red">Admin</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            {(["overview", "users", "generations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && stats && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Total Users", value: stats.total_users, color: "text-blue-600" },
                      { label: "Free Users", value: stats.free_users, color: "text-gray-600" },
                      { label: "Pro Users", value: stats.pro_users, color: "text-indigo-600" },
                      { label: "Total Generations", value: stats.total_generations, color: "text-green-600" },
                      { label: "Today", value: stats.generations_today, color: "text-orange-600" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="card text-center">
                        <div className={`text-3xl font-bold ${color}`}>{value}</div>
                        <div className="text-xs text-gray-500 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Generations per Day (last 30)
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={stats.generations_by_day}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="card">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Top Subjects
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.top_subjects}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      All Users ({users.length})
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="btn-outline text-sm"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">ID</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Email</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Tier</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 px-3 text-gray-500">{u.id}</td>
                            <td className="py-2 px-3 font-medium">
                              {u.email}
                              {u.is_admin && (
                                <span className="ml-1 badge badge-red text-xs">admin</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              {u.full_name || "—"}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`badge ${
                                  u.tier === "pro" ? "badge-blue" : "badge-gray"
                                }`}
                              >
                                {u.tier}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`badge ${
                                  u.is_active ? "badge-green" : "badge-red"
                                }`}
                              >
                                {u.is_active ? "active" : "disabled"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex gap-1">
                                {u.tier === "free" && !u.is_admin && (
                                  <button
                                    onClick={() => handlePromote(u.id)}
                                    disabled={actionLoading === u.id}
                                    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                                  >
                                    Promote
                                  </button>
                                )}
                                {!u.is_admin && (
                                  u.is_active ? (
                                    <button
                                      onClick={() => handleDisable(u.id)}
                                      disabled={actionLoading === u.id}
                                      className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                                    >
                                      Disable
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleEnable(u.id)}
                                      disabled={actionLoading === u.id}
                                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                                    >
                                      Enable
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "generations" && (
                <GenerationsTab />
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function GenerationsTab() {
  const [generations, setGenerations] = useState<
    {
      id: number;
      user_id: number;
      topic: string;
      subject: string;
      grade_level: string;
      status: string;
      generator_used: string | null;
      created_at: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .generations()
      .then(setGenerations)
      .catch(() => toast.error("Failed to load generations"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <h3 className="font-semibold text-gray-800 mb-4">
        All Generations ({generations.length})
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-gray-500 font-medium">ID</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">User</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Topic</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Subject</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Grade</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Generator</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {generations.map((g) => (
            <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 text-gray-500">{g.id}</td>
              <td className="py-2 px-3 text-gray-500">{g.user_id}</td>
              <td className="py-2 px-3 font-medium">{g.topic}</td>
              <td className="py-2 px-3 text-gray-600">{g.subject}</td>
              <td className="py-2 px-3 text-gray-600">{g.grade_level}</td>
              <td className="py-2 px-3">
                <span
                  className={`badge ${
                    g.status === "completed"
                      ? "badge-green"
                      : g.status === "failed"
                      ? "badge-red"
                      : "badge-yellow"
                  }`}
                >
                  {g.status}
                </span>
              </td>
              <td className="py-2 px-3 text-gray-500">{g.generator_used || "—"}</td>
              <td className="py-2 px-3 text-gray-500">
                {new Date(g.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
