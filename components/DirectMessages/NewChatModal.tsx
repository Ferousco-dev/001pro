import React from "react";
import { UserProfile } from "../../types";
import { Icons } from "./Icons";

interface NewChatModalProps {
  showNewChat: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredProfiles: UserProfile[];
  onlineUsers: Set<string>;
  startConversation: (userId: string) => void;
  isDarkMode: boolean;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  showNewChat,
  searchQuery,
  setSearchQuery,
  filteredProfiles,
  onlineUsers,
  startConversation,
  isDarkMode,
}) => {
  if (!showNewChat) return null;

  return (
    <div className="space-y-3 animate-in slide-in-from-top duration-200">
      <div className="relative">
        <Icons.Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDarkMode ? "text-neutral-500" : "text-gray-400"
          }`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors ${
            isDarkMode
              ? "bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-800 focus:border-blue-500"
              : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500"
          }`}
          autoFocus
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => {
            const isUserOnline = onlineUsers.has(profile.alias);
            return (
              <button
                key={profile.alias}
                onClick={() => startConversation(profile.alias)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isDarkMode
                    ? "hover:bg-neutral-800"
                    : "hover:bg-white shadow-sm"
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                    {profile.alias[0].toUpperCase()}
                  </div>
                  {isUserOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className={`text-sm font-semibold truncate ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    @{profile.alias}
                  </div>
                  <div
                    className={`text-xs ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}
                  >
                    {isUserOnline ? (
                      <span className="text-emerald-500">Online</span>
                    ) : (
                      profile.role
                    )}
                  </div>
                </div>
                <Icons.ChevronRight
                  className={`w-4 h-4 ${isDarkMode ? "text-neutral-600" : "text-gray-400"}`}
                />
              </button>
            );
          })
        ) : (
          <div
            className={`text-center py-8 ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}
          >
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};
