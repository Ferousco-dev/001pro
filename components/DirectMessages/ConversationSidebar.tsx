import React from "react";
import { UserProfile } from "../../types";
import { Conversation, DirectMessage } from "./types";
import { Icons } from "./Icons";

interface ConversationItemProps {
  conv: Conversation;
  currentUser: UserProfile;
  allProfiles: Record<string, UserProfile>;
  onlineUsers: Set<string>;
  activeConversation: string | null;
  setActiveConversation: (id: string | null) => void;
  setActiveUserId: (id: string | null) => void;
  loadMessages: (id: string) => void;
  isPinned: boolean;
  togglePinConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  isDarkMode: boolean;
  formatMessageTime: (date: string) => string;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conv,
  currentUser,
  allProfiles,
  onlineUsers,
  activeConversation,
  setActiveConversation,
  setActiveUserId,
  loadMessages,
  isPinned,
  togglePinConversation,
  deleteConversation,
  isDarkMode,
  formatMessageTime,
}) => {
  const otherUser =
    conv.user_one === currentUser.alias ? conv.user_two : conv.user_one;
  const profile = allProfiles[otherUser];
  if (!profile) return null;

  const isUserOnline = onlineUsers.has(otherUser);

  return (
    <div
      className={`group relative rounded-xl transition-all ${
        activeConversation === conv.id
          ? isDarkMode
            ? "bg-blue-500/20 border border-blue-500/30"
            : "bg-blue-50 border border-blue-200"
          : isDarkMode
            ? "hover:bg-neutral-800/50"
            : "hover:bg-white hover:shadow-sm"
      }`}
    >
      <button
        onClick={() => {
          setActiveConversation(conv.id);
          setActiveUserId(otherUser);
          loadMessages(conv.id);
        }}
        className="w-full flex items-center gap-3 p-3"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            {profile.alias[0].toUpperCase()}
          </div>
          {isUserOnline && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black" />
          )}
          {conv.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-bold text-white">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold truncate ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              @{profile.alias}
            </span>
            {isPinned && <Icons.Pin className="w-3 h-3 text-amber-500" />}
          </div>
          {conv.lastMessage && (
            <p
              className={`text-sm truncate ${
                conv.unreadCount > 0
                  ? isDarkMode
                    ? "text-white font-medium"
                    : "text-gray-900 font-medium"
                  : isDarkMode
                    ? "text-neutral-500"
                    : "text-gray-500"
              }`}
            >
              {conv.lastMessage.sender_alias === currentUser.alias
                ? "You: "
                : ""}
              {conv.lastMessage.content}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {conv.lastMessage && (
            <span
              className={`text-[10px] ${
                isDarkMode ? "text-neutral-500" : "text-gray-400"
              }`}
            >
              {formatMessageTime(conv.lastMessage.created_at)}
            </span>
          )}
        </div>
      </button>

      {/* Quick Actions on Hover */}
      <div
        className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePinConversation(conv.id);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isPinned
              ? "bg-amber-500/20 text-amber-500"
              : isDarkMode
                ? "bg-neutral-800 text-neutral-400 hover:text-white"
                : "bg-gray-100 text-gray-500 hover:text-gray-900"
          }`}
          title={isPinned ? "Unpin" : "Pin"}
        >
          <Icons.Pin className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? "bg-neutral-800 text-red-400 hover:bg-red-500/20"
              : "bg-gray-100 text-red-500 hover:bg-red-50"
          }`}
          title="Delete"
        >
          <Icons.Delete className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentUser: UserProfile;
  allProfiles: Record<string, UserProfile>;
  onlineUsers: Set<string>;
  activeConversation: string | null;
  setActiveConversation: (id: string | null) => void;
  setActiveUserId: (id: string | null) => void;
  loadMessages: (id: string) => void;
  pinnedConversations: Set<string>;
  togglePinConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  isDarkMode: boolean;
  conversationSearch: string;
  setConversationSearch: (val: string) => void;
  showNewChat: boolean;
  setShowNewChat: (val: boolean) => void;
  loading: boolean;
  formatMessageTime: (date: string) => string;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentUser,
  allProfiles,
  onlineUsers,
  activeConversation,
  setActiveConversation,
  setActiveUserId,
  loadMessages,
  pinnedConversations,
  togglePinConversation,
  deleteConversation,
  isDarkMode,
  conversationSearch,
  setConversationSearch,
  showNewChat,
  setShowNewChat,
  loading,
  formatMessageTime,
}) => {
  return (
    <div
      className={`${
        activeConversation ? "hidden lg:flex" : "flex"
      } flex-col w-full lg:w-96 border-r ${
        isDarkMode
          ? "border-white/[0.06] bg-neutral-950/50"
          : "border-black/[0.06] bg-gray-50/50"
      }`}
    >
      {/* New Chat & Search */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              showNewChat
                ? "bg-neutral-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            }`}
          >
            {showNewChat ? (
              <>
                <Icons.Close className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Icons.Plus className="w-4 h-4" />
                New Message
              </>
            )}
          </button>
        </div>

        {/* Search Conversations */}
        {!showNewChat && (
          <div className="relative">
            <Icons.Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? "text-neutral-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search conversations..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
                isDarkMode
                  ? "bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-800 focus:border-blue-500"
                  : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500"
              }`}
            />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span
                className={`text-xs ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}
              >
                Loading...
              </span>
            </div>
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                currentUser={currentUser}
                allProfiles={allProfiles}
                onlineUsers={onlineUsers}
                activeConversation={activeConversation}
                setActiveConversation={setActiveConversation}
                setActiveUserId={setActiveUserId}
                loadMessages={loadMessages}
                isPinned={pinnedConversations.has(conv.id)}
                togglePinConversation={togglePinConversation}
                deleteConversation={deleteConversation}
                isDarkMode={isDarkMode}
                formatMessageTime={formatMessageTime}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${
                isDarkMode ? "bg-neutral-900" : "bg-gray-100"
              }`}
            >
              <Icons.MessageCircle className="w-10 h-10 text-blue-500" />
            </div>
            <p
              className={`font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {conversationSearch
                ? "No conversations found"
                : "No messages yet"}
            </p>
            <p
              className={`text-sm mt-1 text-center ${
                isDarkMode ? "text-neutral-500" : "text-gray-500"
              }`}
            >
              {conversationSearch
                ? "Try a different search"
                : "Start a conversation to get started"}
            </p>
            {!conversationSearch && (
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-4 px-5 py-2 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                Start a Chat
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
