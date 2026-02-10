import React, { useState, useEffect } from "react";
import { StatusComment } from "../../types/statusChannelTypes";
import { supabase } from "../../supabaseClient";
import { MessageCircleIcon, XIcon, SendIcon } from "./Icons";

interface StatusCommentsModalProps {
  statusId: string;
  comments: StatusComment[];
  currentUserAlias: string | null;
  isDarkMode: boolean;
  onClose: () => void;
  onCommentAdded: (comment: StatusComment) => void;
  onCommentDeleted: (commentId: string) => void;
}

export const StatusCommentsModal: React.FC<StatusCommentsModalProps> = ({
  statusId,
  comments,
  currentUserAlias,
  isDarkMode,
  onClose,
  onCommentAdded,
  onCommentDeleted,
}) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserAlias || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("status_comments")
        .insert({
          status_id: statusId,
          commenter_alias: currentUserAlias,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onCommentAdded({
          id: data.id,
          status_id: data.status_id,
          commenter_alias: data.commenter_alias,
          content: data.content,
          created_at: new Date(data.created_at),
        });
        setNewComment("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("status_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      onCommentDeleted(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <MessageCircleIcon
                size={24}
                className={isDarkMode ? "text-white" : "text-gray-900"}
              />{" "}
              {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
            </h3>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div
              className={`py-12 text-center ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <p>No replies yet</p>
              <p className="text-sm mt-1">Be the first to reply!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-800/50" : "bg-gray-50"
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {comment.commenter_alias[0].toUpperCase()}
                </div>

                {/* Comment content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p
                      className={`font-semibold text-sm ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      @{comment.commenter_alias}
                    </p>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {new Date(comment.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p
                    className={`mt-1 text-sm break-words ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {comment.content}
                  </p>

                  {/* Delete button for own comments */}
                  {currentUserAlias === comment.commenter_alias && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className={`mt-2 text-xs ${
                        isDarkMode
                          ? "text-red-400 hover:text-red-300"
                          : "text-red-600 hover:text-red-700"
                      }`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        {currentUserAlias && (
          <form
            onSubmit={handleSubmit}
            className={`p-4 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a reply..."
                className={`flex-1 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-gray-800 text-white placeholder-gray-500"
                    : "bg-gray-100 text-gray-900 placeholder-gray-400"
                }`}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  !newComment.trim() || isSubmitting
                    ? isDarkMode
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
