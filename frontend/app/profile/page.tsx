"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/lib/store";
import { authApi, billingApi } from "@/lib/api";
import type { BillingStatus } from "@/lib/types";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    school_name: user?.school_name || "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    billingApi.status().then(setBillingStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        school_name: user.school_name || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateMe({
        full_name: profileData.full_name || undefined,
        school_name: profileData.school_name || undefined,
      });
      const token = localStorage.getItem("qf_token") || "";
      setAuth(token, updated);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwords.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await billingApi.changePassword(
        passwords.current_password,
        passwords.new_password
      );
      toast.success("Password changed successfully");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to change password";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await billingApi.deleteAccount(deletePassword);
      clearAuth();
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete account";
      toast.error(msg);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { portal_url } = await billingApi.portal();
      window.location.href = portal_url;
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>

          {/* Profile */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Personal Information
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  className="input-field bg-gray-50 cursor-not-allowed"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input-field"
                  value={profileData.full_name}
                  onChange={(e) =>
                    setProfileData((p) => ({ ...p, full_name: e.target.value }))
                  }
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="label">School / Organization</label>
                <input
                  className="input-field"
                  value={profileData.school_name}
                  onChange={(e) =>
                    setProfileData((p) => ({ ...p, school_name: e.target.value }))
                  }
                  placeholder="Lincoln Elementary"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Subscription */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Subscription
            </h2>
            {billingStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span
                    className={`badge ${
                      billingStatus.tier === "pro" ? "badge-blue" : "badge-gray"
                    }`}
                  >
                    {billingStatus.tier.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-gray-800">
                    {billingStatus.subscription_status}
                  </span>
                </div>
                {billingStatus.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {billingStatus.cancel_at_period_end
                        ? "Cancels on"
                        : "Renews on"}
                    </span>
                    <span className="text-sm text-gray-800">
                      {new Date(billingStatus.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="pt-2 flex gap-3">
                  {billingStatus.tier !== "pro" ? (
                    <a href="/upgrade" className="btn-primary text-sm">
                      Upgrade to Pro
                    </a>
                  ) : (
                    <button
                      onClick={handleManageBilling}
                      className="btn-outline text-sm"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-pulse h-20 bg-gray-100 rounded" />
            )}
          </div>

          {/* Change Password */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwords.current_password}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      current_password: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwords.new_password}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      new_password: e.target.value,
                    }))
                  }
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwords.confirm_password}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      confirm_password: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={changingPassword}
              >
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="card border-2 border-red-100">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger"
            >
              Delete Account
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Account"
          message="This will permanently delete your account and all quiz generations. Type your password to confirm."
          confirmLabel="Delete Forever"
          cancelLabel="Cancel"
          danger
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      </div>
    </AuthGuard>
  );
}
