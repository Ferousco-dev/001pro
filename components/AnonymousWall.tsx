import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  SocialPost,
  UserProfile,
  Comment,
  Category,
  PostReaction,
  Bookmark,
  Draft,
  REACTION_TYPES,
  ReactionType,
} from "../types";
import { sharePost } from "../utils/shareUtils";
import { uploadImageToImgbb, validateImageFile } from "../utils/imageUpload";
import { extractMentions, highlightMentions } from "../utils/mentionUtils";
import { supabase } from "../supabaseClient";
import { AnonymousPostCard } from "./AnonymousWall/AnonymousPostCard";
import { AnonymousComposer } from "./AnonymousWall/AnonymousComposer";
import {
  IconClose,
  IconComment,
  IconMoon,
  IconPlus,
  IconTrendingUp,
} from "./AnonymousWall/Icons";

interface AnonymousWallProps {
  posts: SocialPost[];
  user: UserProfile;
  categories?: Category[];
  drafts?: Draft[];
  bookmarks?: Bookmark[];
  onCreatePost: (
    content: string,
    background?: string,
    mediaUrls?: string[],
    categories?: string[],
    mentionedUsers?: string[],
  ) => void;
  onLike: (postId: string) => void;
  onAddComment: (
    postId: string,
    content: string,
    parentCommentId?: string,
  ) => void;
  onLikeComment: (postId: string, commentId: string) => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onAddReaction?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string, reactionType: ReactionType) => void;
  onBookmark?: (postId: string) => void;
  onRemoveBookmark?: (postId: string) => void;
  onSaveDraft?: (
    content: string,
    background?: string,
    mediaUrls?: string[],
    categories?: string[],
  ) => void;
  onLoadDraft?: (draftId: string) => void;
  onDeleteDraft?: (draftId: string) => void;
  onUploadImages?: (files: File[]) => Promise<string[]>;
  isDarkMode?: boolean;
  verifiedOnlyMode?: boolean;
  onToggleTheme?: () => void;
}

const BACKGROUND_OPTIONS = [
  { id: "", label: "None", gradient: "" },
  {
    id: "sunset",
    label: "Sunset",
    gradient: "bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600",
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600",
  },
  {
    id: "forest",
    label: "Forest",
    gradient: "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600",
  },
  {
    id: "fire",
    label: "Fire",
    gradient: "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500",
  },
  {
    id: "purple",
    label: "Purple",
    gradient: "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500",
  },
  {
    id: "night",
    label: "Night",
    gradient: "bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
  },
];

const AnonymousWall: React.FC<AnonymousWallProps> = ({
  posts,
  user,
  categories = [],
  drafts = [],
  bookmarks = [],
  onCreatePost,
  onLike,
  onAddComment,
  onLikeComment,
  onDeletePost,
  onDeleteComment,
  onAddReaction,
  onRemoveReaction,
  onBookmark,
  onRemoveBookmark,
  onSaveDraft,
  onLoadDraft,
  onDeleteDraft,
  onUploadImages,
  isDarkMode: externalDarkMode,
  verifiedOnlyMode = false,
  onToggleTheme: externalToggleTheme,
}) => {
  // State management
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showTextComposer, setShowTextComposer] = useState(false);
  const [postInput, setPostInput] = useState("");
  const [selectedBackground, setSelectedBackground] = useState("");
  const [message, setMessage] = useState("");
  const [internalDarkMode, setInternalDarkMode] = useState(true);

  // Use external theme if provided, otherwise use internal state
  const isDarkMode =
    externalDarkMode !== undefined ? externalDarkMode : internalDarkMode;
  const setIsDarkMode = externalToggleTheme || setInternalDarkMode;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent");
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);

  // New state for enhanced features
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [realtimePosts, setRealtimePosts] = useState<SocialPost[]>(posts);

  // ===== NEW POSTS INDICATOR STATE =====
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);
  const [pendingNewPosts, setPendingNewPosts] = useState<SocialPost[]>([]);
  const [isLoadingNewPosts, setIsLoadingNewPosts] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const lastKnownPostIdRef = useRef<string | null>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const newPostsPillStyle = {
    background: "rgba(59, 130, 246, 0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    boxShadow:
      "0 10px 40px -10px rgba(59, 130, 246, 0.5), 0 4px 20px -5px rgba(0, 0, 0, 0.3)",
  };

  // Bottom sheet drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize realtime posts
  useEffect(() => {
    setRealtimePosts(posts);
    if (posts.length > 0 && !lastKnownPostIdRef.current) {
      lastKnownPostIdRef.current = posts[0]?.id || null;
    }
  }, [posts]);

  // Load new posts function
  const handleLoadNewPosts = () => {
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

    setNewPostsCount(0);
    setHasScrolledDown(false);

    setTimeout(() => {
      if (realtimePosts.length > 0) {
        lastKnownPostIdRef.current = realtimePosts[0]?.id || null;
      }
      setIsLoadingNewPosts(false);
    }, 500);
  };

  // Realtime Subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel("anonymous_posts_realtime_page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anonymous_posts" },
        (payload) => {
          const p = payload.new as any;
          const newPost: SocialPost = {
            ...p,
            timestamp: new Date(p.created_at || p.timestamp),
            fileUrl: p.file_url || p.fileUrl,
            externalLink: p.external_link,
            isOfficial: p.is_official,
            likes: p.likes || [],
            comments: p.comments || [],
            reactions: p.reactions || [],
            bookmarks: p.bookmarks || [],
          };

          setNewPostsCount((prev) => prev + 1);
          setPendingNewPosts((prev) => {
            const exists = prev.some((p) => p.id === newPost.id);
            if (exists) return prev;
            return [newPost, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "anonymous_posts" },
        (payload) => {
          const updatedPost = payload.new as SocialPost & { timestamp: string };
          setRealtimePosts((prev) =>
            prev.map((p) =>
              p.id === updatedPost.id
                ? {
                    ...p,
                    ...updatedPost,
                    timestamp: new Date(updatedPost.timestamp),
                  }
                : p,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "anonymous_posts" },
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
  }, [user]);

  // Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector("main");
      const currentScrollY = mainElement
        ? (mainElement as HTMLElement).scrollTop
        : window.scrollY;

      setShowScrollToTop(currentScrollY > 300);

      if (currentScrollY > 150) {
        setHasScrolledDown(true);
      } else {
        setHasScrolledDown(false);
        if (currentScrollY < 50) {
          // Do NOT auto merge
        }
      }
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
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-expand textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height =
        Math.min(textAreaRef.current.scrollHeight, 300) + "px";
    }
  }, [postInput]);

  // Drag handlers for bottom sheet
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragCurrentY(clientY);
  };

  const handleDragMove = (e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragCurrentY(clientY);
    const diff = clientY - dragStartY;
    if (diff > 0) {
      setSheetTranslateY(diff);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = dragCurrentY - dragStartY;
    if (diff > 100) {
      closeComposer();
    }
    setSheetTranslateY(0);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleDragMove);
      document.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragStartY]);

  const openComposer = () => {
    setShowTextComposer(true);
    setTimeout(() => textAreaRef.current?.focus(), 100);
  };

  const closeComposer = () => {
    setShowTextComposer(false);
    setPostInput("");
    setSelectedBackground("");
    setSelectedCategories([]);
    setUploadedImages([]);
    setCurrentDraft(null);
    setSheetTranslateY(0);
  };

  const handleCreatePost = async () => {
    if (verifiedOnlyMode && !user.is_verified && !user.is_admin) {
      showToastMessage("Verified users only!");
      return;
    }

    if (!postInput.trim() && uploadedImages.length === 0) {
      showToastMessage("Add content or images to post");
      return;
    }

    if (postInput.trim().length < 3 && uploadedImages.length === 0) {
      showToastMessage("Post must be at least 3 characters or include images");
      return;
    }

    try {
      const mentionedUsers = extractMentions(postInput);

      // Background sending: close composer and show success immediately
      onCreatePost(
        postInput.trim(),
        selectedBackground,
        uploadedImages,
        selectedCategories,
        mentionedUsers,
      );

      closeComposer();
      showToastMessage("Post sent to background!");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error creating post:", error);
      showToastMessage("Failed to initiate posting");
    }
  };

  const handleAddComment = (postId: string) => {
    const comment = commentInputs[postId]?.trim();
    if (comment && comment.length > 0) {
      onAddComment(postId, comment);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const showToastMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleShare = async (post: SocialPost) => {
    try {
      await sharePost(post, "ANONPRO");
      showToastMessage("Post shared as image!");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Share failed:", error);
      showToastMessage("Failed to share post");
    }
  };

  // Image upload handlers
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files) as File[];
    const invalidFiles = fileArray.filter(
      (file) => !validateImageFile(file).isValid,
    );
    if (invalidFiles.length > 0) {
      showToastMessage(
        "Some files are invalid. Please check file type and size.",
      );
      return;
    }

    if (uploadedImages.length + fileArray.length > 4) {
      showToastMessage("Maximum 4 images allowed per post");
      return;
    }

    setIsUploadingImages(true);
    try {
      const compressionPromises = fileArray.map((file) =>
        compressImage(file, 2),
      );
      const compressedFiles = await Promise.all(compressionPromises);

      const imageUrls = await Promise.all(
        compressedFiles.map(async (file) => {
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.jpg`;
          const { data, error } = await supabase.storage
            .from("images")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);
          return urlData.publicUrl;
        }),
      );

      setUploadedImages((prev) => [...prev, ...imageUrls]);
      showToastMessage(`Uploaded ${imageUrls.length} image(s)`);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Image upload failed:", error);
      showToastMessage("Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Draft handlers
  const handleSaveDraft = () => {
    if (!postInput.trim() && uploadedImages.length === 0) {
      showToastMessage("Add content or images to save as draft");
      return;
    }
    try {
      onSaveDraft?.(
        postInput,
        selectedBackground,
        uploadedImages,
        selectedCategories,
      );
      closeComposer();
      showToastMessage("Draft saved!");
    } catch (error) {
      showToastMessage("Failed to save draft");
    }
  };

  const handleLoadDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setPostInput(draft.content || "");
    setSelectedBackground(draft.background || "");
    setSelectedCategories(draft.categoryIds || []);
    setUploadedImages(draft.mediaUrls || []);
    setShowTextComposer(true);
    setShowDrafts(false);
    showToastMessage("Draft loaded");
  };

  const handleDeleteDraft = (draftId: string) => {
    try {
      onDeleteDraft?.(draftId);
      showToastMessage("Draft deleted");
    } catch (error) {
      showToastMessage("Failed to delete draft");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const compressImage = (file: File, maxSizeMB: number = 2): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        if (file.size <= maxSizeMB * 1024 * 1024) {
          resolve(file);
          return;
        }

        const targetSize = maxSizeMB * 1024 * 1024;
        const compressionRatio = Math.sqrt(targetSize / file.size);
        width = Math.max(Math.floor(width * compressionRatio), 800);
        height = Math.max(Math.floor(height * compressionRatio), 600);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85,
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLikeClick = (postId: string) => {
    onLike(postId);
  };

  // Calculate trending mentions for sort
  const trendingTags = useMemo(() => {
    const counts: Record<string, number> = {};
    realtimePosts.forEach((post) => {
      const mentions = extractMentions(post.content || "");
      mentions.forEach((mention) => {
        const clean = mention.toLowerCase();
        counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return counts;
  }, [realtimePosts]);

  const filteredPosts = useMemo(() => {
    return [...realtimePosts].sort((a, b) => {
      if (sortBy === "trending") {
        // Tag-based trending calculation: rank by mention count + likes
        const aMentions = extractMentions(a.content || "");
        const bMentions = extractMentions(b.content || "");

        const aMentionScore = aMentions.reduce(
          (acc, m) => acc + (trendingTags[m.toLowerCase()] || 0),
          0,
        );
        const bMentionScore = bMentions.reduce(
          (acc, m) => acc + (trendingTags[m.toLowerCase()] || 0),
          0,
        );

        const aScore = (a.likes?.length || 0) * 2 + aMentionScore;
        const bScore = (b.likes?.length || 0) * 2 + bMentionScore;

        if (bScore !== aScore) return bScore - aScore;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [realtimePosts, sortBy, trendingTags]);

  return (
    <div
      className={`w-full ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Toast Message */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-purple-600 text-white rounded-full shadow-lg text-xs font-medium">
          {message}
        </div>
      )}

      {/* New Posts Indicator */}
      {newPostsCount > 0 && (
        <button
          onClick={handleLoadNewPosts}
          disabled={isLoadingNewPosts}
          style={newPostsPillStyle}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white font-semibold text-sm flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 animate-in slide-in-from-top-4"
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
              {newPostsCount} New Anonymous Posts
            </>
          )}
        </button>
      )}

      {/* Sort Options - Minimal */}
      <div className="px-[3px] py-2">
        <div
          className={`inline-flex items-center gap-1 p-1 rounded-xl ${
            isDarkMode
              ? "bg-gray-900/40 border border-gray-800/50"
              : "bg-gray-100/40 border border-gray-200/50"
          }`}
        >
          <button
            onClick={() =>
              setSortBy(sortBy === "recent" ? "trending" : "recent")
            }
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800/60"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <IconTrendingUp />
            <span>{sortBy === "trending" ? "Trending" : "Recent"}</span>
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800/60"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <IconMoon />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="px-[3px] pb-20">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div
              className={`w-10 h-10 rounded-full ${
                isDarkMode ? "bg-black" : "bg-gray-100"
              } flex items-center justify-center mb-3`}
            >
              <IconComment />
            </div>
            <p className="text-sm font-bold mb-1">No posts yet</p>
            <p
              className={`text-[10px] ${
                isDarkMode ? "text-gray-600" : "text-gray-500"
              }`}
            >
              Be the first to post anonymously
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <AnonymousPostCard
              key={post.id}
              post={post}
              user={user}
              isDarkMode={isDarkMode}
              onLike={handleLikeClick}
              onAddComment={onAddComment}
              onLikeComment={onLikeComment}
              onDeletePost={onDeletePost}
              onDeleteComment={onDeleteComment}
              handleShare={handleShare}
              toggleComments={toggleComments}
              showComments={showComments}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
              handleAddComment={handleAddComment}
              setShowImagePreview={setShowImagePreview}
              showPostMenu={showPostMenu}
              setShowPostMenu={setShowPostMenu}
            />
          ))
        )}
      </div>

      {/* FAB Button */}
      <button
        onClick={openComposer}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        <IconPlus />
      </button>

      <AnonymousComposer
        isDarkMode={isDarkMode}
        user={user}
        showTextComposer={showTextComposer}
        closeComposer={closeComposer}
        postInput={postInput}
        setPostInput={setPostInput}
        handleCreatePost={handleCreatePost}
        handleSaveDraft={handleSaveDraft}
        uploadedImages={uploadedImages}
        removeUploadedImage={removeUploadedImage}
        selectedBackground={selectedBackground}
        setSelectedBackground={setSelectedBackground}
        BACKGROUND_OPTIONS={BACKGROUND_OPTIONS}
        categories={categories}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        fileInputRef={fileInputRef}
        handleImageUpload={handleImageUpload}
        isUploadingImages={isUploadingImages}
        drafts={drafts}
        showDrafts={showDrafts}
        setShowDrafts={setShowDrafts}
        handleLoadDraft={handleLoadDraft}
        handleDeleteDraft={handleDeleteDraft}
        currentDraft={currentDraft}
        sheetTranslateY={sheetTranslateY}
        handleDragStart={handleDragStart}
        composerRef={composerRef}
        textAreaRef={textAreaRef}
      />

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2"
          onClick={() => setShowImagePreview(null)}
        >
          <img
            src={showImagePreview}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setShowImagePreview(null)}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
          >
            <IconClose />
          </button>
        </div>
      )}
    </div>
  );
};

export default AnonymousWall;
