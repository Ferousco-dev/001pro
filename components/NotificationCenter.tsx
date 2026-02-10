import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { supabase } from "../supabaseClient";

interface Notification {
  id: string;
  user_alias: string;
  type: "message" | "like" | "comment" | "follow" | "mention" | "dm" | "system";
  title: string;
  content: string;
  from_alias?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  currentUser: UserProfile;
  onClose: () => void;
  onNavigate?: (view: string, data?: any) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_alias=eq.${currentUser.alias}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);

          // Show browser notification
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.hidden
          ) {
            new Notification(newNotif.title, {
              body: newNotif.content,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
            });
          }
        },
      )
      .subscribe();

    // Request notification permission
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser.alias]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_alias", currentUser.alias)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_alias", currentUser.alias)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAll = async () => {
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("user_alias", currentUser.alias);

      setNotifications([]);
    } catch (error) {
      console.error("Error clearing all:", error);
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "like":
        return <span className="text-lg">❤️</span>;
      case "comment":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
      case "follow":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      case "mention":
        return <span className="text-lg font-black">@</span>;
      case "dm":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "system":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getColorClasses = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return {
          bg: "bg-blue-600/20",
          border: "border-blue-500/30",
          text: "text-blue-500",
        };
      case "like":
        return {
          bg: "bg-red-600/20",
          border: "border-red-500/30",
          text: "text-red-500",
        };
      case "comment":
        return {
          bg: "bg-purple-600/20",
          border: "border-purple-500/30",
          text: "text-purple-500",
        };
      case "follow":
        return {
          bg: "bg-green-600/20",
          border: "border-green-500/30",
          text: "text-green-500",
        };
      case "mention":
        return {
          bg: "bg-yellow-600/20",
          border: "border-yellow-500/30",
          text: "text-yellow-500",
        };
      case "dm":
        return {
          bg: "bg-pink-600/20",
          border: "border-pink-500/30",
          text: "text-pink-500",
        };
      case "system":
        return {
          bg: "bg-slate-600/20",
          border: "border-slate-500/30",
          text: "text-slate-500",
        };
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/98 backdrop-blur-2xl animate-in fade-in duration-200"
      style={{ WebkitBackdropFilter: "blur(40px)" }}
    >
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800/50 shrink-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              NOTIFICATIONS
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-black rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              Stay Updated • Real-Time
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center active:scale-95"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/30 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === "unread"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-slate-800/30 hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const colors = getColorClasses(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    notif.is_read
                      ? "bg-slate-900/20 border-slate-800/30"
                      : `${colors.bg} ${colors.border}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} shrink-0`}
                    >
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-black text-sm text-white">
                          {notif.title}
                        </div>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 hover:bg-slate-800/50 rounded-lg text-slate-600 hover:text-slate-400 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">
                        {notif.content}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-600 font-bold">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                        {notif.from_alias && (
                          <span className="text-[10px] text-slate-600 font-bold">
                            from @{notif.from_alias}
                          </span>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-[10px] text-blue-500 hover:text-blue-400 font-black uppercase tracking-wider"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <svg
                className="w-20 h-20 text-slate-700 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-slate-600 font-black uppercase text-sm tracking-wider">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
