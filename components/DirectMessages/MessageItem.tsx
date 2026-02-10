import React, { useState } from "react";
import { UserProfile } from "../../types";
import { DirectMessage } from "./types";
import { Icons, REACTIONS } from "./Icons";

interface MessageItemProps {
  msg: DirectMessage;
  currentUser: UserProfile;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
  replyMessage: DirectMessage | null;
  activeProfile: UserProfile;
  isDarkMode: boolean;
  formatMessageContent: (content: string) => React.ReactNode;
  setReplyingTo: (msg: DirectMessage) => void;
  showReactions: string | null;
  setShowReactions: (id: string | null) => void;
  addReaction: (msgId: string, reactionId: string) => void;
  deleteMessage: (msgId: string, mode: "for_me" | "for_everyone") => void;
  editMessage?: (msgId: string, newContent: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  currentUser,
  isOwn,
  showAvatar,
  isLastInGroup,
  replyMessage,
  activeProfile,
  isDarkMode,
  formatMessageContent,
  setReplyingTo,
  showReactions,
  setShowReactions,
  addReaction,
  deleteMessage,
  editMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  const messageType = msg.message_type || "text";
  const isImage =
    messageType === "image" ||
    (msg.content?.startsWith("http") &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content));
  const isVideo =
    messageType === "video" ||
    (msg.content?.startsWith("http") && /\.(mp4|webm|mov)$/i.test(msg.content));

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== msg.content && editMessage) {
      editMessage(msg.id, editText.trim());
    }
    setIsEditing(false);
  };

  // Render message content based on type
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            autoFocus
            className={`w-full px-3 py-1.5 rounded-lg text-sm outline-none ${
              isDarkMode
                ? "bg-neutral-700 text-white border border-neutral-600 focus:border-blue-500"
                : "bg-gray-50 text-gray-900 border border-gray-300 focus:border-blue-500"
            }`}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className={`text-[10px] px-2 py-1 rounded ${
                isDarkMode
                  ? "text-neutral-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="text-[10px] px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div>
          <img
            src={msg.content}
            alt="Shared image"
            onClick={() => setImageExpanded(true)}
            className="max-w-[260px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
          {imageExpanded && (
            <div
              className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setImageExpanded(false)}
            >
              <img
                src={msg.content}
                alt="Expanded image"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
              <button
                onClick={() => setImageExpanded(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          src={msg.content}
          controls
          className="max-w-[260px] max-h-[200px] rounded-xl"
          preload="metadata"
        />
      );
    }

    return (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap word-break-break-word overflow-wrap-anywhere">
        {formatMessageContent(msg.content)}
      </p>
    );
  };

  return (
    <div
      className={`flex group ${isOwn ? "justify-end" : "justify-start"} ${
        !isLastInGroup ? "mb-0.5" : "mb-3"
      }`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 mr-2 flex-shrink-0">
          {showAvatar && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {activeProfile.alias[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div
        className={`flex flex-col ${
          isOwn ? "items-end" : "items-start"
        } max-w-[85%] sm:max-w-[75%]`}
      >
        {/* Reply Preview */}
        {replyMessage && (
          <div
            className={`text-xs px-3 py-1.5 rounded-lg mb-1 ${
              isDarkMode
                ? "bg-neutral-800/50 text-neutral-400"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span className="font-medium">
              {replyMessage.sender_alias === currentUser.alias
                ? "You"
                : `@${replyMessage.sender_alias}`}
            </span>
            : {replyMessage.content.slice(0, 50)}...
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2.5 ${
            isOwn
              ? `bg-blue-500 text-white ${
                  isLastInGroup ? "rounded-2xl rounded-br-md" : "rounded-2xl"
                }`
              : `${
                  isDarkMode ? "bg-neutral-800" : "bg-white shadow-sm"
                } ${isDarkMode ? "text-white" : "text-gray-900"} ${
                  isLastInGroup ? "rounded-2xl rounded-bl-md" : "rounded-2xl"
                }`
          }`}
        >
          {renderContent()}

          {/* Edited label */}
          {msg.is_edited && !isEditing && (
            <span
              className={`text-[9px] italic mt-0.5 block ${
                isOwn
                  ? "text-white/50"
                  : isDarkMode
                    ? "text-neutral-500"
                    : "text-gray-400"
              }`}
            >
              edited
            </span>
          )}

          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div
              className={`flex gap-1 mt-1.5 ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {msg.reactions.map((reactionId, i) => {
                const reactionObj = REACTIONS.find((r) => r.id === reactionId);
                const ReactionIcon = reactionObj?.icon;
                return ReactionIcon ? (
                  <div
                    key={i}
                    className={`p-1 rounded ${
                      isDarkMode ? "bg-neutral-700/50" : "bg-gray-100"
                    }`}
                  >
                    <ReactionIcon className="w-3 h-3" />
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Message Actions on Hover */}
          <div
            className={`absolute ${
              isOwn ? "-left-24" : "-right-24"
            } top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}
          >
            <button
              onClick={() => setReplyingTo(msg)}
              className={`p-1.5 rounded-lg ${
                isDarkMode
                  ? "bg-neutral-800 text-neutral-400 hover:text-white"
                  : "bg-gray-100 text-gray-500 hover:text-gray-900"
              }`}
              title="Reply"
            >
              <Icons.Reply className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                setShowReactions(showReactions === msg.id ? null : msg.id)
              }
              className={`p-1.5 rounded-lg ${
                isDarkMode
                  ? "bg-neutral-800 text-neutral-400 hover:text-white"
                  : "bg-gray-100 text-gray-500 hover:text-gray-900"
              }`}
              title="React"
            >
              <Icons.Smile className="w-3.5 h-3.5" />
            </button>
            {/* Edit button - only for own text messages */}
            {isOwn && messageType === "text" && editMessage && (
              <button
                onClick={() => {
                  setEditText(msg.content);
                  setIsEditing(true);
                }}
                className={`p-1.5 rounded-lg ${
                  isDarkMode
                    ? "bg-neutral-800 text-neutral-400 hover:text-white"
                    : "bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
                title="Edit"
              >
                <svg
                  className="w-3.5 h-3.5"
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
            )}
            {/* Delete button with menu */}
            <div className="relative">
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className={`p-1.5 rounded-lg ${
                  isDarkMode
                    ? "bg-neutral-800 text-red-400 hover:bg-red-500/20"
                    : "bg-gray-100 text-red-500 hover:bg-red-50"
                }`}
                title="Delete"
              >
                <Icons.Delete className="w-3.5 h-3.5" />
              </button>
              {showDeleteMenu && (
                <div
                  className={`absolute ${isOwn ? "right-0" : "left-0"} top-full mt-1 w-44 rounded-xl shadow-xl z-30 overflow-hidden ${
                    isDarkMode
                      ? "bg-neutral-800 border border-neutral-700"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => {
                      deleteMessage(msg.id, "for_me");
                      setShowDeleteMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                      isDarkMode
                        ? "text-neutral-300 hover:bg-neutral-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    🗑 Delete for me
                  </button>
                  {isOwn && (
                    <button
                      onClick={() => {
                        deleteMessage(msg.id, "for_everyone");
                        setShowDeleteMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                        isDarkMode
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                    >
                      🗑 Delete for everyone
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reactions Picker */}
          {showReactions === msg.id && (
            <div
              className={`absolute ${
                isOwn ? "right-0" : "left-0"
              } -top-12 flex gap-1 p-2 rounded-xl shadow-lg animate-in zoom-in duration-150 z-20 ${
                isDarkMode
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-gray-200 shadow-xl"
              }`}
            >
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.id}
                  onClick={() => addReaction(msg.id, reaction.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                    isDarkMode ? "hover:bg-neutral-700" : "hover:bg-gray-100"
                  }`}
                >
                  <reaction.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time & Read Status */}
        {isLastInGroup && (
          <div
            className={`flex items-center gap-1.5 mt-1 px-1 ${
              isOwn ? "flex-row-reverse" : ""
            }`}
          >
            <span
              className={`text-[10px] ${
                isDarkMode ? "text-neutral-600" : "text-gray-400"
              }`}
            >
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isOwn && (
              <span
                className={`text-[10px] ${
                  msg.is_read
                    ? "text-blue-400"
                    : msg.status === "error"
                      ? "text-red-500"
                      : isDarkMode
                        ? "text-neutral-600"
                        : "text-gray-400"
                }`}
              >
                {msg.status === "error"
                  ? "!"
                  : msg.status === "sending"
                    ? "✓"
                    : "✓✓"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
