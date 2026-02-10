import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Message,
  UserProfile,
  SocialPost,
  AnonymousPost,
  AppSettings,
  SystemLog,
  Comment,
  GroupChat,
  GroupMemberRole,
} from "./types";
import Header from "./components/Header";
import Composer from "./components/Composer";
import Auth from "./components/Auth";
import AnonymousWall from "./components/AnonymousWall";
import StatusChannelPage from "./components/StatusChannelPage";
import {
  createNotification,
  requestNotificationPermission,
} from "./notificationHelper";
import AdminDashboard from "./components/AdminDashboard";
import AboutPage from "./components/AboutPage";
import DonationPage from "./components/DonationPage";
import ProfilePage from "./components/ProfilePage";
import VanguardLeaderboard from "./components/VanguardLeaderboard";
import SystemTerminal from "./components/SystemTerminal";
import GroupChatContainer from "./components/GroupChat";
import HomePage from "./components/HomePage";
import PostDetail from "./components/PostDetail";
import { sharePost } from "./utils/shareUtils";
import { useSwipeGesture } from "./utils/useSwipeGesture";
import DirectMessages from "./components/DirectMessages";
import NotificationCenter from "./components/NotificationCenter";
import FeedbackPage from "./components/FeedbackPage";

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { useBackButtonControl } from "./hooks/useBackButtonControl";

const IconArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width="20"
    height="20"
  >
    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getEnvVar = (key: string, fallback: string) => {
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return String(process.env[key]);
    }
  } catch {
    return fallback;
  }
  return fallback;
};

const ADMIN_PIN = getEnvVar("ADMIN_PIN", "GREAT_IFE_ADMIN_2025");

const DEFAULT_SETTINGS: AppSettings = {
  adminPin: ADMIN_PIN,
  announcement:
    "Genesis Node Online. Swipe right to reply, Double tap to react.",
  donationTarget: 10000,
  donationCurrent: 1250,
  accountName: "NACOS OAU CHAPTER",
  accountNumber: "0123456789",
};

const App: React.FC = () => {
  useEffect(() => {
    console.log(
      "🚀 App Component Mounting. isSupabaseConfigured:",
      isSupabaseConfigured,
    );
  }, []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  // Legacy view state
  const initialView = (() => {
    try {
      const p = window.location.pathname || "/";
      const hash = (window.location.hash || "").replace("#", "").toUpperCase();
      if (p === "/anonymous" || hash === "ANONYMOUS")
        return "ANONYMOUS" as const;
      if (p === "/auth" || hash === "AUTH") return "AUTH" as const;
    } catch (e) {}
    return "HOME" as const;
  })();

  const [view, setView] = useState<
    | "ANONYMOUS"
    | "ADMIN"
    | "HOME"
    | "ABOUT"
    | "DONATE"
    | "PROFILE"
    | "VANGUARD"
    | "GROUPS"
    | "POST"
    | "AUTH"
    | "STATUS_CHANNEL"
    | "SEARCH"
    | "FEEDBACK"
  >(initialView);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [selectedProfileAlias, setSelectedProfileAlias] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [anonymousPosts, setAnonymousPosts] = useState<SocialPost[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [mutedAliases, setMutedAliases] = useState<string[]>([]);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);

  const [showDMs, setShowDMs] = useState(false);
  const [dmTargetAlias, setDmTargetAlias] = useState<string | undefined>(
    undefined,
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("theme");
      return v === "light" ? false : true;
    } catch {
      return true;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = (event: string, type: SystemLog["type"] = "INFO") => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      event,
      type,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, newLog].slice(-50));
  };

  const normalizeGroup = (g: any) => {
    const created =
      g?.createdAt ?? g?.created_at ?? g?.created_at_timestamp ?? null;
    const creator = g?.creatorAlias ?? g?.creator_alias ?? g?.creator ?? null;
    const members = g?.members ?? g?.member_list ?? [];
    return {
      ...g,
      creatorAlias: creator,
      members: members,
      createdAt: created ? new Date(created) : new Date(),
    };
  };

  const trendingTags = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      m.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [messages]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorAlias.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [posts, searchQuery]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return Object.values(profiles).filter(
      (p: UserProfile) =>
        p.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [profiles, searchQuery]);

  // Request notification permission on mount
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {}
    // Update document root classes for quick global theme
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // set primary accent color variable (deep blue for dark theme)
    try {
      const deepBlue = "#001f54";
      const lightAccent = "#0b61d1";
      document.documentElement.style.setProperty(
        "--primary",
        isDarkMode ? deepBlue : lightAccent,
      );
    } catch {}
  }, [isDarkMode]);

  // REAL-TIME SUBSCRIPTIONS - Group Messages
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const groupMessagesSub = supabase
      .channel("group_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages" },
        (payload) => {
          const p: any = payload.new;
          const newMsg: Message = {
            id: p.id,
            senderAlias: p.sender_alias ?? p.senderAlias,
            senderRole: p.sender_role ?? p.senderRole,
            content: p.content,
            timestamp: new Date(p.timestamp),
            type: p.type || "text",
            tags: p.tags || [],
            replyToId: p.reply_to_id ?? p.replyToId,
            groupId: p.group_id ?? p.groupId,
            reactions: p.reactions || {},
            readBy: p.read_by || [],
            isFlagged: p.is_flagged ?? p.isFlagged ?? false,
            likes: p.likes || [],
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      groupMessagesSub.unsubscribe();
    };
  }, [isSupabaseConfigured, user]);

  // REAL-TIME SUBSCRIPTIONS - Groups
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const groupsSubscription = supabase
      .channel("groups_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newGroup = payload.new as any;
            setGroups((prev) => {
              if (prev.some((g) => g.id === newGroup.id)) return prev;
              return [...prev, normalizeGroup(newGroup) as GroupChat];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedGroup = payload.new as any;
            setGroups((prev) =>
              prev.map((g) =>
                g.id === updatedGroup.id
                  ? (normalizeGroup(updatedGroup) as GroupChat)
                  : g,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedGroup = payload.old as any;
            setGroups((prev) => prev.filter((g) => g.id !== deletedGroup.id));
          }
        },
      )
      .subscribe();

    return () => {
      groupsSubscription.unsubscribe();
    };
  }, [isSupabaseConfigured, user]);

  // REAL-TIME SUBSCRIPTIONS - Profiles (Live status updates)
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const profilesSubscription = supabase
      .channel("profiles_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updatedProfile = payload.new as UserProfile;

          // Update the specific profile in our map
          setProfiles((prev) => ({
            ...prev,
            [updatedProfile.alias]: {
              ...updatedProfile,
              joinedAt: updatedProfile.joinedAt
                ? new Date(updatedProfile.joinedAt)
                : prev[updatedProfile.alias]?.joinedAt,
            },
          }));

          // If the updated profile is the current user, update the user state
          if (updatedProfile.alias === user.alias) {
            setUser((prevUser) => {
              if (!prevUser) return null;
              return {
                ...prevUser,
                ...updatedProfile,
                joinedAt: updatedProfile.joinedAt
                  ? new Date(updatedProfile.joinedAt)
                  : prevUser.joinedAt,
              };
            });

            addLog("Security profile synchronized with network", "SECURITY");
          }
        },
      )
      .subscribe();

    return () => {
      profilesSubscription.unsubscribe();
    };
  }, [isSupabaseConfigured, user?.alias]);

  // REAL-TIME SUBSCRIPTIONS - Settings (Maintenance & Global Modes)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const settingsSubscription = supabase
      .channel("settings_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings" },
        (payload) => {
          const newSettings = payload.new;
          if (newSettings) {
            setSettings({
              ...newSettings,
              adminPin: newSettings.admin_pin || newSettings.adminPin,
              maintenanceMode:
                newSettings.maintenance_mode ?? newSettings.maintenanceMode,
              verifiedOnlyMode:
                newSettings.verified_only_mode ?? newSettings.verifiedOnlyMode,
            } as AppSettings);
            addLog("Global system parameters synchronized", "INFO");
          }
        },
      )
      .subscribe();

    return () => {
      settingsSubscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // REAL-TIME SUBSCRIPTIONS - Anonymous Posts (public, no user required)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const anonPostsSub = supabase
      .channel("anonymous_posts_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anonymous_posts" },
        (payload) => {
          const p: any = payload.new;
          const newPost: SocialPost = {
            id: p.id,
            authorAlias: p.author_alias || p.authorAlias || "anonymous",
            content: p.content,
            timestamp: new Date(p.created_at || p.timestamp),
            likes: p.likes || [],
            comments: p.comments || [],
            background: p.background,
            mediaUrls: p.media_urls || p.mediaUrls,
            categories: p.categories,
            mentionedUsers: p.mentioned_users || p.mentionedUsers,
            reactions: p.reactions || [],
            bookmarks: p.bookmarks || [],
          };

          setAnonymousPosts((prev) => {
            if (prev.some((post) => post.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "anonymous_posts" },
        (payload) => {
          const deletedId = payload.old.id;
          setAnonymousPosts((prev) =>
            prev.filter((post) => post.id !== deletedId),
          );
        },
      )
      .subscribe();

    return () => {
      anonPostsSub.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // REAL-TIME SUBSCRIPTIONS - Statuses (public, auto-expire)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const statusesSub = supabase
      .channel("statuses_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "statuses" },
        (payload) => {
          const s = payload.new;
          // Only add if not expired
          if (new Date(s.expires_at) > new Date()) {
            setStatuses((prev) => {
              if (prev.some((status) => status.id === s.id)) return prev;
              return [s, ...prev];
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "statuses" },
        (payload) => {
          const deletedId = payload.old.id;
          setStatuses((prev) => prev.filter((s) => s.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      statusesSub.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // REAL-TIME SUBSCRIPTIONS - Channels
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channelsSub = supabase
      .channel("channels_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "channels" },
        (payload) => {
          const c = payload.new;
          setChannels((prev) => {
            if (prev.some((channel) => channel.id === c.id)) return prev;
            return [c, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      channelsSub.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // REAL-TIME SUBSCRIPTIONS - Status interactions and homepage posts
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const statusViewsSubscription = supabase
      .channel("status_views_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "status_views" },
        (payload) => {
          console.log("Status view added:", payload);
        },
      )
      .subscribe();

    const statusLikesSubscription = supabase
      .channel("status_likes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status_likes" },
        (payload) => {
          console.log("Status like event:", payload);
        },
      )
      .subscribe();

    const statusCommentsSubscription = supabase
      .channel("status_comments_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status_comments" },
        (payload) => {
          console.log("Status comment event:", payload);
        },
      )
      .subscribe();

    // Real-time subscriptions for homepage posts
    const postsSubscription = supabase
      .channel("posts_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const newPost = payload.new as any;
            setPosts((prev) => {
              // Avoid duplicates
              if (prev.some((p) => p.id === newPost.id)) return prev;
              return [
                {
                  ...newPost,
                  timestamp: new Date(newPost.timestamp),
                  likes: newPost.likes || [],
                  comments: newPost.comments || [],
                  fileUrl: newPost.file_url || newPost.fileUrl,
                  views: newPost.views || [],
                  repostOf: newPost.repost_of || newPost.repostOf,
                  repostCount: newPost.repost_count || newPost.repostCount || 0,
                  externalLink: newPost.external_link,
                  isOfficial: newPost.is_official,
                  mediaUrls:
                    newPost.media_urls ||
                    newPost.mediaUrls ||
                    (newPost.file_url || newPost.fileUrl
                      ? [newPost.file_url || newPost.fileUrl]
                      : []),
                },
                ...prev,
              ];
            });
          } else if (eventType === "UPDATE") {
            const updatedPost = payload.new as any;
            setPosts((prev) =>
              prev.map((post) =>
                post.id === updatedPost.id
                  ? {
                      ...post,
                      ...updatedPost,
                      timestamp: new Date(updatedPost.timestamp),
                      likes: updatedPost.likes || post.likes || [],
                      comments: updatedPost.comments || post.comments || [],
                      fileUrl:
                        updatedPost.file_url ||
                        updatedPost.fileUrl ||
                        post.fileUrl,
                    }
                  : post,
              ),
            );
          } else if (eventType === "DELETE") {
            const deletedPost = payload.old as any;
            setPosts((prev) =>
              prev.filter((post) => post.id !== deletedPost.id),
            );
          }
        },
      )
      .subscribe();

    const profilesSubscription = supabase
      .channel("profiles_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("👤 Profile change detected:", payload);
          const updatedProfile = (payload.new || payload.old) as UserProfile;
          if (updatedProfile && updatedProfile.alias) {
            setProfiles((prev) => ({
              ...prev,
              [updatedProfile.alias]: {
                ...prev[updatedProfile.alias],
                ...updatedProfile,
                // Ensure joinedAt is a Date if needed, though state expects string or Date depending on implementation
                // Looking at initData, it seems profiles in state are just objects.
              },
            }));

            // If this is the current user, update the user state too
            setUser((currentUser) => {
              if (currentUser && currentUser.alias === updatedProfile.alias) {
                console.log(
                  "✨ Updating current user state from real-time sync",
                );
                return { ...currentUser, ...updatedProfile };
              }
              return currentUser;
            });
          }
        },
      )
      .subscribe();

    return () => {
      console.log("🧹 Cleaning up real-time subscriptions");
      supabase.removeChannel(statusViewsSubscription);
      supabase.removeChannel(statusLikesSubscription);
      supabase.removeChannel(statusCommentsSubscription);
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(profilesSubscription);
    };
  }, [isSupabaseConfigured]);

  useEffect(() => {
    const persistLocal = () => {
      localStorage.setItem("anonpro_local_msgs", JSON.stringify(messages));
      localStorage.setItem("anonpro_local_groups", JSON.stringify(groups));
      localStorage.setItem("anonpro_local_posts", JSON.stringify(posts));
      localStorage.setItem(
        "anonpro_local_anon_posts",
        JSON.stringify(anonymousPosts),
      );
      localStorage.setItem("anonpro_local_profiles", JSON.stringify(profiles));
    };
    if (
      messages.length > 0 ||
      posts.length > 0 ||
      anonymousPosts.length > 0 ||
      groups.length > 0 ||
      Object.keys(profiles).length > 0
    )
      persistLocal();
  }, [messages, posts, anonymousPosts, groups, profiles]);
  useEffect(() => {
    const verifySavedSession = async () => {
      const savedSession = localStorage.getItem("anonpro_session");
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (isSupabaseConfigured) {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("alias", parsed.alias)
              .single();
            if (!error && data && data.password === parsed.password) {
              setUser({ ...data, joinedAt: new Date(data.joinedAt) });
            }
          } else {
            const localProfiles = JSON.parse(
              localStorage.getItem("anonpro_local_profiles") || "{}",
            );
            const localUser = localProfiles[parsed.alias.toLowerCase()];
            if (localUser && localUser.password === parsed.password) {
              setUser({ ...localUser, joinedAt: new Date(localUser.joinedAt) });
            }
          }
        } catch (e) {
          localStorage.removeItem("anonpro_session");
        }
      }
      setIsVerifyingSession(false);
    };
    verifySavedSession();
  }, []);

  useEffect(() => {
    const initData = async () => {
      const localMsgs = JSON.parse(
        localStorage.getItem("anonpro_local_msgs") || "[]",
      );
      const localGroups = JSON.parse(
        localStorage.getItem("anonpro_local_groups") || "[]",
      );
      const localPosts = JSON.parse(
        localStorage.getItem("anonpro_local_posts") || "[]",
      );
      const localAnonPosts = JSON.parse(
        localStorage.getItem("anonpro_local_anon_posts") || "[]",
      );
      const localProfiles = JSON.parse(
        localStorage.getItem("anonpro_local_profiles") || "{}",
      );

      setMessages(
        localMsgs.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
          likes: m.likes || [],
        })),
      );
      setGroups(
        localGroups.map((g: any) => ({
          ...g,
          createdAt: new Date(g.createdAt),
        })),
      );
      setPosts(
        localPosts.map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp),
        })),
      );
      setAnonymousPosts(
        localAnonPosts.map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp),
        })),
      );
      setProfiles(localProfiles);

      if (!isSupabaseConfigured) {
        setIsLoading(false);
        addLog("Operating in Local Resilience Mode", "SECURITY");
        return;
      }

      try {
        const [
          { data: postData },
          { data: anonPostData },
          { data: profileData },
          { data: settingsData },
          { data: groupData },
          { data: statusesData },
          { data: channelsData },
          { data: groupMessagesData },
        ] = await Promise.all([
          supabase
            .from("posts")
            .select("*")
            .order("timestamp", { ascending: false }),
          supabase
            .from("anonymous_posts")
            .select("*")
            .order("timestamp", { ascending: false }),
          supabase.from("profiles").select("*"),
          supabase.from("settings").select("*").single(),
          supabase.from("groups").select("*"),
          supabase
            .from("statuses")
            .select("*")
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false }),
          supabase.from("channels").select("*"),
          supabase
            .from("group_messages")
            .select("*")
            .order("timestamp", { ascending: true }),
        ]);

        if (groupData) setGroups(groupData.map((g: any) => normalizeGroup(g)));
        if (groupMessagesData) {
          const fetchedGroupMsgs = groupMessagesData.map((p: any) => ({
            id: p.id,
            senderAlias: p.sender_alias ?? p.senderAlias,
            senderRole: p.sender_role ?? p.senderRole,
            content: p.content,
            timestamp: new Date(p.timestamp),
            type: p.type || "text",
            tags: p.tags || [],
            replyToId: p.reply_to_id ?? p.replyToId,
            groupId: p.group_id ?? p.groupId,
            reactions: p.reactions || {},
            readBy: p.read_by || [],
            isFlagged: p.is_flagged ?? p.isFlagged ?? false,
            likes: p.likes || [],
          }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = fetchedGroupMsgs.filter(
              (m) => !existingIds.has(m.id),
            );
            return [...prev, ...newMsgs].sort(
              (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
            );
          });
        }
        if (postData)
          setPosts(
            postData.map((p: any) => ({
              ...p,
              timestamp: new Date(p.timestamp),
              likes: p.likes || [],
              comments: p.comments || [],
              fileUrl: p.file_url || p.fileUrl, // Handle both snake_case and camelCase
              views: p.views || [],
              repostOf: p.repost_of || p.repostOf,
              repostCount: p.repost_count || p.repostOf || 0,
              externalLink: p.external_link,
              isOfficial: p.is_official,
              mediaUrls:
                p.media_urls ||
                p.mediaUrls ||
                (p.file_url || p.fileUrl ? [p.file_url || p.fileUrl] : []),
            })),
          );
        if (anonPostData)
          setAnonymousPosts(
            anonPostData.map((p: any) => ({
              ...p,
              authorAlias: p.author_alias || p.authorAlias || "anonymous",
              timestamp: new Date(p.created_at || p.timestamp),
              fileUrl: p.file_url || p.fileUrl,
              externalLink: p.external_link,
              isOfficial: p.is_official,
              mediaUrls: p.media_urls || p.mediaUrls || [],
              mentionedUsers: p.mentioned_users || p.mentionedUsers || [],
              likes: p.likes || [],
              comments: p.comments || [],
              reactions: p.reactions || [],
              bookmarks: p.bookmarks || [],
            })),
          );
        if (profileData) {
          const profMap: Record<string, UserProfile> = {};

          // Calculate post counts from all posts (case-insensitive)
          const postCounts: Record<string, number> = {};
          if (postData) {
            postData.forEach((p: any) => {
              const alias = (
                p.author_alias ||
                p.authorAlias ||
                ""
              ).toLowerCase();
              if (alias) postCounts[alias] = (postCounts[alias] || 0) + 1;
            });
          }
          if (anonPostData) {
            anonPostData.forEach((p: any) => {
              const alias = (
                p.author_alias ||
                p.authorAlias ||
                ""
              ).toLowerCase();
              if (alias && alias !== "anonymous") {
                postCounts[alias] = (postCounts[alias] || 0) + 1;
              }
            });
          }

          profileData.forEach((p) => {
            const alias = p.alias;
            const aliasLower = alias.toLowerCase();
            // Strictly use calculated post count to fix incorrect counters
            const calculatedPosts = postCounts[aliasLower] || 0;
            profMap[alias] = {
              ...p,
              joinedAt: new Date(p.joinedAt),
              totalTransmissions: calculatedPosts,
            };
          });
          setProfiles(profMap);

          // Sync current user state with latest profile data
          if (user?.alias) {
            const currentProfile = profMap[user.alias];
            if (currentProfile) {
              const updatedUser = {
                ...user,
                ...currentProfile,
              };
              setUser(updatedUser);
            }
          }
        }
        if (settingsData) {
          setSettings({
            ...settingsData,
            adminPin: settingsData.admin_pin || settingsData.adminPin,
            maintenanceMode:
              settingsData.maintenance_mode ?? settingsData.maintenanceMode,
            verifiedOnlyMode:
              settingsData.verified_only_mode ?? settingsData.verifiedOnlyMode,
          });
        }

        // Load statuses (only non-expired ones)
        if (statusesData) {
          setStatuses(
            statusesData.map((s: any) => ({
              ...s,
              created_at: new Date(s.created_at),
              expires_at: new Date(s.expires_at),
            })),
          );
        }

        // Load channels
        if (channelsData) {
          setChannels(
            channelsData.map((c: any) => ({
              ...c,
              created_at: new Date(c.created_at),
            })),
          );
        }

        addLog("Cloud synchronization complete");
      } catch (e) {
        addLog("Synchronization uplink failed.", "SECURITY");
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    try {
      const { data, error } = await supabase
        .from("dm_messages")
        .select("id")
        .eq("receiver_alias", user.alias)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadMessageCount(data?.length || 0);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error fetching unread message count:", error);
    }
  }, [isSupabaseConfigured, user]);

  // Fetch unread notification count
  const fetchUnreadNotificationCount = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_alias", user.alias)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadNotificationCount(data?.length || 0);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error fetching unread notification count:", error);
    }
  }, [isSupabaseConfigured, user]);

  // Load unread counts when user logs in
  useEffect(() => {
    if (user) {
      fetchUnreadMessageCount();
      fetchUnreadNotificationCount();
    }
  }, [user, fetchUnreadMessageCount, fetchUnreadNotificationCount]);

  // Subscribe to real-time updates for unread counts
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    // Subscribe to dm_messages changes
    const dmSubscription = supabase
      .channel("unread_dm_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_messages",
          filter: `receiver_alias=eq.${user.alias}`,
        },
        () => {
          fetchUnreadMessageCount();
        },
      )
      .subscribe();

    // Subscribe to notifications changes
    const notificationSubscription = supabase
      .channel("unread_notification_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_alias=eq.${user.alias}`,
        },
        () => {
          fetchUnreadNotificationCount();
        },
      )
      .subscribe();

    return () => {
      dmSubscription.unsubscribe();
      notificationSubscription.unsubscribe();
    };
  }, [
    isSupabaseConfigured,
    user,
    fetchUnreadMessageCount,
    fetchUnreadNotificationCount,
  ]);

  useEffect(() => {
    if (view === "CHAT" && chatEndRef.current) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  }, [view]);

  useEffect(() => {
    if (view === "CHAT" && messages.length > 0 && chatEndRef.current) {
      const main = document.querySelector("main");
      if (main) {
        const isNearBottom =
          main.scrollHeight - main.scrollTop - main.clientHeight < 200;
        if (isNearBottom) {
          requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          });
        }
      }
    }
  }, [messages.length, view]);

  const handleSendMessage = async (text: string, groupId?: string) => {
    if (!user || mutedAliases.includes(user.alias)) return;
    const now = new Date();
    const group = groups.find((g) => g.id === groupId);
    if (groupId && group) {
      const canSend =
        group.settings?.whoCanSendMessage === "all" ||
        group.admins.includes(user.alias);
      if (!canSend) {
        addLog(
          `Unauthorized transmission attempt to locked cluster`,
          "SECURITY",
        );
        return;
      }
    }

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderAlias: user.alias,
      senderRole: user.role as any,
      content: String(text),
      timestamp: now,
      type:
        text.startsWith("http") &&
        text.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg)$/i)
          ? text.match(/\.(mp4|webm|ogg)$/i)
            ? "video"
            : "image"
          : "text",
      tags: (text.match(/#\w+/g) || []).map((t) => t.toLowerCase()),
      replyToId: replyTarget?.id,
      groupId: groupId,
      isFlagged: false,
      likes: [],
      reactions: {},
      readBy: [user.alias],
    };

    setMessages((prev) => [...prev, newMessage]);

    if (isSupabaseConfigured) {
      try {
        const basePayload: any = {
          id: newMessage.id,
          sender_alias: newMessage.senderAlias,
          sender_role: newMessage.senderRole,
          content: newMessage.content,
          type: newMessage.type,
          timestamp: now.toISOString(),
          tags: newMessage.tags || [],
          likes: newMessage.likes || [],
        };

        if (newMessage.replyToId)
          basePayload.reply_to_id = newMessage.replyToId;

        try {
          let data: any = null;
          let error: any = null;

          if (newMessage.groupId) {
            const groupPayload = {
              ...basePayload,
              group_id: newMessage.groupId,
            };
            if (import.meta.env.DEV)
              console.debug("Inserting group message payload:", groupPayload);
            ({ data, error } = await supabase
              .from("group_messages")
              .insert(groupPayload)
              .select());
          } else {
            // handleSendMessage normally would insert to messages but since table is gone,
            // this branch is effectively legacy or should be removed.
            // For now, let's keep it harmless by logging but not calling supabase.from("messages").
            if (import.meta.env.DEV)
              console.warn(
                "Attempted to send to 'messages' table which is deleted.",
              );
          }

          if (error) {
            if (import.meta.env.DEV)
              console.error("Supabase insert error:", error);
            addLog(`Message save failed: ${error.message}`, "SECURITY");
          } else {
            if (import.meta.env.DEV)
              console.debug("Message saved response:", data);
            addLog(`Message saved to cloud`, "INFO");
          }
        } catch (e) {
          if (import.meta.env.DEV)
            console.error("Supabase insert exception:", e);
          addLog("Message save exception", "SECURITY");
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error("Message send error:", e);
        addLog("Message transmission error", "SECURITY");
      }
    }

    addLog(`Packet transmitted by @${user.alias}`, "TRANSMISSION");
    setReplyTarget(null);
  };

  const handleLikeMessage = async (messageId: string) => {
    if (!user) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const hasLiked = m.likes?.includes(user.alias);
        const newLikes = hasLiked
          ? m.likes.filter((a) => a !== user.alias)
          : [...(m.likes || []), user.alias];

        // supabase.from("messages") update removed as table is deleted
        return { ...m, likes: newLikes };
      }),
    );
  };

  const handleCreateGroup = async (
    name: string,
    description: string,
    isPrivate?: boolean,
    icon?: string,
  ) => {
    if (!user) return;
    const now = new Date();
    const newGroup: GroupChat = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      image: icon, // Using icon as image for now
      created_by: user.alias,
      created_at: now,
      admins: [user.alias],
      members: [user.alias],
      settings: {
        whoCanSendMessage: "all",
        whoCanEditGroupInfo: "admins",
      },
    };
    setGroups((prev) => [...prev, newGroup]);
    if (isSupabaseConfigured) {
      try {
        const dbPayload: any = {
          id: newGroup.id,
          name: newGroup.name,
          description: newGroup.description,
          image: newGroup.image,
          created_by: newGroup.created_by,
          created_at: newGroup.created_at.toISOString(),
          settings: newGroup.settings,
        };
        if (import.meta.env.DEV)
          console.debug("Creating group payload:", dbPayload);
        const { data, error } = await supabase
          .from("groups")
          .insert(dbPayload)
          .select();
        if (error) {
          if (import.meta.env.DEV)
            console.error("Supabase groups insert error:", error);
          addLog(`Group sync failed: ${error.message}`, "SECURITY");
        } else {
          // Also add creator as admin member
          await supabase.from("group_members").insert({
            group_id: newGroup.id,
            user_id: user.alias,
            role: "admin",
            joined_at: now.toISOString(),
          });
          if (import.meta.env.DEV)
            console.debug("Group created response:", data);
          addLog(`Node established: ${name}`, "INFO");
        }
      } catch (e: any) {
        if (import.meta.env.DEV) console.error("Group creation error:", e);
        addLog("Group sync failed", "SECURITY");
      }
    } else {
      addLog(`Node established: ${name}`, "INFO");
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updatedMembers = Array.from(new Set([...g.members, user.alias]));
        if (isSupabaseConfigured) {
          // Update groups table
          supabase
            .from("groups")
            .update({ members: updatedMembers })
            .eq("id", groupId)
            .then(({ error }) => {
              if (error) console.error("Join group update error:", error);
            });

          // Insert into group_members
          supabase
            .from("group_members")
            .insert({
              group_id: groupId,
              user_id: user.alias,
              role: "member",
              joined_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) console.error("Join group member error:", error);
            });
        }
        return { ...g, members: updatedMembers };
      }),
    );
    addLog(`Peer joined node cluster`, "INFO");
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updatedMembers = g.members.filter((m) => m !== user.alias);
        const updatedAdmins = g.admins.filter((a) => a !== user.alias);

        if (isSupabaseConfigured) {
          supabase
            .from("groups")
            .update({ members: updatedMembers, admins: updatedAdmins })
            .eq("id", groupId)
            .then();

          supabase
            .from("group_members")
            .delete()
            .eq("group_id", groupId)
            .eq("user_id", user.alias)
            .then();
        }
        return { ...g, members: updatedMembers, admins: updatedAdmins };
      }),
    );
    addLog(`Peer disconnected from node`, "INFO");
  };

  const handleKickMember = async (groupId: string, memberAlias: string) => {
    if (!user) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.admins.includes(user.alias)) return;

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updatedMembers = g.members.filter((m) => m !== memberAlias);
        const updatedAdmins = g.admins.filter((a) => a !== memberAlias);

        if (isSupabaseConfigured) {
          supabase
            .from("groups")
            .update({ members: updatedMembers, admins: updatedAdmins })
            .eq("id", groupId)
            .then();

          supabase
            .from("group_members")
            .delete()
            .eq("group_id", groupId)
            .eq("user_id", memberAlias)
            .then();
        }
        return { ...g, members: updatedMembers, admins: updatedAdmins };
      }),
    );
    addLog(`Member ejected from cluster`, "SECURITY");
  };

  const handlePromoteMember = async (
    groupId: string,
    memberAlias: string,
    role: GroupMemberRole,
  ) => {
    if (!user) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.admins.includes(user.alias)) return;

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        let updatedAdmins = [...g.admins];
        if (role === "admin") {
          if (!updatedAdmins.includes(memberAlias))
            updatedAdmins.push(memberAlias);
        } else {
          updatedAdmins = updatedAdmins.filter((a) => a !== memberAlias);
        }

        if (isSupabaseConfigured) {
          supabase
            .from("groups")
            .update({ admins: updatedAdmins })
            .eq("id", groupId)
            .then();

          supabase
            .from("group_members")
            .update({ role })
            .eq("group_id", groupId)
            .eq("user_id", memberAlias)
            .then();
        }
        return { ...g, admins: updatedAdmins };
      }),
    );
    addLog(`Permissions updated for ${memberAlias}`, "INFO");
  };

  const handleDeleteGroupMessage = async (
    messageId: string,
    groupId: string,
  ) => {
    if (!user) return;
    const group = groups.find((g) => g.id === groupId);
    const message = messages.find((m) => m.id === messageId);
    if (!group || !message) return;

    const isAdmin = group.admins.includes(user.alias);
    const isSender = message.senderAlias === user.alias;

    if (!isAdmin && !isSender) return;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    if (isSupabaseConfigured) {
      supabase.from("group_messages").delete().eq("id", messageId).then();
    }
    addLog(`Transmission redacted`, "SECURITY");
  };

  const handleUpdateGroupInfo = async (
    groupId: string,
    updates: Partial<GroupChat>,
  ) => {
    if (!user) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const canEdit =
      group.settings?.whoCanEditGroupInfo === "all" ||
      group.admins.includes(user.alias);
    if (!canEdit) return;

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    );

    if (isSupabaseConfigured) {
      supabase.from("groups").update(updates).eq("id", groupId).then();
    }
    addLog(`Node metadata updated`, "INFO");
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!user) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        if (!reactions[emoji]) reactions[emoji] = [];

        if (reactions[emoji].includes(user.alias)) {
          reactions[emoji] = reactions[emoji].filter((a) => a !== user.alias);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...reactions[emoji], user.alias];
        }

        if (isSupabaseConfigured) {
          supabase
            .from("group_messages")
            .update({ reactions })
            .eq("id", messageId)
            .then();
        }
        return { ...m, reactions };
      }),
    );
  };

  const handleFollow = async (targetAlias: string) => {
    if (!user) return;

    const currentFollowing = user.following || [];
    const isFollowing = currentFollowing.includes(targetAlias);

    const newFollowing = isFollowing
      ? currentFollowing.filter((a) => a !== targetAlias)
      : [...currentFollowing, targetAlias];

    if (!isFollowing) {
      createNotification({
        userAlias: targetAlias,
        type: "follow",
        title: "New Follower",
        content: `@${user.alias} started following you`,
        from: user.alias,
      });
    }

    const updatedUser = { ...user, following: newFollowing };
    setUser(updatedUser);
    setProfiles((prev) => ({ ...prev, [user.alias]: updatedUser }));

    const targetProfile = profiles[targetAlias];
    if (targetProfile) {
      const targetFollowers = targetProfile.followers || [];
      const newTargetFollowers = isFollowing
        ? targetFollowers.filter((a) => a !== user.alias)
        : [...targetFollowers, user.alias];

      const updatedTarget = { ...targetProfile, followers: newTargetFollowers };
      setProfiles((prev) => ({ ...prev, [targetAlias]: updatedTarget }));

      if (isSupabaseConfigured) {
        await supabase
          .from("profiles")
          .update({ followers: newTargetFollowers })
          .eq("alias", targetAlias);
      }
    }

    if (isSupabaseConfigured) {
      await supabase
        .from("profiles")
        .update({ following: newFollowing })
        .eq("alias", user.alias);
    }

    addLog(
      `${
        isFollowing ? "Disconnected from" : "Connected to"
      } peer @${targetAlias}`,
      "INFO",
    );
  };

  const handleCreatePost = async (
    content: string,
    background?: string,
    fileUrl?: string,
    pollData?: { question: string; options: string[] },
  ) => {
    if (!user) return;
    const now = new Date();

    // Transform simple poll data into full PollData structure
    const pollStruct = pollData
      ? {
          question: pollData.question,
          options: pollData.options.map((opt) => ({ text: opt, votes: 0 })),
          totalVotes: 0,
        }
      : undefined;

    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      authorAlias: user.alias,
      content,
      timestamp: now,
      likes: [],
      comments: [],
      background,
      fileUrl,
      poll: pollStruct,
    };

    if (import.meta.env.DEV) console.log("Creating post:", newPost); // Debug log

    setPosts((prev) => [newPost, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const dbPost: any = {
          id: newPost.id,
          author_alias: newPost.authorAlias,
          content: newPost.content,
          timestamp: now.toISOString(),
          likes: [],
          comments: [],
        };
        if (background) dbPost.background = background;
        if (fileUrl) dbPost.file_url = fileUrl; // ADD THIS LINE - save fileUrl to database
        if (pollStruct) dbPost.poll = pollStruct;

        if (import.meta.env.DEV) console.log("Saving to database:", dbPost); // Debug log

        const { data, error } = await supabase
          .from("posts")
          .insert(dbPost)
          .select();

        if (error) {
          if (import.meta.env.DEV) console.error("Post creation error:", error);
          addLog("Post sync failed", "SECURITY");
        } else {
          if (import.meta.env.DEV)
            console.log("Post saved successfully:", data);
          addLog("Post published to network", "INFO");
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error("Post creation error:", e);
        addLog("Post sync failed", "SECURITY");
      }
    } else {
      addLog(`Post published locally`, "INFO");
    }

    // Increment totalTransmissions (Post Count)
    const newCount = (user.totalTransmissions || 0) + 1;
    const updatedUser = { ...user, totalTransmissions: newCount };
    setUser(updatedUser);
    setProfiles((prev) => ({ ...prev, [user.alias]: updatedUser }));

    if (isSupabaseConfigured) {
      await supabase
        .from("profiles")
        .update({ totalTransmissions: newCount })
        .eq("alias", user.alias);
    }
  };

  const handleCreateAnonymousPost = async (
    content: string,
    background?: string,
    mediaUrls?: string[],
    categories?: string[],
    mentionedUsers?: string[],
  ) => {
    const now = new Date();
    // Allow anonymous users to post — attach user metadata when available
    const newPost: SocialPost = {
      id: Math.random().toString(36).substr(2, 9),
      authorAlias: user ? user.alias : "anonymous",
      content,
      timestamp: now,
      likes: [],
      comments: [],
      background,
      mediaUrls,
      categories,
      mentionedUsers,
      reactions: [],
      bookmarks: [],
    };

    setAnonymousPosts((prev) => [newPost, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const dbPost: any = {
          id: newPost.id,
          content: newPost.content,
          created_at: now.toISOString(),
          author_alias: user ? user.alias : "anonymous",
          likes: [],
          comments: [],
          reactions: [],
          bookmarks: [],
        };
        if (background) dbPost.background = background;
        if (mediaUrls && mediaUrls.length > 0) dbPost.media_urls = mediaUrls;
        if (categories && categories.length > 0) dbPost.categories = categories;
        if (mentionedUsers && mentionedUsers.length > 0)
          dbPost.mentioned_users = mentionedUsers;

        const { error } = await supabase
          .from("anonymous_posts")
          .insert(dbPost)
          .select();
        if (error) {
          if (import.meta.env.DEV)
            console.error("Anonymous post creation error:", error);
          addLog("Anonymous post sync failed", "SECURITY");
        } else {
          addLog("Anonymous post published", "INFO");
        }
      } catch (e) {
        if (import.meta.env.DEV)
          console.error("Anonymous post creation error:", e);
        addLog("Anonymous post sync failed", "SECURITY");
      }
    }

    if (user) {
      // Increment totalTransmissions for logged in user even on anonymous wall
      const newCount = (user.totalTransmissions || 0) + 1;
      const updatedUser = { ...user, totalTransmissions: newCount };
      setUser(updatedUser);
      setProfiles((prev) => ({ ...prev, [user.alias]: updatedUser }));

      if (isSupabaseConfigured) {
        await supabase
          .from("profiles")
          .update({ totalTransmissions: newCount })
          .eq("alias", user.alias);
      }
    }
  };
  const handleLikeAnonymousPost = async (postId: string) => {
    const alias = user ? user.alias : "Anonymous";
    setAnonymousPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes.includes(alias);
        const newLikes = hasLiked
          ? p.likes.filter((a) => a !== alias)
          : [...p.likes, alias];

        if (isSupabaseConfigured) {
          supabase
            .from("anonymous_posts")
            .update({ likes: newLikes })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Anonymous post like error:", error);
            });
        }

        return { ...p, likes: newLikes };
      }),
    );
  };

  // New handlers for enhanced features
  const handleAddReaction = async (postId: string, reactionType: string) => {
    if (!user) return;

    setAnonymousPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentReactions = p.reactions || [];
        const existingReactionIndex = currentReactions.findIndex(
          (r) => r.userAlias === user.alias && r.reactionType === reactionType,
        );

        let newReactions;
        if (existingReactionIndex > -1) {
          // Remove existing reaction
          newReactions = currentReactions.filter(
            (_, index) => index !== existingReactionIndex,
          );
        } else {
          // Add new reaction
          const reactionEmoji =
            {
              like: "👍",
              love: "❤️",
              laugh: "😂",
              wow: "😮",
              sad: "😢",
              angry: "😡",
            }[reactionType] || "👍";

          const newReaction = {
            userAlias: user.alias,
            reactionType,
            emoji: reactionEmoji,
            createdAt: new Date().toISOString(),
          };
          newReactions = [...currentReactions, newReaction];
        }

        if (isSupabaseConfigured) {
          supabase
            .from("anonymous_posts")
            .update({ reactions: newReactions })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Reaction update error:", error);
            });
        }

        return { ...p, reactions: newReactions };
      }),
    );
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return;

    setAnonymousPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentBookmarks = p.bookmarks || [];
        const isBookmarked = currentBookmarks.includes(user.alias);

        let newBookmarks;
        if (isBookmarked) {
          newBookmarks = currentBookmarks.filter(
            (alias) => alias !== user.alias,
          );
        } else {
          newBookmarks = [...currentBookmarks, user.alias];
        }

        if (isSupabaseConfigured) {
          supabase
            .from("anonymous_posts")
            .update({ bookmarks: newBookmarks })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Bookmark update error:", error);
            });
        }

        return { ...p, bookmarks: newBookmarks };
      }),
    );
  };

  // Delete anonymous post (admin only)
  const handleDeleteAnonymousPost = async (postId: string) => {
    if (!user || user.role !== "ADMIN") {
      if (import.meta.env.DEV) console.error("Only admins can delete posts");
      return;
    }

    // Remove from local state
    setAnonymousPosts((prev) => prev.filter((p) => p.id !== postId));

    // Remove from Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("anonymous_posts")
          .delete()
          .eq("id", postId);

        if (error) {
          if (import.meta.env.DEV)
            console.error("Anonymous post deletion error:", error);
          addLog("Anonymous post deletion failed", "SECURITY");
        } else {
          addLog("Anonymous post deleted by admin", "SECURITY");

          // Also delete associated images from storage
          // Note: In a production app, you'd want to clean up images here
        }
      } catch (e) {
        if (import.meta.env.DEV)
          console.error("Anonymous post deletion error:", e);
        addLog("Anonymous post deletion failed", "SECURITY");
      }
    }
  };

  const handleAddAnonymousComment = async (
    postId: string,
    content: string,
    parentCommentId?: string,
  ) => {
    const now = new Date();
    const alias = user ? user.alias : "Anonymous";
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      authorAlias: "Anonymous",
      content,
      timestamp: now,
      likes: [],
      replies: [],
    };

    setAnonymousPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        let updatedComments = [...p.comments];

        if (parentCommentId) {
          updatedComments = updatedComments.map((c) => {
            if (c.id === parentCommentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
        } else {
          updatedComments.push(newComment);
        }

        if (isSupabaseConfigured) {
          supabase
            .from("anonymous_posts")
            .update({ comments: updatedComments })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Anonymous comment add error:", error);
            });
        }

        return { ...p, comments: updatedComments };
      }),
    );

    addLog("Anonymous comment transmitted", "INFO");
  };

  const handleLikeAnonymousComment = async (
    postId: string,
    commentId: string,
  ) => {
    if (!user) return;
    setAnonymousPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          const alias = user ? user.alias : "Anonymous";
          return comments.map((c) => {
            if (c.id === commentId) {
              const hasLiked = c.likes.includes(alias);
              const newLikes = hasLiked
                ? c.likes.filter((a) => a !== alias)
                : [...c.likes, alias];
              return { ...c, likes: newLikes };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateCommentLikes(c.replies) };
            }
            return c;
          });
        };

        const updatedComments = updateCommentLikes(p.comments);

        if (isSupabaseConfigured) {
          supabase
            .from("anonymous_posts")
            .update({ comments: updatedComments })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Anonymous comment like error:", error);
            });
        }

        return { ...p, comments: updatedComments };
      }),
    );
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes.includes(user.alias);
        const newLikes = hasLiked
          ? p.likes.filter((a) => a !== user.alias)
          : [...p.likes, user.alias];

        if (isSupabaseConfigured) {
          supabase
            .from("posts")
            .update({ likes: newLikes })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Post like error:", error);
            });
        }

        if (!hasLiked && p.authorAlias !== user.alias) {
          createNotification({
            userAlias: p.authorAlias,
            type: "like",
            title: "New Like",
            content: `@${user.alias} liked your post`,
            from: user.alias,
          });
        }

        return { ...p, likes: newLikes };
      }),
    );
  };

  const handleRepost = async (postId: string) => {
    const original = posts.find((p) => p.id === postId);
    if (original && user) {
      await handleCreatePost(
        original.content || "",
        undefined,
        original.fileUrl,
      );
    }
  };

  const handleSharePost = (post: SocialPost) => {
    sharePost(post, "AnonPro");
  };

  const handleAddComment = async (
    postId: string,
    content: string,
    parentCommentId?: string,
  ) => {
    if (!user) return;
    const now = new Date();
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      authorAlias: user.alias,
      content,
      timestamp: now,
      likes: [],
      replies: [],
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        let updatedComments = [...p.comments];

        if (parentCommentId) {
          updatedComments = updatedComments.map((c) => {
            if (c.id === parentCommentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
        } else {
          updatedComments.push(newComment);
        }

        if (isSupabaseConfigured) {
          supabase
            .from("posts")
            .update({ comments: updatedComments })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Comment add error:", error);
            });
        }

        if (p.authorAlias !== user.alias) {
          createNotification({
            userAlias: p.authorAlias,
            type: "comment",
            title: "New Comment",
            content: `@${user.alias} commented on your post`,
            from: user.alias,
          });
        }

        return { ...p, comments: updatedComments };
      }),
    );

    addLog("Comment transmitted", "INFO");
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!user) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          return comments.map((c) => {
            if (c.id === commentId) {
              const hasLiked = c.likes.includes(user.alias);
              const newLikes = hasLiked
                ? c.likes.filter((a) => a !== user.alias)
                : [...c.likes, user.alias];
              return { ...c, likes: newLikes };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateCommentLikes(c.replies) };
            }
            return c;
          });
        };

        const updatedComments = updateCommentLikes(p.comments);

        if (isSupabaseConfigured) {
          supabase
            .from("posts")
            .update({ comments: updatedComments })
            .eq("id", postId)
            .then(({ error }) => {
              if (error) console.error("Comment like error:", error);
            });
        }

        return { ...p, comments: updatedComments };
      }),
    );
  };

  const openProfile = (alias: string) => {
    const cleanAlias = String(alias).startsWith("@") ? alias.slice(1) : alias;
    setSelectedProfileAlias(cleanAlias);
    navigate("PROFILE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    console.log("📡 handleUpdateProfile called with:", updates);
    if (!user) {
      console.error("❌ App.tsx: No user found in handleUpdateProfile");
      return;
    }

    if (import.meta.env.DEV)
      console.log("📝 handleUpdateProfile called with:", updates);

    // Optimistic update
    const updatedUser = { ...user, ...updates };
    if (import.meta.env.DEV)
      console.log("🔄 Updated user object:", updatedUser);

    setUser(updatedUser);
    setProfiles((prev) => {
      const newProfiles = { ...prev };
      newProfiles[user.alias] = updatedUser;
      return newProfiles;
    });

    if (isSupabaseConfigured) {
      try {
        // ✅ Build update object - ONLY include fields that are being updated
        const dbUpdates: Record<string, any> = {};

        // Add only the fields that were passed in
        if (updates.alias !== undefined) dbUpdates.alias = updates.alias;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.password !== undefined)
          dbUpdates.password = updates.password;

        // ✅ Handle BOTH naming conventions
        if (updates.avatar_url !== undefined) {
          dbUpdates.avatar_url = updates.avatar_url;
          if (import.meta.env.DEV)
            console.log("📌 Adding avatar_url:", updates.avatar_url);
        }
        if (updates.avatarUrl !== undefined) {
          dbUpdates.avatar_url = updates.avatarUrl;
          if (import.meta.env.DEV)
            console.log("📌 Adding avatarUrl:", updates.avatarUrl);
        }
        if (updates.cover_url !== undefined) {
          dbUpdates.cover_url = updates.cover_url;
          if (import.meta.env.DEV)
            console.log("📌 Adding cover_url:", updates.cover_url);
        }
        if (updates.coverUrl !== undefined) {
          dbUpdates.cover_url = updates.coverUrl;
          if (import.meta.env.DEV)
            console.log("📌 Adding coverUrl:", updates.coverUrl);
        }
        if (updates.profile_image !== undefined) {
          dbUpdates.profile_image = updates.profile_image;
          dbUpdates.avatar_url = updates.profile_image; // Sync both for compatibility
          if (import.meta.env.DEV)
            console.log(
              "📌 Adding profile_image and syncing avatar_url:",
              updates.profile_image,
            );
        }
        if (import.meta.env.DEV)
          console.log("📤 Final update object sending to Supabase:", dbUpdates);

        // ✅ IMPORTANT: Make sure your table name is correct
        const { data, error } = await supabase
          .from("profiles") // ← Change this if your table has a different name
          .update(dbUpdates)
          .eq("alias", user.alias);

        if (error) {
          console.error("❌ Supabase update error:", error);
          console.error("❌ Error details:", error.message, error.details);
          addLog("Profile sync failed: " + error.message, "SECURITY");
        } else {
          console.log("✅ Supabase update successful!");
          console.log("✅ Response data:", data);

          // ✅ Verify the update by fetching fresh data
          const { data: verifyData, error: verifyError } = await supabase
            .from("profiles")
            .select("*")
            .eq("alias", user.alias)
            .single();

          if (verifyError) {
            if (import.meta.env.DEV)
              console.error("❌ Verification error:", verifyError);
          } else {
            if (import.meta.env.DEV)
              console.log("✅ Data verified in Supabase:", verifyData);

            // ✅ Update local state with verified data
            if (verifyData) {
              setUser(verifyData);
              setProfiles((prev) => ({ ...prev, [user.alias]: verifyData }));
            }
          }

          addLog("Profile updated successfully", "INFO");
        }
      } catch (e) {
        if (import.meta.env.DEV)
          console.error("❌ Exception during profile update:", e);
        addLog("Profile update failed", "SECURITY");
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    console.log("🗑️ App.tsx: handleDeletePost called for ID:", postId);
    if (!user) {
      console.error("❌ App.tsx: No user found in handleDeletePost");
      return;
    }

    // Optimistic delete
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) {
        console.error("Delete post error:", error);
        addLog("Failed to delete post from cloud", "SECURITY");
      } else {
        addLog("Post deleted from network", "INFO");
      }
    }
  };

  // Admin Dashboard Handlers (Repurposed for local cleanup if needed, but Supabase calls removed)
  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Update local state only
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      addLog(`Message ${messageId} deleted locally`, "INFO");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Delete message error:", error);
    }
  };

  const handleFlagMessage = async (messageId: string) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const newFlaggedState = !message.isFlagged;

      // Update local state only
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isFlagged: newFlaggedState } : m,
        ),
      );

      addLog(
        `Message ${messageId} ${
          newFlaggedState ? "flagged" : "unflagged"
        } locally`,
        "INFO",
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error("Flag message error:", error);
    }
  };

  const handleMuteUser = async (alias: string) => {
    const isCurrentlyMuted = mutedAliases.includes(alias);
    const newMutedAliases = isCurrentlyMuted
      ? mutedAliases.filter((a) => a !== alias)
      : [...mutedAliases, alias];

    setMutedAliases(newMutedAliases);

    // Persist to localStorage
    localStorage.setItem("muted_aliases", JSON.stringify(newMutedAliases));

    addLog(`${isCurrentlyMuted ? "Unmuted" : "Muted"} user ${alias}`, "INFO");
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const { error } = await supabase.from("settings").upsert({
        id: 1, // Assuming single settings record
        announcement: newSettings.announcement,
        admin_pin: newSettings.adminPin,
        donation_target: newSettings.donationTarget,
        donation_current: newSettings.donationCurrent,
        account_number: newSettings.accountNumber,
        account_name: newSettings.accountName,
        maintenance_mode: newSettings.maintenanceMode,
        verified_only_mode: newSettings.verifiedOnlyMode,
      });

      if (error) throw error;

      // Update local state
      setSettings(newSettings);
      addLog("Settings updated in cloud", "INFO");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Update settings error:", error);
      addLog("Failed to update settings in cloud", "SECURITY");
    }
  };

  // Swipe gesture navigation
  const handleSwipeRight = () => {
    switch (view) {
      case "HOME":
        navigate("NEWS");
        break;
      case "NEWS":
        navigate("GROUPS");
        break;
      case "ANONYMOUS":
        navigate("HOME");
        break;
      // Add more navigation rules as needed
      default:
        break;
    }
  };

  const handleSwipeLeft = () => {
    switch (view) {
      case "GROUPS":
        navigate("NEWS");
        break;
      case "NEWS":
        navigate("HOME");
        break;
      case "HOME":
        navigate("ANONYMOUS");
        break;
      // Add more navigation rules as needed
      default:
        break;
    }
  };

  // Navigation function that updates browser history
  const navigate = (newView: typeof view) => {
    // Push current view to history before changing
    if (view !== newView) {
      window.history.pushState(
        { view: newView },
        "",
        `#${newView.toLowerCase()}`,
      );
    }
    setView(newView);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        // If no state, go to home
        setView("HOME");
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Initialize history with current view if not already set
    if (!window.history.state) {
      window.history.replaceState({ view }, "", `#${view.toLowerCase()}`);
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

  // Apply swipe gesture to the main container
  const swipeRef = useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    minSwipeDistance: 80, // Require longer swipe for navigation
    maxSwipeTime: 400,
  });

  const { showExitToast } = useBackButtonControl({
    currentView: view,
    onNavigate: setView,
  });

  if (isLoading || isVerifyingSession)
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6 relative">
        <div className="absolute inset-0 bg-black/10" />

        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <div className="text-neutral-500 font-medium text-xs tracking-wider uppercase">
          Connecting to Network
        </div>
      </div>
    );

  // Allow anonymous/public access to ANONYMOUS view and explicit /auth
  if (!user && view !== "ANONYMOUS" && view !== "AUTH")
    return <Auth onLogin={setUser} currentPin={ADMIN_PIN} />;

  // Block Banned Users
  if (user && user.is_banned) {
    return (
      <div className="min-h-dvh w-full bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 bg-black border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <span className="text-5xl">🚫</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tight">
              Access Restricted
            </h1>
            <div className="h-1 w-12 bg-red-500 mx-auto rounded-full" />
            <p className="text-neutral-400 text-lg font-medium leading-relaxed">
              Your account (@{user.alias}) has been deactivated for violating
              community guidelines.
            </p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-2xl p-6 space-y-4">
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Contact Administration
            </p>
            <a
              href={`https://wa.me/2349072182889?text=Hello, my account (@${user.alias}) was banned. I would like to appeal this decision.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 px-6"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.385-4.442 9.814-9.815 9.814zM21.146 2.854A11.05 11.05 0 0012.029 0C5.405 0 .013 5.393.012 12.019a11.01 11.01 0 001.487 5.589L0 24l6.55-1.719a11.023 11.023 0 005.474 1.739h.005c6.621 0 12.015-5.395 12.018-12.022a10.985 10.985 0 00-3.376-7.854z"></path>
              </svg>
              Contact Support
            </a>
            <p className="text-[10px] text-neutral-600 font-mono">
              REF_ID: {user.alias.slice(0, 8).toUpperCase()}_
              {new Date().getTime().toString().slice(-4)}
            </p>
          </div>

          <button
            onClick={() => {
              setUser(null);
              localStorage.removeItem("anonpro_session");
            }}
            className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Log out and try again
          </button>
        </div>
      </div>
    );
  }

  // Maintenance Mode (Admins only)
  const isSystemAdmin = user?.is_admin || user?.role === "ADMIN";
  if (settings.maintenanceMode && !isSystemAdmin) {
    return (
      <div className="min-h-dvh w-full bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 mx-auto bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 backdrop-blur-xl">
              <svg
                className="w-12 h-12 text-blue-500 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            {/* Show Admin status if logged in as admin but blocked (debug) */}
            {user?.role === "ADMIN" && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-xl">
                ADMIN DETECTED
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              Under <span className="text-blue-500">Development</span>
            </h1>
            <p className="text-neutral-400 text-lg font-medium leading-relaxed">
              The platform is currently undergoing live system upgrades.
              <br />
              Access will be restored shortly.
            </p>
          </div>

          <div className="pt-8 space-y-4 flex flex-col items-center">
            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">
                System Status: Online
              </span>
            </div>

            <button
              onClick={() => {
                setUser(null);
                localStorage.removeItem("anonpro_session");
              }}
              className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Sign out and try another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-h-dvh overflow-x-hidden font-sans relative transition-colors duration-200 ${
        isDarkMode ? "bg-black text-neutral-100" : "bg-white text-neutral-800"
      }`}
    >
      <div className="shrink-0 sticky top-0 z-50">
        <Header
          user={user}
          currentView={view}
          onViewChange={(v) => {
            if (v === "PROFILE") openProfile(user.alias);
            else setView(v as any);
          }}
          totalMessages={unreadMessageCount}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem("anonpro_session");
            setView("HOME");
          }}
          notificationCount={unreadNotificationCount}
          onOpenNotifications={() => {
            setShowNotifications(true);
            fetchUnreadNotificationCount();
          }}
          onOpenDMs={() => {
            setDmTargetAlias(undefined);
            setShowDMs(true);
            fetchUnreadMessageCount();
          }}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((s) => !s)}
          onSetTheme={(mode: "dark" | "light") =>
            setIsDarkMode(mode === "dark")
          }
          onSearch={(q) => {
            setSearchQuery(q);
            if (q.trim()) setView("SEARCH" as any);
            else if (view === "SEARCH") setView("HOME");
          }}
        />
      </div>

      <main className="flex-1 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-8 p-3 md:p-6 lg:p-8">
          <div className="flex-1 space-y-6 lg:space-y-12 min-w-0">
            {view === "SEARCH" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredProfiles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                      Profiles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredProfiles.map((p) => (
                        <div
                          key={p.alias}
                          onClick={() => openProfile(p.alias)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                            <img
                              src={
                                p.avatar_url ||
                                p.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.alias}`
                              }
                              alt={p.alias}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold truncate">
                                @{p.alias}
                              </span>
                              {p.is_verified && (
                                <span className="text-blue-500 text-xs">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 truncate">
                              {p.bio || "No bio yet"}
                            </p>
                          </div>
                          <IconArrowRight />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                    Posts
                  </h3>
                  {filteredPosts.length > 0 ? (
                    <HomePage
                      user={user!}
                      posts={filteredPosts}
                      profiles={profiles}
                      onLikePost={handleLikePost}
                      onAddComment={handleAddComment}
                      onAliasClick={openProfile}
                      onOpenPost={(id) => {
                        setSelectedPostId(id);
                        setView("POST");
                      }}
                      onSharePost={handleSharePost}
                      onRepostPost={handleRepost}
                      isDarkMode={isDarkMode}
                    />
                  ) : (
                    <div className="py-12 text-center space-y-2">
                      <span className="text-4xl opacity-20">🔎</span>
                      <p className="text-neutral-500 font-medium">
                        No posts found matching "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === "POST" && selectedPostId && (
              <PostDetail
                key={selectedPostId}
                post={posts.find((p) => p.id === selectedPostId) as any}
                viewer={user}
                onClose={() => setView("HOME")}
                onLike={handleLikePost}
                onRepost={async (pid: string) => {
                  const original = posts.find((p) => p.id === pid);
                  if (original) {
                    await handleCreatePost(
                      original.content || "",
                      undefined,
                      original.fileUrl,
                    );
                  }
                }}
                onShare={(pid: string) => {
                  const post = posts.find((p) => p.id === pid);
                  if (post) sharePost(post, "ANONPRO");
                }}
                onAddComment={handleAddComment}
                onAliasClick={openProfile}
              />
            )}

            {view === "ABOUT" && <AboutPage />}

            {view === "DONATE" && (
              <DonationPage
                settings={settings}
                user={user}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {view === "HOME" && (
              <HomePage
                user={user}
                posts={posts}
                profiles={profiles}
                onCreatePost={handleCreatePost}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onAliasClick={openProfile}
                isDarkMode={isDarkMode}
                verifiedOnlyMode={settings.verifiedOnlyMode}
                onSharePost={handleSharePost}
                onRepostPost={handleRepost}
              />
            )}

            {view === "GROUPS" && (
              <GroupChatContainer
                user={user}
                groups={groups}
                messages={messages}
                onSendMessage={handleSendMessage}
                onCreateGroup={handleCreateGroup}
                onJoinGroup={handleJoinGroup}
                onLeaveGroup={handleLeaveGroup}
                onKickMember={handleKickMember}
                onPromoteMember={handlePromoteMember}
                onDeleteMessage={handleDeleteGroupMessage}
                onUpdateGroupInfo={handleUpdateGroupInfo}
                onReactToMessage={handleReactToMessage}
                onAliasClick={openProfile}
                onLikeMessage={handleLikeMessage}
                isDarkMode={isDarkMode}
              />
            )}

            {view === "ANONYMOUS" && (
              <AnonymousWall
                posts={anonymousPosts}
                user={user}
                onCreatePost={handleCreateAnonymousPost}
                onLike={handleLikeAnonymousPost}
                onAddComment={handleAddAnonymousComment}
                onLikeComment={handleLikeAnonymousComment}
                onDeletePost={handleDeleteAnonymousPost}
                onAddReaction={handleAddReaction}
                onBookmark={handleBookmark}
                isDarkMode={isDarkMode}
                verifiedOnlyMode={settings.verifiedOnlyMode}
              />
            )}

            {view === "AUTH" && (
              <Auth onLogin={setUser} currentPin={ADMIN_PIN} />
            )}

            {view === "STATUS_CHANNEL" && (
              <StatusChannelPage
                user={user}
                isDarkMode={isDarkMode}
                statuses={statuses}
                channels={channels}
              />
            )}

            {view === "PROFILE" && (
              <ProfilePage
                profile={
                  selectedProfileAlias
                    ? profiles[selectedProfileAlias] || {
                        alias: selectedProfileAlias,
                      }
                    : (user as any)
                }
                viewerAlias={user.alias}
                posts={posts}
                onFollow={handleFollow}
                onUpdateProfile={handleUpdateProfile}
                onOpenDM={(alias) => {
                  setDmTargetAlias(alias);
                  setShowDMs(true);
                }}
                onDeletePost={handleDeletePost}
                onAliasClick={openProfile}
                onNavigate={(v) => setView(v as any)}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onRepostPost={handleRepost}
                onSharePost={handleSharePost}
                isDarkMode={isDarkMode}
                allProfiles={profiles}
              />
            )}
            {view === "FEEDBACK" && (
              <FeedbackPage
                currentUser={user}
                isDarkMode={isDarkMode}
                onClose={() => setView("HOME")}
              />
            )}
            {view === "VANGUARD" && (
              <VanguardLeaderboard
                profiles={Object.values(profiles)}
                onAliasClick={openProfile}
              />
            )}

            {view === "ADMIN" && (
              <AdminDashboard
                posts={posts}
                profiles={profiles}
                onDelete={handleDeletePost}
                onMute={handleMuteUser}
                mutedUsers={mutedAliases}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                currentAdminAlias={user.alias}
                isDarkMode={isDarkMode}
              />
            )}

            {view === "HOME" && (
              <aside className="hidden lg:block w-72 xl:w-80 space-y-6 lg:space-y-8 sticky top-24 self-start">
                <div className="bg-black/40 border border-neutral-800 rounded-3xl lg:rounded-[40px] p-6 lg:p-8 space-y-4 lg:space-y-6 backdrop-blur-sm">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">
                    Trending Protocol Tags
                  </h4>
                  <div className="space-y-3 lg:space-y-4">
                    {trendingTags.length > 0 ? (
                      trendingTags.map(([tag, count]) => (
                        <div
                          key={tag}
                          className="flex items-center justify-between group cursor-pointer"
                        >
                          <span className="text-blue-500 font-mono text-sm group-hover:underline">
                            #{tag}
                          </span>
                          <span className="text-[10px] bg-black text-neutral-500 px-2 py-0.5 rounded-lg font-black">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-neutral-700 italic font-black uppercase tracking-widest text-center py-4 border border-dashed border-neutral-800 rounded-2xl">
                        Scanning Packets...
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-black/40 border border-neutral-800 rounded-3xl lg:rounded-[40px] p-6 lg:p-8 space-y-4 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">
                    Node Throughput
                  </h4>
                  <div className="flex items-center gap-1.5 h-10">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-600/20 rounded-full h-full relative overflow-hidden"
                      >
                        <div
                          className="absolute bottom-0 w-full bg-blue-500 animate-[bounce_2s_infinite] shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          style={{
                            height: `${20 + Math.random() * 80}%`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-neutral-600 font-black uppercase tracking-widest text-center mt-2">
                    Verified Peer Network
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      {showDMs && (
        <DirectMessages
          currentUser={user}
          allProfiles={profiles}
          onClose={() => {
            setShowDMs(false);
            setDmTargetAlias(undefined);
            fetchUnreadMessageCount();
          }}
          openToAlias={dmTargetAlias}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          currentUser={user}
          onClose={() => {
            setShowNotifications(false);
            fetchUnreadNotificationCount();
          }}
          onNavigate={(view) => {
            setShowNotifications(false);
            setView(view as any);
            fetchUnreadNotificationCount();
          }}
        />
      )}

      {/* Exit Toast */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none ${
          showExitToast
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-3">
          <span className="text-lg">🔙</span>
          <span className="font-bold text-sm">Press back again to exit</span>
        </div>
      </div>
    </div>
  );
};

export default App;
