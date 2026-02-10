import React, { useState } from "react";
import { Channel, ChannelPost } from "../../types/statusChannelTypes";

interface ChannelCardProps {
  channel: Channel;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onClick: () => void;
  isDarkMode: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFollowing,
  onFollow,
  onUnfollow,
  onClick,
  isDarkMode,
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
        isDarkMode
          ? "bg-gray-900 border-gray-800 hover:border-blue-500"
          : "bg-gray-50 border-gray-200 hover:border-blue-500"
      }`}
    >
      <div onClick={onClick} className="mb-3">
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600">
          {channel.name[0].toUpperCase()}
        </div>
        <h3
          className={`font-bold text-center ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {channel.name}
        </h3>
        <p
          className={`text-xs text-center mt-1 ${
            isDarkMode ? "text-gray-500" : "text-gray-600"
          }`}
        >
          by @{channel.owner_alias}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          isFollowing ? onUnfollow() : onFollow();
        }}
        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
          isFollowing
            ? isDarkMode
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
};
