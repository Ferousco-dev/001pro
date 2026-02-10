import React from "react";
import { UserProfile } from "../../types";
import { DirectMessage } from "./types";
import { Icons } from "./Icons";
import { MessageItem } from "./MessageItem";

interface ChatHeaderProps {
  activeProfile: UserProfile;
  isOnline: boolean;
  otherUserTyping: boolean;
  showUserInfo: boolean;
  setShowUserInfo: (val: boolean) => void;
  showMessageSearch: boolean;
  setShowMessageSearch: (val: boolean) => void;
  showConversationMenu: boolean;
  setShowConversationMenu: (val: boolean) => void;
  setActiveConversation: (val: string | null) => void;
  setActiveUserId: (val: string | null) => void;
  setReplyingTo: (msg: DirectMessage | null) => void;
  clearChat: () => void;
  isDarkMode: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeProfile,
  isOnline,
  otherUserTyping,
  showUserInfo,
  setShowUserInfo,
  showMessageSearch,
  setShowMessageSearch,
  showConversationMenu,
  setShowConversationMenu,
  setActiveConversation,
  setActiveUserId,
  setReplyingTo,
  clearChat,
  isDarkMode,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-3 sm:p-4 border-b shrink-0 ${
        isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setActiveConversation(null);
            setActiveUserId(null);
            setReplyingTo(null);
          }}
          className={`lg:hidden p-2 rounded-xl transition-colors ${
            isDarkMode ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]"
          }`}
        >
          <Icons.ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowUserInfo(!showUserInfo)}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
              {activeProfile.alias[0].toUpperCase()}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
            )}
          </div>
          <div className="text-left">
            <div
              className={`font-semibold group-hover:text-blue-500 transition-colors ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              @{activeProfile.alias}
            </div>
            <div
              className={`text-xs ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}
            >
              {otherUserTyping ? (
                <span className="text-blue-500 animate-pulse">typing...</span>
              ) : isOnline ? (
                <span className="text-emerald-500">Online</span>
              ) : (
                activeProfile.role
              )}
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowMessageSearch(!showMessageSearch)}
          className={`p-2 rounded-xl transition-colors ${
            showMessageSearch
              ? "bg-blue-500 text-white"
              : isDarkMode
                ? "hover:bg-white/[0.06] text-neutral-400"
                : "hover:bg-black/[0.04] text-gray-500"
          }`}
        >
          <Icons.Search className="w-5 h-5" />
        </button>

        <div className="relative conversation-menu">
          <button
            onClick={() => setShowConversationMenu(!showConversationMenu)}
            className={`p-2 rounded-xl transition-colors ${
              showConversationMenu
                ? isDarkMode
                  ? "bg-white/[0.06] text-white"
                  : "bg-black/[0.04] text-gray-900"
                : isDarkMode
                  ? "hover:bg-white/[0.06] text-neutral-400"
                  : "hover:bg-black/[0.04] text-gray-500"
            }`}
          >
            <Icons.DotsVertical className="w-5 h-5" />
          </button>

          {showConversationMenu && (
            <div
              className={`absolute right-0 top-12 w-48 rounded-xl shadow-lg animate-in slide-in-from-top duration-150 z-10 ${
                isDarkMode
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-gray-200 shadow-xl"
              }`}
            >
              <div className="py-2">
                <button
                  onClick={() => {
                    clearChat();
                    setShowConversationMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    isDarkMode
                      ? "text-red-400 hover:bg-red-500/20"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Icons.Trash className="w-4 h-4 inline mr-2" />
                  Clear Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChatWindowProps {
  messages: DirectMessage[];
  groupedMessages: Record<string, DirectMessage[]>;
  currentUser: UserProfile;
  activeProfile: UserProfile;
  isDarkMode: boolean;
  messageListRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  formatMessageContent: (content: string) => React.ReactNode;
  setReplyingTo: (msg: DirectMessage) => void;
  showReactions: string | null;
  setShowReactions: (id: string | null) => void;
  addReaction: (msgId: string, reactionId: string) => void;
  deleteMessage: (msgId: string, mode: "for_me" | "for_everyone") => void;
  editMessage?: (msgId: string, newContent: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  groupedMessages,
  currentUser,
  activeProfile,
  isDarkMode,
  messageListRef,
  messagesEndRef,
  formatMessageContent,
  setReplyingTo,
  showReactions,
  setShowReactions,
  addReaction,
  deleteMessage,
  editMessage,
}) => {
  return (
    <div
      ref={messageListRef}
      className={`flex-1 overflow-y-auto p-4 space-y-1 ${
        isDarkMode ? "bg-neutral-950" : "bg-gray-50"
      }`}
    >
      {(Object.entries(groupedMessages) as [string, DirectMessage[]][]).map(
        ([date, msgs]) => (
          <React.Fragment key={date}>
            {/* Date Separator */}
            <div className="flex items-center gap-3 py-4">
              <div
                className={`flex-1 h-px ${isDarkMode ? "bg-neutral-800" : "bg-gray-200"}`}
              />
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full ${
                  isDarkMode
                    ? "bg-neutral-900 text-neutral-500"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {date}
              </span>
              <div
                className={`flex-1 h-px ${isDarkMode ? "bg-neutral-800" : "bg-gray-200"}`}
              />
            </div>

            {/* Messages */}
            {msgs.map((msg, index) => {
              const isOwn = msg.sender_alias === currentUser.alias;
              const prevMsg = index > 0 ? msgs[index - 1] : null;
              const nextMsg = index < msgs.length - 1 ? msgs[index + 1] : null;

              const showAvatar =
                !isOwn &&
                (!prevMsg || prevMsg.sender_alias !== msg.sender_alias);
              const isLastInGroup =
                !nextMsg || nextMsg.sender_alias !== msg.sender_alias;
              const replyMessage = msg.reply_to
                ? messages.find((m) => m.id === msg.reply_to) || null
                : null;

              return (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  currentUser={currentUser}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  isLastInGroup={isLastInGroup}
                  replyMessage={replyMessage}
                  activeProfile={activeProfile}
                  isDarkMode={isDarkMode}
                  formatMessageContent={formatMessageContent}
                  setReplyingTo={setReplyingTo}
                  showReactions={showReactions}
                  setShowReactions={setShowReactions}
                  addReaction={addReaction}
                  deleteMessage={deleteMessage}
                  editMessage={editMessage}
                />
              );
            })}
          </React.Fragment>
        ),
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
