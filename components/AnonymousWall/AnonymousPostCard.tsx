import React from "react";
import { SocialPost, UserProfile } from "../../types";
import { highlightMentions } from "../../utils/mentionUtils";
import { IconComment, IconHeart, IconShare, IconEye, IconTrash } from "./Icons";
import { CommentsSection } from "./CommentsSection";

interface AnonymousPostCardProps {
  post: SocialPost;
  user: UserProfile;
  isDarkMode: boolean;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (postId: string, commentId: string) => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  handleShare: (post: SocialPost) => void;
  toggleComments: (postId: string) => void;
  showComments: Record<string, boolean>;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  handleAddComment: (postId: string) => void;
  setShowImagePreview: (url: string) => void;
  showPostMenu: string | null;
  setShowPostMenu: (id: string | null) => void;
}

export const AnonymousPostCard: React.FC<AnonymousPostCardProps> = ({
  post,
  user,
  isDarkMode,
  onLike,
  onAddComment,
  onLikeComment,
  onDeletePost,
  onDeleteComment,
  handleShare,
  toggleComments,
  showComments,
  commentInputs,
  setCommentInputs,
  handleAddComment,
  setShowImagePreview,
  showPostMenu,
  setShowPostMenu,
}) => {
  return (
    <article
      className={`border-b ${
        isDarkMode ? "border-gray-900" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-2.5 p-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          ?
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-purple-400">
                Anonymous
              </span>
              {post.isOfficial && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-black text-[8px] font-black rounded-md uppercase tracking-tighter">
                  OFFICIAL
                </span>
              )}
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {new Date(post.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {user && user.role === "ADMIN" && (
              <div className="relative">
                <button
                  onClick={() =>
                    setShowPostMenu(showPostMenu === post.id ? null : post.id)
                  }
                  className={`p-1 rounded text-[10px] ${
                    isDarkMode
                      ? "text-gray-600 hover:text-red-400"
                      : "text-gray-400 hover:text-red-600"
                  }`}
                >
                  ⚙️
                </button>
                {showPostMenu === post.id && (
                  <div
                    className={`absolute right-0 mt-1 w-28 rounded-lg shadow-lg z-20 ${
                      isDarkMode
                        ? "bg-gray-900 border border-gray-800"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {onDeletePost && (
                      <button
                        onClick={() => {
                          onDeletePost(post.id);
                          setShowPostMenu(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[10px] flex items-center gap-1 ${
                          isDarkMode
                            ? "text-red-500 hover:bg-gray-800"
                            : "text-red-600 hover:bg-gray-100"
                        }`}
                      >
                        <IconTrash /> Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleShare(post);
                        setShowPostMenu(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[10px] flex items-center gap-1 ${
                        isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                      }`}
                    >
                      <IconShare /> Share
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {post.content && post.content.trim() && (
            <div
              className={`${post.background || ""} ${
                post.background
                  ? "p-4 rounded-2xl my-2 aspect-square flex items-center justify-center"
                  : ""
              }`}
            >
              <p
                className={`${
                  post.background
                    ? "text-white text-center text-base font-bold px-2"
                    : "text-sm"
                } leading-relaxed whitespace-pre-wrap break-words`}
                dangerouslySetInnerHTML={{
                  __html: highlightMentions(post.content, user?.alias || "")
                    .text,
                }}
              />
            </div>
          )}

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div
              className={`mt-2 grid gap-1 ${
                post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.mediaUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg cursor-pointer"
                  onClick={() => setShowImagePreview(url)}
                >
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    style={{
                      aspectRatio:
                        post.mediaUrls!.length === 1 ? "16/9" : "1/1",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.categories.map((categoryName) => {
                const categoryColors: Record<string, string> = {
                  General: "#6366f1",
                  Confession: "#ef4444",
                  Advice: "#10b981",
                  Story: "#f59e0b",
                  Question: "#8b5cf6",
                  Gratitude: "#06b6d4",
                  Rant: "#f97316",
                  Celebration: "#ec4899",
                  Help: "#84cc16",
                  Discussion: "#6b7280",
                };
                const color = categoryColors[categoryName] || "#6b7280";
                return (
                  <span
                    key={categoryName}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {categoryName}
                  </span>
                );
              })}
            </div>
          )}

          {/* External Link Button */}
          {post.externalLink && (
            <div className="mt-3">
              <a
                href={post.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    🔗
                  </div>
                  <p className="text-[10px] font-bold text-white truncate">
                    {post.externalLink.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                </div>
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest shrink-0">
                  View →
                </span>
              </a>
            </div>
          )}

          {/* Action Bar */}
          <div
            className={`flex items-center gap-6 mt-3 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-1.5 text-xs hover:text-purple-500 transition-colors"
            >
              <IconComment />
              <span>{(post.comments ?? []).length}</span>
            </button>

            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                user && (post.likes ?? []).includes(user.alias)
                  ? "text-red-500"
                  : "hover:text-red-500"
              }`}
            >
              <IconHeart
                filled={user ? (post.likes ?? []).includes(user.alias) : false}
              />
              <span>{(post.likes ?? []).length}</span>
            </button>

            <button
              onClick={() => handleShare(post)}
              className="flex items-center gap-1.5 text-xs hover:text-blue-500 transition-colors"
            >
              <IconShare />
            </button>

            <span className="flex items-center gap-1.5 text-xs">
              <IconEye />
              <span>{post.viewCount || 0}</span>
            </span>
          </div>

          {/* Comments Section */}
          {showComments[post.id] && (
            <div
              className={`mt-2 pt-2 border-t ${
                isDarkMode ? "border-gray-900" : "border-gray-200"
              }`}
            >
              <CommentsSection
                comments={post.comments ?? []}
                postId={post.id}
                user={user}
                isDarkMode={isDarkMode}
                onLikeComment={onLikeComment}
                onDeleteComment={onDeleteComment}
              />

              <div className="relative flex items-center mt-2 group">
                <input
                  type="text"
                  placeholder="Reply..."
                  value={commentInputs[post.id] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && commentInputs[post.id]?.trim())
                      handleAddComment(post.id);
                  }}
                  className={`flex-1 pl-3 pr-10 py-2 rounded-2xl text-[11px] ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-800 placeholder-gray-600 text-white"
                      : "bg-gray-100 border-gray-300 placeholder-gray-500 text-black"
                  } border outline-none focus:border-purple-500 transition-all`}
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  disabled={!commentInputs[post.id]?.trim()}
                  className="absolute right-1.5 p-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed group-focus-within:scale-105"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
