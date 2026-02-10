import React from "react";
import { Comment, UserProfile } from "../../types";
import { IconHeart, IconTrash } from "./Icons";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  user: UserProfile;
  isDarkMode: boolean;
  onLikeComment: (postId: string, commentId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  user,
  isDarkMode,
  onLikeComment,
  onDeleteComment,
  isReply = false,
}) => {
  return (
    <div
      className={`${
        isReply ? "ml-4 mt-2 border-l border-gray-800 pl-2" : "mt-2"
      }`}
    >
      <div className="flex gap-1.5">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0">
          ?
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-bold text-[10px] text-purple-400">
              Anonymous
            </span>
            <span
              className={`text-[9px] ${
                isDarkMode ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {new Date(comment.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onLikeComment(postId, comment.id)}
              className={`flex items-center gap-1 text-[9px] transition-colors ${
                user && comment.likes.includes(user.alias)
                  ? "text-red-500"
                  : `${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    } hover:text-red-500`
              }`}
            >
              <IconHeart
                filled={user ? comment.likes.includes(user.alias) : false}
              />
              {comment.likes.length > 0 && <span>{comment.likes.length}</span>}
            </button>

            {onDeleteComment && (
              <button
                onClick={() => onDeleteComment(postId, comment.id)}
                className={`text-[9px] transition-colors ${
                  isDarkMode
                    ? "text-gray-600 hover:text-red-500"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <IconTrash />
              </button>
            )}
          </div>

          {comment.replies &&
            comment.replies.length > 0 &&
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                user={user}
                isDarkMode={isDarkMode}
                onLikeComment={onLikeComment}
                onDeleteComment={onDeleteComment}
                isReply={true}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

interface CommentsSectionProps {
  comments: Comment[];
  postId: string;
  user: UserProfile;
  isDarkMode: boolean;
  onLikeComment: (postId: string, commentId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  postId,
  user,
  isDarkMode,
  onLikeComment,
  onDeleteComment,
}) => {
  return (
    <>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          user={user}
          isDarkMode={isDarkMode}
          onLikeComment={onLikeComment}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </>
  );
};
