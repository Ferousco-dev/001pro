import React from "react";
import { UserProfile } from "../types";

interface UserListModalProps {
  title: string;
  userAliases: string[];
  allProfiles: Record<string, UserProfile>;
  currentUserAlias: string;
  onClose: () => void;
  onAliasClick: (alias: string) => void;
  onFollow: (alias: string) => void;
  isDarkMode?: boolean;
}

const UserListModal: React.FC<UserListModalProps> = ({
  title,
  userAliases,
  allProfiles,
  currentUserAlias,
  onClose,
  onAliasClick,
  onFollow,
  isDarkMode = true,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${
          isDarkMode
            ? "bg-gray-900 border border-gray-800"
            : "bg-white border border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDarkMode ? "border-gray-800" : "border-gray-100"
          }`}
        >
          <h3
            className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2">
          {userAliases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="space-y-1">
              {userAliases.map((alias) => {
                const profile = allProfiles[alias] || { alias }; // Fallback if profile not found
                const isCurrentUser = alias === currentUserAlias;
                const isFollowing =
                  allProfiles[currentUserAlias]?.following?.includes(alias);

                return (
                  <div
                    key={alias}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onAliasClick(alias);
                        onClose();
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {profile.profile_image ? (
                          <img
                            src={profile.profile_image}
                            alt={alias}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold uppercase">
                            {alias[0]}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-semibold truncate ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {alias}
                          </span>
                          {profile.isVerified && (
                            <svg
                              className="w-4 h-4 text-blue-500 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          )}
                        </div>
                        {profile.full_name && (
                          <span className="text-xs text-gray-500 truncate">
                            {profile.full_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isCurrentUser && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollow(alias);
                        }}
                        className={`ml-3 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                          isFollowing
                            ? isDarkMode
                              ? "bg-gray-700 text-white hover:bg-gray-600"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserListModal;
