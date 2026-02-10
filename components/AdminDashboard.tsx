import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { SocialPost, UserProfile } from "../types";
import VerificationBadge from "./VerificationBadge";

interface AppSettings {
  announcement?: string;
  adminPin?: string;
  donationTarget?: number;
  donationCurrent?: number;
  accountNumber?: string;
  accountName?: string;
  logoUrl?: string;
  maintenanceMode?: boolean;
  verifiedOnlyMode?: boolean;
}

type Tab =
  | "OVERVIEW"
  | "USERS"
  | "CONTENT"
  | "BROADCAST"
  | "LOGS"
  | "SETTINGS"
  | "FEEDBACK";

interface FeedbackEntry {
  id: string;
  user_alias: string | null;
  subject: string;
  message: string;
  email: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface AdminDashboardProps {
  posts: SocialPost[];
  profiles: Record<string, UserProfile>;
  onDelete: (id: string) => Promise<void> | void;
  onMute: (alias: string) => void;
  mutedUsers: string[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => Promise<void> | void;
  currentAdminAlias: string;
  isDarkMode?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  posts,
  profiles,
  onDelete,
  onMute,
  mutedUsers,
  settings,
  onUpdateSettings,
  currentAdminAlias,
  isDarkMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("OVERVIEW");
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [searchUser, setSearchUser] = useState("");
  const [filterVerified, setFilterVerified] = useState<
    "ALL" | "VERIFIED" | "UNVERIFIED" | "BANNED"
  >("ALL");
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: "success" | "error" }[]
  >([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const logAction = async (
    targetAlias: string,
    action: string,
    details?: string,
  ) => {
    try {
      await supabase.from("admin_logs").insert({
        admin_alias: currentAdminAlias,
        target_alias: targetAlias,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
      // Optionally re-fetch logs if on logs tab
      if (activeTab === "LOGS") fetchLogs();
    } catch (err) {
      console.error("Failed to log admin action:", err);
    }
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);
    if (!error && data) setAdminLogs(data);
  };

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setFeedback(data);
  };

  useEffect(() => {
    if (activeTab === "LOGS") fetchLogs();
    if (activeTab === "FEEDBACK") fetchFeedback();
  }, [activeTab]);

  // Sync settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Derived Statistics
  const stats = useMemo(() => {
    const profilesArray = Object.values(profiles) as UserProfile[];
    const totalUsers = profilesArray.length;
    const verifiedUsers = profilesArray.filter((p) => p.is_verified).length;
    const admins = profilesArray.filter(
      (p) => p.is_admin || p.role === "ADMIN",
    ).length;
    const totalMessages = posts.length;

    const newUsers = profilesArray.filter((p) => {
      if (!p.joinedAt) return false;
      const joined = new Date(p.joinedAt);
      const today = new Date();
      return (
        joined.getDate() === today.getDate() &&
        joined.getMonth() === today.getMonth() &&
        joined.getFullYear() === today.getFullYear()
      );
    }).length;

    return { totalUsers, verifiedUsers, admins, totalMessages, newUsers };
  }, [profiles, posts]);

  // Handler: Toggle User Verification
  const handleToggleVerification = async (
    alias: string,
    currentStatus: boolean,
  ) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: !currentStatus })
        .eq("alias", alias);

      if (error) {
        throw error;
      }

      addToast(
        currentStatus ? "Verification removed" : "User verified successfully",
      );
      await logAction(alias, currentStatus ? "UNVERIFY" : "VERIFY");
    } catch (err) {
      console.error("Error toggling verification:", err);
      addToast("Failed to update status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBan = async (alias: string, currentStatus: boolean) => {
    if (
      !window.confirm(
        `Are you sure you want to ${currentStatus ? "unban" : "ban"} ${alias}?`,
      )
    )
      return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentStatus })
        .eq("alias", alias);

      if (error) throw error;

      addToast(currentStatus ? "User unbanned" : "User banned successfully");
      await logAction(alias, currentStatus ? "UNBAN" : "BAN");
    } catch (err: any) {
      console.error("Error toggling ban:", err);
      addToast("Failed to update status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAdmin = async (alias: string, currentStatus: boolean) => {
    if (
      !window.confirm(
        `Are you sure you want to ${currentStatus ? "remove admin rights from" : "promote"} ${alias}?`,
      )
    )
      return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: currentStatus ? "USER" : "ADMIN",
          is_admin: !currentStatus,
        })
        .eq("alias", alias);

      if (error) throw error;

      addToast(
        currentStatus ? "Admin rights removed" : "User promoted to Admin",
      );
      await logAction(alias, currentStatus ? "DEMOTE" : "PROMOTE");
    } catch (err) {
      console.error("Error toggling admin status:", err);
      addToast("Failed to update status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFeedbackRead = async (
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ is_read: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_read: !currentStatus } : f)),
      );
    } catch (err) {
      console.error("Error toggling feedback read status:", err);
      addToast("Failed to update status", "error");
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    try {
      const { error } = await supabase.from("feedback").delete().eq("id", id);
      if (error) throw error;
      setFeedback((prev) => prev.filter((f) => f.id !== id));
      addToast("Feedback deleted");
    } catch (err) {
      console.error("Error deleting feedback:", err);
      addToast("Failed to delete feedback", "error");
    }
  };

  // Handler: Verify All Admins
  const handleVerifyAllAdmins = async () => {
    if (!window.confirm("Are you sure you want to verify ALL admins?")) return;
    setIsUpdating(true);
    try {
      // 1. Find all admins
      const adminAliases = (Object.values(profiles) as UserProfile[])
        .filter((p) => p.role === "ADMIN" || p.is_admin) // Check both potential flags
        .map((p) => p.alias);

      if (adminAliases.length === 0) return;

      // 2. Update them
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: true })
        .in("alias", adminAliases);

      if (error) throw error;

      addToast(`Successfully verified ${adminAliases.length} admins.`);
      await logAction(
        "SYSTEM",
        "VERIFY_ALL_ADMINS",
        `Bulk verified ${adminAliases.length} administrators`,
      );
    } catch (err) {
      console.error("Error verifying admins:", err);
      addToast("Batch update failed.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try {
      await onUpdateSettings(localSettings);
      alert("Settings saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered Users List
  const userList = useMemo(() => {
    return (Object.values(profiles) as UserProfile[])
      .filter((u) => {
        const matchesSearch = u.alias
          .toLowerCase()
          .includes(searchUser.toLowerCase());
        const matchesFilter =
          filterVerified === "ALL"
            ? true
            : filterVerified === "VERIFIED"
              ? u.is_verified
              : filterVerified === "UNVERIFIED"
                ? !u.is_verified
                : u.is_banned;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) =>
        b.is_verified === a.is_verified ? 0 : b.is_verified ? 1 : -1,
      ); // Verified first
  }, [profiles, searchUser, filterVerified]);

  const glassStyle = {
    background: isDarkMode ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.05)",
  };

  return (
    <div
      className={`w-full min-h-screen ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"} p-4 sm:p-6 lg:p-8 space-y-8`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Admin Dashboard
          </h1>
          <p
            className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Manage users, content, and system settings
          </p>
        </div>
        <div className="flex bg-neutral-900/50 p-1 rounded-xl overflow-x-auto max-w-full">
          {(
            [
              "OVERVIEW",
              "USERS",
              "CONTENT",
              "BROADCAST",
              "LOGS",
              "SETTINGS",
              "FEEDBACK",
            ] as Tab[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "FEEDBACK"
                ? "Feedback"
                : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Users",
              value: stats.totalUsers,
              color: "blue",
              icon: "👥",
            },
            {
              label: "Verified Users",
              value: stats.verifiedUsers,
              color: "cyan",
              icon: "💎",
            },
            {
              label: "Admins",
              value: stats.admins,
              color: "purple",
              icon: "🛡️",
            },
            {
              label: "Total Messages",
              value: stats.totalMessages,
              color: "green",
              icon: "💬",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={glassStyle}
              className="p-5 rounded-2xl flex flex-col items-center text-center hover:scale-[1.02] transition-transform"
            >
              <span className="text-2xl mb-2">{stat.icon}</span>
              <span
                className={`text-3xl font-bold text-${stat.color}-400 mb-1`}
              >
                {stat.value}
              </span>
              <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}

          {/* Quick Actions & Recent Activity */}
          <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleVerifyAllAdmins}
                  disabled={isUpdating}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center gap-2"
                >
                  <span>💎</span> Auto-Verify All Admins
                </button>
                <button className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-sm flex items-center gap-2 transition-all">
                  <span>⚡</span> Clear Cache
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
              <div
                style={glassStyle}
                className="rounded-xl overflow-hidden divide-y divide-white/5"
              >
                {(Object.values(profiles) as UserProfile[])
                  .filter((p) => p.joinedAt)
                  .sort(
                    (a, b) =>
                      new Date(b.joinedAt!).getTime() -
                      new Date(a.joinedAt!).getTime(),
                  )
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.alias}
                      className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                          {p.alias[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {p.alias}
                            {p.is_verified && <VerificationBadge size="sm" />}
                          </div>
                          <p className="text-[10px] text-gray-500">
                            Joined {new Date(p.joinedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-green-500 uppercase">
                        New User
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST TAB */}
      {activeTab === "BROADCAST" && (
        <BroadcastTab
          isDarkMode={isDarkMode}
          currentAdminAlias={currentAdminAlias}
          addToast={addToast}
          logAction={logAction}
        />
      )}

      {/* USERS MAGEMENT TAB */}
      {activeTab === "USERS" && (
        <div
          style={glassStyle}
          className="rounded-2xl overflow-hidden min-h-[600px] flex flex-col"
        >
          {/* Controls */}
          <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-auto min-w-[300px]">
              <input
                type="text"
                placeholder="Search users by name or ID..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <svg
                className="w-4 h-4 text-gray-500 absolute left-3 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
              {(["ALL", "VERIFIED", "UNVERIFIED", "BANNED"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilterVerified(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      filterVerified === f
                        ? "bg-white/10 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Table Header (Desktop Only) */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-xs font-bold uppercase tracking-wider text-gray-500">
            <div className="col-span-3">User</div>
            <div className="col-span-2 text-center">Role</div>
            <div className="col-span-2 text-center">Verified</div>
            <div className="col-span-2 text-center">Banned</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {userList.map((user) => (
              <div
                key={user.alias}
                className="flex flex-col lg:grid lg:grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors items-start lg:items-center group"
              >
                {/* User Info */}
                <div className="w-full lg:col-span-3 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${user.is_banned ? "from-red-900 to-red-600" : "from-gray-700 to-gray-600"} flex items-center justify-center text-white font-bold text-sm shrink-0 relative`}
                  >
                    {user.alias[0].toUpperCase()}
                    {user.is_banned && (
                      <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center text-[8px]">
                        🚫
                      </span>
                    )}
                    {!user.is_verified && !user.is_banned && (
                      <span
                        className="absolute -top-1 -right-1 bg-yellow-500 w-3 h-3 rounded-full border-2 border-black"
                        title="Unverified"
                      ></span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm flex items-center gap-1">
                      <span className="truncate">{user.alias}</span>
                      {user.is_verified && <VerificationBadge size="sm" />}
                      {user.is_admin && (
                        <span className="text-xs" title="Admin">
                          👑
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email || "No email"}
                    </div>
                  </div>
                </div>

                {/* Mobile: Stats Row */}
                <div className="flex lg:hidden w-full justify-between items-center bg-black/20 p-2 rounded-lg text-xs gap-2">
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded-md font-bold ${
                        user.is_admin || user.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {user.is_admin || user.role === "ADMIN"
                        ? "ADMIN"
                        : "USER"}
                    </span>
                    {user.is_banned && (
                      <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 font-bold">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-gray-500">Verified</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVerification(
                          user.alias,
                          !!user.is_verified,
                        );
                      }}
                      disabled={isUpdating}
                      className={`w-8 h-4 rounded-full transition-colors relative ${user.is_verified ? "bg-blue-500" : "bg-gray-600"} ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${user.is_verified ? "left-4.5" : "left-0.5"}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Desktop Columns */}
                <div className="hidden lg:block col-span-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAdmin(
                        user.alias,
                        !!(user.is_admin || user.role === "ADMIN"),
                      );
                    }}
                    disabled={isUpdating}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:scale-105 ${
                      user.is_admin || user.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-gray-500/20 text-gray-400 border border-gray-500/10"
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {user.is_admin || user.role === "ADMIN"
                      ? "👑 ADMIN"
                      : "USER"}
                  </button>
                </div>

                <div className="hidden lg:block col-span-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVerification(user.alias, !!user.is_verified);
                    }}
                    disabled={isUpdating}
                    className={`relative w-11 h-6 rounded-full transition-colors mx-auto ${
                      user.is_verified
                        ? "bg-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-gray-700"
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        user.is_verified ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="hidden lg:block col-span-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBan(user.alias, !!user.is_banned);
                    }}
                    disabled={isUpdating}
                    className={`relative w-11 h-6 rounded-full transition-colors mx-auto ${
                      user.is_banned
                        ? "bg-red-500 shadow-lg shadow-red-500/20"
                        : "bg-gray-700"
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        user.is_banned ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="w-full lg:col-span-3 flex justify-end gap-3 lg:gap-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBan(user.alias, !!user.is_banned);
                    }}
                    disabled={isUpdating}
                    className={`flex-1 lg:flex-none px-4 py-2 lg:p-0 rounded-xl lg:rounded-none text-center text-xs lg:text-sm font-bold transition-all ${
                      user.is_banned
                        ? "bg-green-500/10 text-green-500 lg:text-green-400 hover:text-green-300"
                        : "bg-red-500/10 text-red-500 lg:text-red-400 hover:text-red-300"
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {user.is_banned ? "UNBAN" : "BAN"}
                  </button>
                  <button
                    onClick={() =>
                      handleToggleAdmin(
                        user.alias,
                        !!(user.is_admin || user.role === "ADMIN"),
                      )
                    }
                    className="flex-1 lg:flex-none px-4 py-2 lg:p-0 rounded-xl lg:rounded-none bg-white/5 lg:bg-transparent text-center text-xs lg:text-sm text-gray-400 hover:text-white font-bold transition-colors"
                  >
                    PROMOTE
                  </button>
                </div>
              </div>
            ))}
            {userList.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                No users found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === "LOGS" && (
        <div
          style={glassStyle}
          className="rounded-2xl overflow-hidden min-h-[500px] flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
              📜 Admin Activity Logs
            </h2>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
            >
              Refresh Logs
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {adminLogs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold text-sm">
                      @{log.admin_alias}
                    </span>
                    <span className="text-gray-600 text-xs">performed</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                        log.action.includes("BAN")
                          ? "bg-red-500/20 text-red-400"
                          : log.action.includes("VERIFY")
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-gray-600 text-xs">on</span>
                    <span className="text-white font-bold text-sm">
                      @{log.target_alias}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                {log.details && (
                  <p className="mt-2 text-xs text-gray-400 italic">
                    "{log.details}"
                  </p>
                )}
              </div>
            ))}
            {adminLogs.length === 0 && (
              <div className="p-20 text-center text-gray-600 uppercase tracking-[0.2em] font-black text-xs">
                No Activity Recorded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto ${
              toast.type === "success"
                ? "bg-blue-600/90 border-blue-400/30 text-white"
                : "bg-red-600/90 border-red-400/30 text-white"
            }`}
          >
            <span className="text-xl">
              {toast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="font-bold text-sm tracking-tight">
              {toast.message}
            </span>
          </div>
        ))}
      </div>

      {/* CONTENT MODERATION TAB */}
      {activeTab === "CONTENT" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              style={glassStyle}
              className="p-4 rounded-xl flex flex-col gap-3 relative group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{post.authorAlias}</span>
                  {profiles[post.authorAlias]?.is_verified && (
                    <VerificationBadge size="sm" />
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg">
                {post.content}
              </p>

              <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => onDelete(post.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                >
                  Delete Post
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              No posts to show.
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "SETTINGS" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div style={glassStyle} className="p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">⚙️</span> System Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Platform Announcement
                </label>
                <textarea
                  value={localSettings.announcement || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      announcement: e.target.value,
                    })
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500/50 focus:outline-none min-h-[100px]"
                  placeholder="Enter a global announcement..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Admin PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPin ? "text" : "password"}
                      value={localSettings.adminPin || ""}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          adminPin: e.target.value,
                        })
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pr-10 text-sm focus:border-blue-500/50 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-white"
                    >
                      {showAdminPin ? "👁️" : "🔒"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Donation Target
                  </label>
                  <input
                    type="number"
                    value={localSettings.donationTarget || 0}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        donationTarget: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Controls */}
          <div style={glassStyle} className="p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-4">Platform Controls</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <div className="font-semibold text-sm">Maintenance Mode</div>
                  <div className="text-xs text-gray-500">
                    Only admins can access the platform
                  </div>
                </div>
                <button
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      maintenanceMode: !localSettings.maintenanceMode,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.maintenanceMode ? "bg-red-500" : "bg-gray-700"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.maintenanceMode ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <div className="font-semibold text-sm">
                    Verified-Only Mode
                  </div>
                  <div className="text-xs text-gray-500">
                    Only verified users can create new posts
                  </div>
                </div>
                <button
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      verifiedOnlyMode: !localSettings.verifiedOnlyMode,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.verifiedOnlyMode ? "bg-blue-500" : "bg-gray-700"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.verifiedOnlyMode ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all flex items-center gap-2"
            >
              <span>🔄</span> Refresh Users
            </button>
          </div>

          {/* Action Button */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isUpdating}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all tracking-tight uppercase flex items-center justify-center gap-3"
            >
              {isUpdating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {activeTab === "FEEDBACK" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">User Feedback</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500 text-xs font-bold">
                {feedback.filter((f) => !f.is_read).length} Unread
              </span>
              <button
                onClick={fetchFeedback}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                title="Refresh"
              >
                �
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {feedback.map((entry) => (
              <div
                key={entry.id}
                style={glassStyle}
                className={`p-6 rounded-2xl border transition-all ${
                  entry.is_read
                    ? "opacity-60 grayscale-[0.5]"
                    : "border-blue-500/30 shadow-lg shadow-blue-500/5"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.subject === "Bug"
                            ? "bg-red-500/20 text-red-500"
                            : entry.subject === "Suggestion"
                              ? "bg-blue-500/20 text-blue-500"
                              : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {entry.subject}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                      {entry.user_alias && (
                        <span className="text-xs font-bold text-blue-400">
                          @{entry.user_alias}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {entry.message}
                    </p>
                    {entry.email && (
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <span>📧</span> {entry.email}
                      </div>
                    )}
                  </div>

                  {entry.image_url && (
                    <a
                      href={entry.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <img
                        src={entry.image_url}
                        alt="Screenshot"
                        className="w-24 h-24 rounded-xl object-cover border border-white/10 hover:border-blue-500 transition-colors"
                      />
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-2">
                  <button
                    onClick={() => handleDeleteFeedback(entry.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      handleToggleFeedbackRead(entry.id, entry.is_read)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      entry.is_read
                        ? "bg-neutral-800 text-neutral-400"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {entry.is_read ? "Mark as Unread" : "Mark as Read"}
                  </button>
                </div>
              </div>
            ))}

            {feedback.length === 0 && (
              <div className="py-20 text-center text-neutral-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <div className="text-4xl mb-4">📥</div>
                <p>No feedback received yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BroadcastTab: React.FC<{
  isDarkMode: boolean;
  currentAdminAlias: string;
  addToast: (msg: string, type?: "success" | "error") => void;
  logAction: (
    target: string,
    action: string,
    details?: string,
  ) => Promise<void>;
}> = ({ isDarkMode, currentAdminAlias, addToast, logAction }) => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) {
      addToast("Content is required", "error");
      return;
    }

    setIsPosting(true);
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();

      // Insert into main posts
      const { error: error1 } = await supabase.from("posts").insert({
        id,
        author_alias: currentAdminAlias,
        content: content.trim(),
        file_url: imageUrl.trim() || null,
        external_link: externalLink.trim() || null,
        is_official: true,
        timestamp,
        likes: [],
        comments: [],
        views: [],
      });

      // Insert into anonymous posts
      const { error: error2 } = await supabase.from("anonymous_posts").insert({
        id,
        content: content.trim(),
        media_urls: imageUrl.trim() ? [imageUrl.trim()] : [],
        external_link: externalLink.trim() || null,
        is_official: true,
        created_at: timestamp,
        likes: [],
        comments: [],
        reactions: [],
        bookmarks: [],
      });

      if (error1) throw error1;
      if (error2) throw error2;

      addToast("Official post broadcasted successfully!");
      await logAction("SYSTEM", "BROADCAST", content.substring(0, 50) + "...");

      // Reset form
      setContent("");
      setImageUrl("");
      setExternalLink("");
    } catch (err) {
      console.error("Broadcast error:", err);
      addToast("Failed to broadcast post", "error");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-xl">
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <span>📢</span> Broadcast Official Update
        </h3>

        <div className="space-y-5">
          {/* Content */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's the official word?"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500/50 min-h-[150px] resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">
                Image URL (Catbox, etc.)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://files.catbox.moe/..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* External Link */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">
                External Website Link
              </label>
              <input
                type="text"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://thesdel.com/..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-medium text-neutral-500 italic max-w-xs">
              * Official posts are highlighted in the main feed and cannot be
              hidden by standard users.
            </p>
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all tracking-tight uppercase flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isPosting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Broadcast Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      {(content || imageUrl || externalLink) && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">
            Live Preview
          </h4>
          <div className="p-6 rounded-[28px] bg-neutral-900/60 border border-blue-500/30 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-black text-[10px] font-black uppercase tracking-widest rounded-bl-xl z-10">
              OFFICIAL
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                {currentAdminAlias[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  @{currentAdminAlias}
                </p>
                <p className="text-[10px] text-neutral-500 font-medium">
                  Just now • Official System Post
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-200 leading-relaxed mb-4 whitespace-pre-wrap">
              {content || "Post content will appear here..."}
            </p>

            {imageUrl && (
              <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-white/10 mb-4 bg-black/40 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://via.placeholder.com/800x450?text=Invalid+Image+URL")
                  }
                />
              </div>
            )}

            {externalLink && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    🔗
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">
                      {externalLink}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium tracking-tight">
                      External Website
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-blue-500 text-black text-[10px] font-black uppercase tracking-widest">
                  Connect
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
