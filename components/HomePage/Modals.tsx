import React from "react";
import { SocialPost } from "../../types";

interface RepostModalProps {
  showRepostModal: string | null;
  setShowRepostModal: (postId: string | null) => void;
  repostQuote: string;
  setRepostQuote: (quote: string) => void;
  confirmRepost: (postId: string, isQuote?: boolean) => void;
  isDarkMode: boolean;
  glassModalStyle: React.CSSProperties;
}

export const RepostModal: React.FC<RepostModalProps> = ({
  showRepostModal,
  setShowRepostModal,
  repostQuote,
  setRepostQuote,
  confirmRepost,
  isDarkMode,
  glassModalStyle,
}) => {
  if (!showRepostModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowRepostModal(null)}
      />
      <div
        style={glassModalStyle}
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <h3 className="text-xl font-bold mb-4">Repost Transmission</h3>

        <textarea
          value={repostQuote}
          onChange={(e) => setRepostQuote(e.target.value)}
          placeholder="Add a comment... (optional)"
          className="w-full min-h-[120px] p-4 bg-white/5 rounded-2xl outline-none resize-none mb-6 text-white placeholder-white/40 border border-white/10"
        />

        <div className="flex gap-3">
          <button
            onClick={() => confirmRepost(showRepostModal, false)}
            className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
          >
            Repost
          </button>
          <button
            onClick={() => confirmRepost(showRepostModal, true)}
            className="flex-1 py-3 rounded-xl font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
          >
            Quote
          </button>
        </div>
      </div>
    </div>
  );
};

interface AnalyticsModalProps {
  showAnalyticsModal: string | null;
  setShowAnalyticsModal: (postId: string | null) => void;
  posts: SocialPost[];
  isDarkMode: boolean;
  glassModalStyle: React.CSSProperties;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  showAnalyticsModal,
  setShowAnalyticsModal,
  posts,
  isDarkMode,
  glassModalStyle,
}) => {
  const post = posts.find((p) => p.id === showAnalyticsModal);
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowAnalyticsModal(null)}
      />
      <div
        style={glassModalStyle}
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Post Analytics</h3>
          <button
            onClick={() => setShowAnalyticsModal(null)}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Views",
              value: post.views?.length || 0,
              icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
            },
            {
              label: "Likes",
              value: post.likes?.length || 0,
              icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
            },
            {
              label: "Comments",
              value: post.comments?.length || 0,
              icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
            },
            {
              label: "Reposts",
              value: post.repostCount || 0,
              icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <svg
                className="w-5 h-5 text-blue-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={stat.icon}
                />
              </svg>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
