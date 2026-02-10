import React from "react";
import { SocialPost, UserProfile } from "../../types";
import VerificationBadge from "../VerificationBadge";
import { Poll } from "./Poll";

interface PostCardProps {
  post: SocialPost;
  user: UserProfile;
  profiles: Record<string, UserProfile>;
  isDarkMode: boolean;
  glassStyle: React.CSSProperties;
  glassCardStyle: React.CSSProperties;
  onAliasClick: (alias: string) => void;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeletePost?: (postId: string) => void;
  handleRepost: (postId: string) => void;
  handleShare: (post: SocialPost) => void;
  setShowAnalyticsModal: (postId: string | null) => void;
  toggleComments: (postId: string) => void;
  showComments: Record<string, boolean>;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  currentImageIndex: Record<string, number>;
  setCurrentImageIndex: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  failedImages: Set<string>;
  handleImageError: (postId: string, imageUrl: string) => void;
  postRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  profiles,
  isDarkMode,
  glassStyle,
  glassCardStyle,
  onAliasClick,
  onLikePost,
  onAddComment,
  onDeletePost,
  handleRepost,
  handleShare,
  setShowAnalyticsModal,
  toggleComments,
  showComments,
  commentInputs,
  setCommentInputs,
  currentImageIndex,
  setCurrentImageIndex,
  failedImages,
  handleImageError,
  postRefs,
}) => {
  const mediaUrls =
    post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.fileUrl
        ? [post.fileUrl]
        : [];

  const currentIndex = currentImageIndex[post.id] || 0;
  const showCarousel = mediaUrls.length > 1;
  const currentUrl = mediaUrls[currentIndex];
  const isImageFailed = failedImages.has(`${post.id}-${currentUrl}`);
  const isVideo = currentUrl?.includes(".mp4") || currentUrl?.includes("video");

  return (
    <article
      ref={(el) => (postRefs.current[post.id] = el)}
      data-post-id={post.id}
      className={`border-b transition-all duration-200 relative ${
        isDarkMode
          ? "border-neutral-800/60 hover:bg-neutral-900/30"
          : "border-gray-200/80 hover:bg-white/50"
      }`}
    >
      {/* Post Content */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Author Avatar */}
          <div
            onClick={() => onAliasClick(post.authorAlias)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg ring-2 ring-white/10"
            title={`@${post.authorAlias}`}
          >
            {profiles[post.authorAlias]?.profile_image ? (
              <img
                src={profiles[post.authorAlias]?.profile_image}
                alt={post.authorAlias}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                {post.authorAlias?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Post Body */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <button
                  onClick={() => onAliasClick(post.authorAlias)}
                  className="font-semibold hover:underline underline-offset-2 text-sm tracking-tight"
                  title={post.authorAlias}
                >
                  {post.authorAlias}
                  {profiles[post.authorAlias]?.is_verified && (
                    <VerificationBadge size="sm" className="ml-1" />
                  )}
                  {profiles[post.authorAlias]?.is_admin && (
                    <span className="ml-1 text-xs" title="Admin">
                      👑
                    </span>
                  )}
                  {post.isOfficial && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-black text-[8px] font-black rounded-md uppercase tracking-tighter shadow-lg shadow-blue-500/20 animate-pulse">
                      OFFICIAL
                    </span>
                  )}
                </button>
                <span
                  className={`text-xs ${
                    isDarkMode ? "text-neutral-600" : "text-gray-400"
                  }`}
                >
                  •
                </span>
                <span
                  className={`text-xs ${
                    isDarkMode ? "text-neutral-500" : "text-gray-500"
                  }`}
                >
                  {new Date(post.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {onDeletePost &&
                (user.alias === post.authorAlias ||
                  user.role === "ADMIN" ||
                  user.is_admin) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm("Delete this transmission permanently?")
                      ) {
                        onDeletePost(post.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Terminate Transmission"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
            </div>

            {/* Content */}
            {post.content && post.content.trim() && post.content !== " " && (
              <div
                className={`${post.background || ""} ${
                  post.background
                    ? "p-4 sm:p-5 rounded-2xl my-3 min-h-[100px] sm:min-h-[120px] flex items-center justify-center shadow-xl"
                    : ""
                }`}
              >
                <p
                  className={`${
                    post.background
                      ? "text-white text-center text-lg sm:text-xl font-bold drop-shadow-md"
                      : "text-[15px] sm:text-base"
                  } leading-relaxed whitespace-pre-wrap break-words font-medium`}
                >
                  {post.content}
                </p>
              </div>
            )}

            {/* Poll */}
            {post.poll && (
              <Poll
                postId={post.id}
                poll={post.poll}
                user={user}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Media */}
            {mediaUrls.length > 0 && (
              <div
                className={`mt-3 rounded-2xl overflow-hidden relative ${
                  isDarkMode ? "bg-neutral-900" : "bg-gray-100"
                }`}
                style={{
                  border: isDarkMode
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {isImageFailed ? (
                  <div
                    className={`w-full aspect-square flex flex-col items-center justify-center ${
                      isDarkMode ? "bg-neutral-900" : "bg-gray-100"
                    }`}
                  >
                    <svg
                      className={`w-12 h-12 sm:w-16 sm:h-16 ${
                        isDarkMode ? "text-neutral-700" : "text-gray-400"
                      } mb-2`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        isDarkMode ? "text-neutral-500" : "text-gray-500"
                      }`}
                    >
                      Image unavailable
                    </p>
                  </div>
                ) : isVideo ? (
                  <video
                    src={currentUrl}
                    controls
                    className="w-full aspect-square object-cover"
                    onError={() => handleImageError(post.id, currentUrl)}
                  />
                ) : (
                  <img
                    src={currentUrl}
                    alt="Post media"
                    className="w-full aspect-square object-cover transition-opacity duration-200"
                    loading="lazy"
                    onError={() => handleImageError(post.id, currentUrl)}
                  />
                )}

                {/* Carousel */}
                {showCarousel && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => ({
                          ...prev,
                          [post.id]:
                            currentIndex > 0
                              ? currentIndex - 1
                              : mediaUrls.length - 1,
                        }));
                      }}
                      style={glassStyle}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      aria-label="Prev media"
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => ({
                          ...prev,
                          [post.id]:
                            currentIndex < mediaUrls.length - 1
                              ? currentIndex + 1
                              : 0,
                        }));
                      }}
                      style={glassStyle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      aria-label="Next media"
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {/* Carousel indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {mediaUrls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => ({
                              ...prev,
                              [post.id]: idx,
                            }));
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex
                              ? "w-6 bg-white"
                              : "w-1.5 bg-white/50"
                          }`}
                          aria-label={`Go to image ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <div
                      style={glassStyle}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                    >
                      {currentIndex + 1}/{mediaUrls.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Interaction Bar */}
            <div
              className={`flex items-center justify-between mt-4 pb-1 border-t ${isDarkMode ? "border-white/5" : "border-gray-100"} pt-2`}
            >
              <div className="flex items-center gap-1 sm:gap-2 w-full justify-between max-w-[400px]">
                {/* Comment Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComments(post.id);
                  }}
                  className={`flex items-center gap-1 group transition-colors ${
                    showComments[post.id]
                      ? "text-blue-500"
                      : isDarkMode
                        ? "text-neutral-500 hover:text-blue-500"
                        : "text-gray-400 hover:text-blue-500"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full transition-colors ${
                      showComments[post.id]
                        ? "bg-blue-500/10"
                        : "group-hover:bg-blue-500/10"
                    }`}
                  >
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium">
                    {post.comments?.length || 0}
                  </span>
                </button>

                {/* Repost Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRepost(post.id);
                  }}
                  className={`flex items-center gap-1 group transition-colors ${
                    post.repostCount > 0
                      ? "text-green-500"
                      : isDarkMode
                        ? "text-neutral-500 hover:text-green-500"
                        : "text-gray-400 hover:text-green-500"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full transition-colors ${
                      post.repostCount > 0
                        ? "bg-green-500/10"
                        : "group-hover:bg-green-500/10"
                    }`}
                  >
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium">
                    {post.repostCount || 0}
                  </span>
                </button>

                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikePost(post.id);
                  }}
                  className={`flex items-center gap-1 group transition-colors ${
                    post.likes?.includes(user.alias)
                      ? "text-red-500"
                      : isDarkMode
                        ? "text-neutral-500 hover:text-red-500"
                        : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full transition-colors ${
                      post.likes?.includes(user.alias)
                        ? "bg-red-500/10"
                        : "group-hover:bg-red-500/10"
                    }`}
                  >
                    <svg
                      className={`w-[18px] h-[18px] ${post.likes?.includes(user.alias) ? "fill-current" : "fill-none"}`}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium">
                    {post.likes?.length || 0}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(post);
                  }}
                  className={`p-1.5 rounded-full transition-colors group ${
                    isDarkMode
                      ? "text-neutral-500 hover:text-blue-500 hover:bg-blue-500/10"
                      : "text-gray-400 hover:text-blue-500 hover:bg-blue-500/10"
                  }`}
                >
                  <svg
                    className="w-[18px] h-[18px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.75"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </button>

                {/* Analytics/Views for owner */}
                {user.alias === post.authorAlias && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAnalyticsModal(post.id);
                    }}
                    className={`p-1.5 rounded-full transition-colors group ${
                      isDarkMode
                        ? "text-neutral-500 hover:text-blue-500 hover:bg-blue-500/10"
                        : "text-gray-400 hover:text-blue-500 hover:bg-blue-500/10"
                    }`}
                  >
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div
                className={`mt-4 pt-4 border-t ${
                  isDarkMode ? "border-neutral-800/50" : "border-gray-200/50"
                } space-y-4`}
              >
                {/* Input */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.alias}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] text-white font-bold">
                        {user.alias[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Post your reply..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          commentInputs[post.id]?.trim()
                        ) {
                          onAddComment(post.id, commentInputs[post.id]);
                        }
                      }}
                      className={`w-full py-2 px-4 rounded-full text-sm outline-none transition-all ${
                        isDarkMode
                          ? "bg-neutral-900 border-neutral-800 focus:border-blue-500/50"
                          : "bg-gray-100 border-gray-200 focus:border-blue-500/50"
                      } border`}
                    />
                    <button
                      disabled={!commentInputs[post.id]?.trim()}
                      onClick={() =>
                        onAddComment(post.id, commentInputs[post.id])
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs disabled:opacity-50 px-3 py-1 hover:bg-blue-500/10 rounded-full transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>

                {/* List */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-4 pb-2">
                    {post.comments.map((comment, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => onAliasClick(comment.authorAlias)}
                        >
                          {profiles[comment.authorAlias]?.profile_image ? (
                            <img
                              src={profiles[comment.authorAlias]?.profile_image}
                              alt={comment.authorAlias}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] text-white font-bold">
                              {comment.authorAlias[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className="font-bold text-xs hover:underline cursor-pointer"
                              onClick={() => onAliasClick(comment.authorAlias)}
                            >
                              {comment.authorAlias}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-neutral-300" : "text-gray-700"
                            } leading-relaxed`}
                          >
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
