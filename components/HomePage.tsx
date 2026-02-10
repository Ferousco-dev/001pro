import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { UserProfile, SocialPost } from "../types";
import { supabase } from "../supabaseClient";
import VerificationBadge from "./VerificationBadge";
import { sharePost } from "../utils/shareUtils";
import { TopUsersSection } from "./HomePage/TopUsersSection";
import { PostCard } from "./HomePage/PostCard";
import { Composer } from "./HomePage/Composer";
import { RepostModal, AnalyticsModal } from "./HomePage/Modals";

// ===== SVG ICONS =====
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7a2 2 0 100-4 2 2 0 000 4zM12 14a2 2 0 100-4 2 2 0 000 4zM12 21a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const IconTrendingUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconStory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const IconCrown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-5-6.5 5 2-7-5.5-4h7l3-7z" />
  </svg>
);

const IconArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path
      d="M12 19V5M5 12l7-7 7 7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h12v2c0 1-1 2-2 2h-1v3c0 1-.5 2-1.5 2.5V16h3v2H7v-2h3v-2.5C8.5 13 8 12 8 11V8H7c-1 0-2-1-2-2V4z" />
    <rect x="9" y="16" width="6" height="2" />
  </svg>
);

// ===== TOP USERS SECTION REMOVED (Moved to HomePage/TopUsersSection.tsx) =====

interface HomePageProps {
  user: UserProfile;
  posts: SocialPost[];
  profiles?: Record<string, UserProfile>;
  onCreatePost: (
    content: string,
    background?: string,
    fileUrl?: string,
    pollData?: { question: string; options: string[] },
  ) => Promise<void>;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenPost: (postId: string) => void;
  onAliasClick: (alias: string) => void;
  totalMessages?: number;
  onNavigate?: (v: string) => void;
  logs?: any[];
  trendingTags?: string[];
  isDarkMode?: boolean;
  verifiedOnlyMode?: boolean;
  onToggleTheme?: () => void;
  onSharePost?: (post: SocialPost) => void;
  onRepostPost?: (postId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  user,
  posts,
  profiles = {},
  onCreatePost,
  onLikePost,
  onAddComment,
  onDeletePost,
  onOpenPost,
  onAliasClick,
  trendingTags = [],
  isDarkMode = true,
  verifiedOnlyMode = false,
  onToggleTheme,
  onNavigate,
  onSharePost = (_post: SocialPost) => {},
  onRepostPost = (_pid: string) => {},
}) => {
  const [realtimePosts, setRealtimePosts] = useState<SocialPost[]>(posts);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [showTextComposer, setShowTextComposer] = useState(false);
  const [showImageComposer, setShowImageComposer] = useState(false);
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [postInput, setPostInput] = useState("");
  const [postBackground, setPostBackground] = useState<string | null>(null);
  const BG_PRESETS = [
    "bg-gradient-to-br from-violet-600 to-indigo-700",
    "bg-gradient-to-br from-slate-700 to-slate-900",
    "bg-gradient-to-br from-emerald-500 to-teal-700",
    "bg-gradient-to-br from-amber-500 to-orange-600",
    "bg-gradient-to-br from-rose-500 to-pink-700",
    "bg-gradient-to-br from-cyan-500 to-blue-600",
    "bg-gradient-to-br from-fuchsia-500 to-purple-700",
    "bg-black",
  ];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [showFAB, setShowFAB] = useState(true); // Always show initially
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent");
  const [showFilter, setShowFilter] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [showRepostModal, setShowRepostModal] = useState<string | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<string | null>(
    null,
  );
  const [repostQuote, setRepostQuote] = useState("");

  const [currentImageIndex, setCurrentImageIndex] = useState<
    Record<string, number>
  >({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewedPosts = useRef<Set<string>>(new Set());
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // ===== NEW POSTS INDICATOR STATE =====
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);
  const [pendingNewPosts, setPendingNewPosts] = useState<SocialPost[]>([]);
  const [isLoadingNewPosts, setIsLoadingNewPosts] = useState(false);
  const lastKnownPostIdRef = useRef<string | null>(null);

  // ===== SCROLL TO TOP VISIBILITY =====
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // ===== GLASS STYLES =====
  const glassStyle = {
    background: isDarkMode
      ? "rgba(0, 0, 0, 0.72)"
      : "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.08)"
      : "1px solid rgba(0, 0, 0, 0.06)",
  };

  const glassCardStyle = {
    background: isDarkMode
      ? "rgba(0, 0, 0, 0.65)"
      : "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.06)"
      : "1px solid rgba(0, 0, 0, 0.04)",
  };

  const glassModalStyle = {
    background: isDarkMode
      ? "rgba(0, 0, 0, 0.88)"
      : "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.08)",
    boxShadow: isDarkMode
      ? "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
      : "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
  };

  const newPostsPillStyle = {
    background: "rgba(59, 130, 246, 0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    boxShadow:
      "0 10px 40px -10px rgba(59, 130, 246, 0.5), 0 4px 20px -5px rgba(0, 0, 0, 0.3)",
  };

  const profilesMap = profiles;

  // Load new posts on pill press
  const handleLoadNewPosts = useCallback(() => {
    setIsLoadingNewPosts(true);

    const mainElement = document.querySelector("main");
    if (mainElement) {
      (mainElement as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (pendingNewPosts.length > 0) {
      setRealtimePosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newUniquePosts = pendingNewPosts.filter(
          (p) => !existingIds.has(p.id),
        );
        return [...newUniquePosts, ...prev];
      });
      setPendingNewPosts([]);
    }

    window.dispatchEvent(new CustomEvent("refreshPosts"));
    setNewPostsCount(0);
    setHasScrolledDown(false);

    setTimeout(() => {
      if (realtimePosts.length > 0) {
        lastKnownPostIdRef.current = realtimePosts[0]?.id || null;
      }
      setIsLoadingNewPosts(false);
    }, 500);
  }, [pendingNewPosts, realtimePosts]);

  // Supabase realtime
  useEffect(() => {
    setRealtimePosts(posts);

    if (posts.length > 0 && !lastKnownPostIdRef.current) {
      lastKnownPostIdRef.current = posts[0]?.id || null;
    }

    const subscription = supabase
      .channel("posts_home_realtime_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const p = payload.new as any;
          const newPost: SocialPost = {
            ...p,
            authorAlias: p.author_alias,
            fileUrl: p.file_url || p.fileUrl,
            externalLink: p.external_link,
            isOfficial: p.is_official,
            timestamp: new Date(p.timestamp),
            likes: p.likes || [],
            comments: p.comments || [],
            views: p.views || [],
            repostOf: p.repost_of || p.repostOf,
            repostCount: p.repost_count || 0,
          };

          if (newPost.authorAlias === user.alias) {
            setRealtimePosts((prev) => {
              const exists = prev.some((p) => p.id === newPost.id);
              if (exists) return prev;
              return [newPost, ...prev];
            });
            return;
          }

          if (hasScrolledDown) {
            setNewPostsCount((prev) => prev + 1);
            setPendingNewPosts((prev) => {
              const exists = prev.some((p) => p.id === newPost.id);
              if (exists) return prev;
              return [newPost, ...prev];
            });
          } else {
            // Even if simplified at top, we buffer to show the "New Posts" pill
            // This ensures no auto-jump glitching
            setNewPostsCount((prev) => prev + 1);
            setPendingNewPosts((prev) => {
              const exists = prev.some((p) => p.id === newPost.id);
              if (exists) return prev;
              return [newPost, ...prev];
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          const updatedPost = payload.new as SocialPost;
          setRealtimePosts((prev) =>
            prev.map((p) =>
              p.id === updatedPost.id ? { ...p, ...updatedPost } : p,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setRealtimePosts((prev) => prev.filter((p) => p.id !== deletedId));
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [posts, hasScrolledDown, user.alias]);

  // Scroll behavior for FAB + new posts pill + scroll to top
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector("main");
      const currentScrollY = mainElement
        ? (mainElement as HTMLElement).scrollTop
        : window.scrollY;

      // Show scroll to top button
      setShowScrollToTop(currentScrollY > 300);

      if (currentScrollY > 150) {
        setHasScrolledDown(true);
      } else {
        setHasScrolledDown(false);
        if (currentScrollY < 50) {
          // Do NOT auto-merge even if at top.
          // We want the user to explicitly click the button to see new content.
          // This prevents "shifting" while they might be reading the top post.
        }
      }

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down - hide FAB
        setShowFAB(false);
        setShowSearchBar(false);
        setShowFABMenu(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 80) {
        // Scrolling up or near top - show FAB
        setShowFAB(true);
        setShowSearchBar(true);
      }

      setLastScrollY(currentScrollY);

      // Check if near bottom to move FAB up
      const scrollHeight = mainElement
        ? mainElement.scrollHeight
        : document.documentElement.scrollHeight;
      const clientHeight = mainElement
        ? mainElement.clientHeight
        : window.innerHeight;
      const threshold = 100; // pixels from bottom
      setIsNearBottom(scrollHeight - currentScrollY - clientHeight < threshold);
    };

    const mainElement = document.querySelector("main");
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainElement) {
        mainElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [lastScrollY, pendingNewPosts]);

  const compressImage = async (file: File): Promise<Blob> => {
    if (!file.type.startsWith("image/")) {
      return file;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const maxSize = 1200;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadToGoogleDrive = async (
    file: Blob,
    filename: string,
    mimeType: string,
  ): Promise<string | null> => {
    try {
      setUploadProgress(10);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress(40);

      const SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbzds01ApK6V4THwGs9zsWBOI1rgRPR3b8XwVn5Jrc4KbImlaqtiqhBFgvQrrumb7hPBXQ/exec";

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          image: base64,
          file: base64,
          data: base64,
          content: base64,
          filename: filename,
          name: filename,
          mimeType: mimeType,
          mimetype: mimeType,
          contentType: mimeType,
          type: mimeType,
        }),
      });

      setUploadProgress(70);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      setUploadProgress(100);

      if (result.error) throw new Error(result.error);
      if (result.url) return result.url;

      return null;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setMessage(`Upload failed: ${errorMessage}`);
      setTimeout(() => setMessage(""), 4000);
      setUploadProgress(0);
      return null;
    }
  };

  const handleCreatePost = async () => {
    if (!postInput.trim() && !selectedFile) return;

    setIsUploading(true);
    try {
      let fileUrl: string | undefined;

      if (selectedFile) {
        setMessage("Uploading...");
        const isImage = selectedFile.type.startsWith("image/");
        const compressed = isImage
          ? await compressImage(selectedFile)
          : selectedFile;
        const finalMimeType = isImage ? "image/jpeg" : selectedFile.type;

        const uploaded = await uploadToGoogleDrive(
          compressed,
          selectedFile.name,
          finalMimeType,
        );
        if (uploaded) fileUrl = uploaded;
      }

      await onCreatePost(
        postInput.trim() || " ",
        postBackground ?? undefined,
        fileUrl,
        pollQuestion && pollOptions.filter((o) => o.trim()).length >= 2
          ? {
              question: pollQuestion,
              options: pollOptions.filter((o) => o.trim()),
            }
          : undefined,
      );

      // Reset all states
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowPollComposer(false);

      setPostInput("");
      setSelectedFile(null);
      setFilePreview(null);
      setPostBackground(null);
      setUploadProgress(0);
      setPostBackground(null);
      setUploadProgress(0);
      setShowTextComposer(false);
      setShowImageComposer(false);
      setShowPollComposer(false); // Close poll composer too
      setShowFABMenu(false);
      setMessage("Posted successfully");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Failed to post");
      setTimeout(() => setMessage(""), 2000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddComment = (postId: string) => {
    const comment = commentInputs[postId]?.trim();
    if (comment) {
      onAddComment(postId, comment);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Track post views
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-post-id");
            if (!postId || viewedPosts.current.has(postId)) return;

            setTimeout(() => {
              if (entry.isIntersecting && !viewedPosts.current.has(postId)) {
                viewedPosts.current.add(postId);

                setRealtimePosts((prev) =>
                  prev.map((p) => {
                    if (p.id === postId) {
                      const views = p.views || [];
                      if (!views.includes(user.alias)) {
                        const updatedViews = [...views, user.alias];
                        supabase
                          .from("posts")
                          .update({ views: updatedViews })
                          .eq("id", postId);
                        return { ...p, views: updatedViews };
                      }
                    }
                    return p;
                  }),
                );
              }
            }, 1500);
          }
        });
      },
      { threshold: 0.5 },
    );

    Object.values(postRefs.current).forEach((ref) => {
      if (ref && ref instanceof Element) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [realtimePosts, user.alias]);

  const handleShare = async (post: SocialPost) => {
    onSharePost(post);
  };

  const handleRepost = (postId: string) => {
    onRepostPost(postId);
  };

  const confirmRepost = async (postId: string, isQuote: boolean = false) => {
    const originalPost = realtimePosts.find((p) => p.id === postId);
    if (!originalPost) return;

    let content = "";
    if (isQuote && repostQuote.trim()) {
      content = repostQuote.trim();
    }

    const repostContent = originalPost.repostOf
      ? originalPost.content
      : content || `Reposted from @${originalPost.authorAlias}`;

    await onCreatePost(repostContent, undefined, originalPost.fileUrl);

    setRealtimePosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newCount = (p.repostCount || 0) + 1;
          supabase
            .from("posts")
            .update({ repost_count: newCount })
            .eq("id", postId);
          return { ...p, repostCount: newCount };
        }
        return p;
      }),
    );

    setShowRepostModal(null);
    setRepostQuote("");
    setMessage("Reposted successfully!");
    setTimeout(() => setMessage(""), 2000);
  };

  // Feed items with top users and stories
  const filteredPosts = useMemo(() => {
    let filtered = realtimePosts;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((post) =>
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by active tag
    if (activeTag) {
      const tag = activeTag.toLowerCase().replace(/^#/, "");
      filtered = filtered.filter((p) =>
        (p.content || "")
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.replace(/^#/, "") === tag),
      );
    }

    // Sort by selected criteria
    return filtered.sort((a, b) => {
      if (sortBy === "trending") {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [realtimePosts, searchQuery, activeTag, sortBy]);

  const feedItems = useMemo(() => {
    const items: Array<{ type: "post"; post: SocialPost }> = [];

    for (let i = 0; i < filteredPosts.length; i++) {
      items.push({ type: "post", post: filteredPosts[i] });
    }

    return items;
  }, [filteredPosts]);

  const handleImageError = (postId: string, imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(`${postId}-${imageUrl}`));
  };

  const scrollToTop = () => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      (mainElement as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ===== UI =====
  return (
    <div
      ref={feedContainerRef}
      className={`min-h-screen relative ${
        isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* New Posts Indicator */}
      {newPostsCount > 0 && hasScrolledDown && (
        <button
          onClick={handleLoadNewPosts}
          disabled={isLoadingNewPosts}
          style={newPostsPillStyle}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white font-semibold text-sm flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {isLoadingNewPosts ? (
            <>
              <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {newPostsCount} new posts
            </>
          )}
        </button>
      )}

      {/* Toast Message */}
      {message && (
        <div
          style={glassModalStyle}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-top duration-300 flex items-center gap-2"
        >
          <span>{message}</span>
        </div>
      )}

      {/* Scroll to Top Button */}
      <div
        className={`fixed bottom-32 right-4 sm:right-6 z-40 transition-all duration-300 ${
          showScrollToTop
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={scrollToTop}
          style={glassStyle}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all ${
            isDarkMode
              ? "text-white hover:bg-white/20"
              : "text-gray-900 hover:bg-black/10"
          }`}
          aria-label="Scroll to top"
          title="Back to top"
        >
          <IconArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Feed Container */}
      <div className="max-w-4xl mx-[3px] pr-0 pl-0 pb-24">
        {/* TOP USERS SECTION AT TOP */}
        {Object.keys(profiles).length > 0 && (
          <TopUsersSection
            profiles={Object.values(profiles)}
            isDarkMode={isDarkMode}
            glassCardStyle={glassCardStyle}
            onAliasClick={onAliasClick}
            onNavigate={onNavigate}
          />
        )}

        {feedItems.map((item) => {
          if (item.type === "post") {
            return (
              <PostCard
                key={item.post.id}
                post={item.post}
                user={user}
                profiles={profilesMap}
                isDarkMode={isDarkMode}
                glassStyle={glassStyle}
                glassCardStyle={glassCardStyle}
                onAliasClick={onAliasClick}
                onLikePost={onLikePost}
                onAddComment={onAddComment}
                onDeletePost={onDeletePost}
                handleRepost={handleRepost}
                handleShare={handleShare}
                setShowAnalyticsModal={setShowAnalyticsModal}
                toggleComments={toggleComments}
                showComments={showComments}
                commentInputs={commentInputs}
                setCommentInputs={setCommentInputs}
                currentImageIndex={currentImageIndex}
                setCurrentImageIndex={setCurrentImageIndex}
                failedImages={failedImages}
                handleImageError={handleImageError}
                postRefs={postRefs}
              />
            );
          }
          return null;
        })}

        {filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <p
              className={`text-xl font-semibold mb-2 ${
                isDarkMode ? "text-neutral-200" : "text-gray-700"
              }`}
            >
              {activeTag ? "No posts for this tag" : "No posts yet"}
            </p>
            <p
              className={`text-sm ${
                isDarkMode ? "text-neutral-500" : "text-gray-500"
              }`}
            >
              {activeTag
                ? "Try a different tag."
                : "Be the first to share something"}
            </p>
          </div>
        )}
      </div>

      {/* ===== FAB ===== */}
      {/* ===== PREMIUM FAB SYSTEM ===== */}
      {/* Backdrop */}
      {showFABMenu && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in duration-300"
          onClick={() => setShowFABMenu(false)}
        />
      )}

      {/* FAB Container */}
      <div
        className="fixed transition-all duration-300 right-4 sm:right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none"
        style={{
          bottom: isNearBottom
            ? `calc(6rem + env(safe-area-inset-bottom))`
            : `calc(2rem + env(safe-area-inset-bottom))`,
        }}
      >
        {/* Action Buttons (Expand Upward) */}
        {showFABMenu && (
          <div className="flex flex-col items-end gap-3 pointer-events-auto pb-2">
            {/* 1. Quick React (Mock) */}
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 delay-0">
              <span
                style={glassStyle}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow-lg backdrop-blur-md border ${
                  isDarkMode
                    ? "text-white border-white/10 bg-black/40"
                    : "text-gray-900 border-white/40 bg-white/60"
                }`}
              >
                Quick React
              </span>
              <button
                onClick={() => {
                  if (verifiedOnlyMode && !user.is_verified && !user.is_admin) {
                    setMessage("Verified users only!");
                    setTimeout(() => setMessage(""), 2000);
                    return;
                  }
                  setShowFABMenu(false);
                  setMessage("🔥 Reaction sent!");
                  setTimeout(() => setMessage(""), 2000);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:shadow-orange-500/30"
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
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            {/* 2. Create Poll (Mock) */}
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 delay-75">
              <span
                style={glassStyle}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow-lg backdrop-blur-md border ${
                  isDarkMode
                    ? "text-white border-white/10 bg-black/40"
                    : "text-gray-900 border-white/40 bg-white/60"
                }`}
              >
                Create Poll
              </span>
              <button
                onClick={() => {
                  if (verifiedOnlyMode && !user.is_verified && !user.is_admin) {
                    setMessage("Verified users only!");
                    setTimeout(() => setMessage(""), 2000);
                    return;
                  }
                  setShowFABMenu(false);
                  setShowPollComposer(true);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:shadow-emerald-500/30"
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
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
            </div>

            {/* 3. Upload Media */}
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 delay-100">
              <span
                style={glassStyle}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow-lg backdrop-blur-md border ${
                  isDarkMode
                    ? "text-white border-white/10 bg-black/40"
                    : "text-gray-900 border-white/40 bg-white/60"
                }`}
              >
                Upload Media
              </span>
              <button
                onClick={() => {
                  if (verifiedOnlyMode && !user.is_verified && !user.is_admin) {
                    setMessage("Verified users only!");
                    setTimeout(() => setMessage(""), 2000);
                    return;
                  }
                  setShowFABMenu(false);
                  document.getElementById("fab-image-input")?.click();
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:shadow-pink-500/30"
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
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            {/* 4. Text Post */}
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 delay-150">
              <span
                style={glassStyle}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold shadow-lg backdrop-blur-md border ${
                  isDarkMode
                    ? "text-white border-white/10 bg-black/40"
                    : "text-gray-900 border-white/40 bg-white/60"
                }`}
              >
                Text Post
              </span>
              <button
                onClick={() => {
                  if (verifiedOnlyMode && !user.is_verified && !user.is_admin) {
                    setMessage("Verified users only!");
                    setTimeout(() => setMessage(""), 2000);
                    return;
                  }
                  setShowFABMenu(false);
                  setShowTextComposer(true);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:shadow-indigo-500/40"
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
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Button */}
        <button
          onClick={() => setShowFABMenu(!showFABMenu)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto ${
            showFABMenu
              ? isDarkMode
                ? "bg-zinc-900"
                : "bg-gray-200"
              : isDarkMode
                ? "bg-white text-black hover:scale-105 active:scale-95"
                : "bg-blue-600 text-white hover:scale-105 active:scale-95"
          }`}
          style={{
            boxShadow: showFABMenu
              ? "none"
              : isDarkMode
                ? "0 20px 40px -10px rgba(255,255,255,0.2)"
                : "0 20px 40px -10px rgba(0,0,0,0.4)",
          }}
          aria-label={showFABMenu ? "Close menu" : "Open actions"}
        >
          {showFABMenu ? (
            <svg
              className="w-8 h-8 text-white transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Hidden Image Input */}
      <input
        type="file"
        id="fab-image-input"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
              setMessage("File too large (max 10MB)");
              setTimeout(() => setMessage(""), 2000);
              return;
            }
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
            setShowImageComposer(true);
          }
        }}
      />

      {/* Composer Modal */}
      <Composer
        showTextComposer={showTextComposer}
        setShowTextComposer={setShowTextComposer}
        showImageComposer={showImageComposer}
        setShowImageComposer={setShowImageComposer}
        postInput={postInput}
        setPostInput={setPostInput}
        postBackground={postBackground}
        setPostBackground={setPostBackground}
        BG_PRESETS={BG_PRESETS}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        filePreview={filePreview}
        setFilePreview={setFilePreview}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        handleCreatePost={handleCreatePost}
        isDarkMode={isDarkMode}
        glassModalStyle={glassModalStyle}
        showPollComposer={showPollComposer}
        setShowPollComposer={setShowPollComposer}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollOptions={pollOptions}
        setPollOptions={setPollOptions}
      />

      {/* Repost Modal */}
      <RepostModal
        showRepostModal={showRepostModal}
        setShowRepostModal={setShowRepostModal}
        repostQuote={repostQuote}
        setRepostQuote={setRepostQuote}
        confirmRepost={confirmRepost}
        isDarkMode={isDarkMode}
        glassModalStyle={glassModalStyle}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        showAnalyticsModal={showAnalyticsModal}
        setShowAnalyticsModal={setShowAnalyticsModal}
        posts={realtimePosts}
        isDarkMode={isDarkMode}
        glassModalStyle={glassModalStyle}
      />
    </div>
  );
};

export default HomePage;
