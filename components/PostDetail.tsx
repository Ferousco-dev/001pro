import React, { useState } from "react";
import { SocialPost, UserProfile, Comment } from "../types";
import MediaViewer from "./MediaViewer";

interface PostDetailProps {
  post: SocialPost;
  viewer: UserProfile;
  onClose: () => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (postId: string) => void;
  // third arg is optional parent comment id for replies
  onAddComment: (
    postId: string,
    content: string,
    parentCommentId?: string
  ) => void;
  onAliasClick: (alias: string) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  post,
  viewer,
  onClose,
  onLike,
  onRepost,
  onShare,
  onAddComment,
  onAliasClick,
}) => {
  const [commentText, setCommentText] = useState("");
  const [showViewer, setShowViewer] = useState(false);
  const [replyTarget, setReplyTarget] = useState<null | {
    id: string;
    author: string;
  }>(null);

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim(), replyTarget?.id);
    setCommentText("");
    setReplyTarget(null);
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-0">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-black/60">
        <button onClick={onClose} className="text-sm px-3 py-2">
          Close
        </button>
        <div className="flex-1">
          <div className="font-black text-lg">Post</div>
          <div className="text-xs text-gray-400">
            @{post.authorAlias} · {new Date(post.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white/5 border border-gray-800 rounded-2xl p-4">
          {/* Media */}
          {(() => {
            const mediaUrls =
              post.mediaUrls && post.mediaUrls.length > 0
                ? post.mediaUrls
                : post.fileUrl
                ? [post.fileUrl]
                : [];
            if (mediaUrls.length === 0) return null;
            const url = mediaUrls[0];
            const isVideo = url.includes(".mp4") || url.includes("video");
            return (
              <div className="mb-4 rounded-xl overflow-hidden">
                <div
                  onClick={() => setShowViewer(true)}
                  className="cursor-zoom-in"
                >
                  {isVideo ? (
                    <video src={url} controls className="w-full rounded-xl" />
                  ) : (
                    <img src={url} alt="post" className="w-full rounded-xl" />
                  )}
                </div>
              </div>
            );
          })()}

          {/* Content */}
          {post.content && (
            <div className="mb-3 text-base leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => onLike(post.id)} className="py-2 px-3">
              {post.likes?.includes(viewer.alias) ? "♥" : "♡"}{" "}
              {post.likes?.length || 0}
            </button>
            <button onClick={() => onRepost(post.id)} className="py-2 px-3">
              Repost {post.repostCount || 0}
            </button>
            <button onClick={() => onShare(post.id)} className="py-2 px-3">
              Share
            </button>
          </div>

          {/* Comments list (scrollable) */}
          <div className="max-h-[55vh] overflow-y-auto space-y-4 mb-28 pr-2">
            {(post.comments || []).map((c: Comment) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.authorAlias?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{c.authorAlias}</span>
                    <span className="text-xs text-gray-400">
                      @{c.authorAlias}
                    </span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">
                    {c.content}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <button
                      onClick={() =>
                        setReplyTarget({ id: c.id, author: c.authorAlias })
                      }
                      className="hover:text-blue-400"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Render replies */}
                  {(c.replies || []).length > 0 && (
                    <div className="mt-3 pl-12 space-y-3">
                      {(c.replies || []).map((r: Comment) => (
                        <div key={r.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {r.authorAlias?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">
                                {r.authorAlias}
                              </span>
                              <span className="text-xs text-gray-400">
                                @{r.authorAlias}
                              </span>
                              <span className="text-xs text-gray-500">·</span>
                              <span className="text-xs text-gray-400">
                                {new Date(r.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">
                              {r.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>{" "}
        {/* CLOSE post card */}
        {/* Fixed comment input */}
        <div className="fixed left-0 right-0 bottom-0 max-w-2xl mx-auto p-4 bg-transparent">
          <div className="bg-black/70 backdrop-blur rounded-2xl px-3 py-3 flex flex-col gap-2">
            {/* Reply target chip */}
            {replyTarget ? (
              <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-800 rounded-full">
                <div className="text-xs text-gray-300">
                  Replying to{" "}
                  <span className="font-bold text-white">
                    @{replyTarget.author}
                  </span>
                </div>
                <button
                  onClick={() => setReplyTarget(null)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-full"
                  aria-label="Cancel reply"
                >
                  ✕
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  document.getElementById("post-detail-camera")?.click()
                }
                className="p-2 rounded-full"
                title="Add photo"
              >
                📷
              </button>
              <input
                id="post-detail-camera"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    alert("Image replies coming soon");
                  }
                  e.currentTarget.value = "";
                }}
              />

              <input
                type="text"
                placeholder={
                  replyTarget
                    ? `Replying to @${replyTarget.author}`
                    : "Write a reply"
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                className="flex-1 bg-transparent outline-none px-3 text-sm"
              />

              <button
                onClick={handleSubmit}
                className="px-3 py-2 rounded-full bg-blue-600 text-white text-sm"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
        {showViewer && (
          <MediaViewer
            mediaUrls={
              post.mediaUrls?.length
                ? post.mediaUrls
                : post.fileUrl
                ? [post.fileUrl]
                : []
            }
            onClose={() => setShowViewer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PostDetail;
