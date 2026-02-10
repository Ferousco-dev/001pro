import React, { useState } from "react";
import { SocialPost, UserProfile, Comment } from "../types";

const BG_OPTIONS = [
  { id: "none", class: "bg-slate-950/30 border-white/5", label: "Classic" },
  {
    id: "cosmic",
    class:
      "bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 border-none",
    label: "Cosmic",
  },
  {
    id: "ocean",
    class: "bg-gradient-to-br from-cyan-500 to-blue-700 border-none",
    label: "Ocean",
  },
  {
    id: "sunset",
    class:
      "bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 border-none",
    label: "Sunset",
  },
  {
    id: "emerald",
    class: "bg-gradient-to-br from-emerald-500 to-teal-700 border-none",
    label: "Emerald",
  },
  {
    id: "royal",
    class: "bg-gradient-to-br from-slate-800 to-slate-900 border-white/10",
    label: "Royal",
  },
];

interface SocialWallProps {
  posts: SocialPost[];
  user: UserProfile;
  onCreatePost: (content: string, background?: string) => void;
  onLike: (postId: string) => void;
  onAddComment: (
    postId: string,
    content: string,
    parentCommentId?: string
  ) => void;
  onLikeComment: (postId: string, commentId: string) => void;
  onAliasClick?: (alias: string) => void;
}

const CommentItem: React.FC<{
  comment: Comment;
  postId: string;
  user: UserProfile;
  onLikeComment: (pid: string, cid: string) => void;
  onReply: (cid: string) => void;
  onAliasClick?: (a: string) => void;
  isReply?: boolean;
}> = ({
  comment,
  postId,
  user,
  onLikeComment,
  onReply,
  onAliasClick,
  isReply,
}) => {
  const hasLiked = comment.likes.includes(user.alias);

  return (
    <div
      className={`group/comment ${
        isReply ? "mt-3 pl-4 border-l border-slate-800" : "mt-4"
      }`}
    >
      <div className="flex gap-3">
        <div
          onClick={() => onAliasClick?.(comment.authorAlias)}
          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black cursor-pointer hover:bg-blue-600/20 transition-colors"
        >
          {comment.authorAlias[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="bg-slate-900/80 p-3 rounded-2xl rounded-tl-none inline-block min-w-[120px]">
            <div className="flex justify-between items-center gap-4 mb-1">
              <span className="text-[10px] font-black text-blue-400">
                @{comment.authorAlias}
              </span>
              <span className="text-[8px] text-slate-600 font-bold uppercase">
                {new Date(comment.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {comment.content}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-1.5 ml-1">
            <button
              onClick={() => onLikeComment(postId, comment.id)}
              className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter transition-colors ${
                hasLiked ? "text-red-500" : "text-slate-600 hover:text-red-400"
              }`}
            >
              {hasLiked ? "Liked" : "Like"}{" "}
              {comment.likes.length > 0 && `(${comment.likes.length})`}
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="text-[9px] font-black text-slate-600 uppercase tracking-tighter hover:text-blue-400 transition-colors"
            >
              Reply
            </button>
          </div>

          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              user={user}
              onLikeComment={onLikeComment}
              onReply={onReply}
              onAliasClick={onAliasClick}
              isReply
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SocialWall: React.FC<SocialWallProps> = ({
  posts,
  user,
  onCreatePost,
  onLike,
  onAddComment,
  onLikeComment,
  onAliasClick,
}) => {
  const [newPost, setNewPost] = useState("");
  const [selectedBg, setSelectedBg] = useState(BG_OPTIONS[0]);
  const [activeCommentId, setActiveCommentId] = useState<{
    pid: string;
    cid?: string;
  } | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const handlePost = () => {
    if (!newPost.trim()) return;
    onCreatePost(
      newPost.trim(),
      selectedBg.id === "none" ? undefined : selectedBg.class
    );
    setNewPost("");
    setSelectedBg(BG_OPTIONS[0]);
  };

  const handleSendComment = () => {
    if (!commentInput.trim() || !activeCommentId) return;
    onAddComment(activeCommentId.pid, commentInput.trim(), activeCommentId.cid);
    setCommentInput("");
    setActiveCommentId(null);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl space-y-6">
        <h3 className="text-xl font-black tracking-tighter italic flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded-full" />
          SHARE A TRANSMISSION
        </h3>

        <div
          className={`relative transition-all duration-500 rounded-[32px] overflow-hidden ${
            selectedBg.class
          } ${selectedBg.id !== "none" ? "h-64" : "h-32"}`}
        >
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Broadcast to the network..."
            className={`w-full h-full bg-transparent p-8 text-center flex items-center justify-center outline-none resize-none placeholder-white/20 font-black tracking-tight transition-all duration-500
              ${
                selectedBg.id !== "none"
                  ? "text-2xl text-white"
                  : "text-sm text-slate-200 text-left"
              }`}
          />
        </div>

        <div className="flex flex-wrap gap-2 py-2 overflow-x-auto no-scrollbar">
          {BG_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setSelectedBg(bg)}
              className={`w-10 h-10 rounded-xl border-2 transition-all shrink-0 ${
                bg.class
              } ${
                selectedBg.id === bg.id
                  ? "border-blue-500 scale-110 shadow-lg"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              title={bg.label}
            />
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
            Signed as @{user.alias}
          </span>
          <button
            onClick={handlePost}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 py-3 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase text-xs tracking-widest"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {posts.map((post) => {
          const hasLiked = post.likes.includes(user.alias);
          const isSpecial = !!post.background;

          return (
            <div
              key={post.id}
              className="animate-in slide-in-from-bottom-8 duration-700"
            >
              <div
                className={`rounded-[48px] overflow-hidden shadow-2xl border border-slate-800 transition-all hover:border-blue-500/20 bg-slate-900`}
              >
                <div className="p-6 flex items-center justify-between bg-slate-900/50">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => onAliasClick?.(post.authorAlias)}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-blue-500 group-hover:scale-110 transition-transform shadow-lg">
                      {post.authorAlias[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-200 group-hover:text-blue-400 transition-colors">
                        @{post.authorAlias}
                      </div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onLike(post.id)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all border font-black text-xs ${
                      hasLiked
                        ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-red-400 hover:text-red-400"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {post.likes.length}
                  </button>
                </div>

                <div
                  className={`p-10 ${
                    post.background || "bg-slate-900/30"
                  } flex items-center justify-center min-h-[200px]`}
                >
                  <p
                    className={`leading-relaxed tracking-tight ${
                      isSpecial
                        ? "text-3xl font-black text-white text-center shadow-black/20 text-shadow-xl"
                        : "text-slate-200 text-lg"
                    }`}
                  >
                    {post.content}
                  </p>
                </div>

                <div className="p-8 bg-slate-900/20">
                  <div className="flex items-center gap-6 mb-8">
                    <button
                      onClick={() => setActiveCommentId({ pid: post.id })}
                      className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {post.comments.length} Comments
                    </button>
                  </div>

                  <div className="space-y-2">
                    {post.comments.map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        postId={post.id}
                        user={user}
                        onLikeComment={onLikeComment}
                        onReply={(cid) =>
                          setActiveCommentId({ pid: post.id, cid })
                        }
                        onAliasClick={onAliasClick}
                      />
                    ))}
                  </div>

                  {activeCommentId?.pid === post.id && (
                    <div className="mt-8 flex gap-3 animate-in fade-in slide-in-from-top-2">
                      <input
                        autoFocus
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendComment()
                        }
                        placeholder={
                          activeCommentId.cid
                            ? `Replying to comment...`
                            : `Add a comment...`
                        }
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-sm focus:border-blue-500/50 outline-none shadow-inner"
                      />
                      <button
                        onClick={handleSendComment}
                        className="bg-blue-600 text-white font-black px-6 rounded-2xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setActiveCommentId(null)}
                        className="p-3 text-slate-600 hover:text-white"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialWall;
