import React, { useMemo } from "react";
import { UserProfile } from "../../types";
import VerificationBadge from "../VerificationBadge";

// ===== SVG ICONS =====
const IconCrown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-5-6.5 5 2-7-5.5-4h7l3-7z" />
  </svg>
);

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h12v2c0 1-1 2-2 2h-1v3c0 1-.5 2-1.5 2.5V16h3v2H7v-2h3v-2.5C8.5 13 8 12 8 11V8H7c-1 0-2-1-2-2V4z" />
    <rect x="9" y="16" width="6" height="2" />
  </svg>
);

interface TopUsersSectionProps {
  profiles?: UserProfile[];
  isDarkMode: boolean;
  glassCardStyle: React.CSSProperties;
  onAliasClick: (alias: string) => void;
  onNavigate?: (view: any) => void;
}

export const TopUsersSection: React.FC<TopUsersSectionProps> = ({
  profiles = [],
  isDarkMode,
  glassCardStyle,
  onAliasClick,
  onNavigate,
}) => {
  // Get top 3 users by transmissions
  const topUsers = useMemo(() => {
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return [];
    }
    return [...profiles]
      .sort((a, b) => (b.totalTransmissions || 0) - (a.totalTransmissions || 0))
      .slice(0, 3);
  }, [profiles]);

  const getRingColor = (index: number) => {
    switch (index) {
      case 0:
        return "border-yellow-500";
      case 1:
        return "border-slate-300";
      case 2:
        return "border-orange-500";
      default:
        return "border-blue-500";
    }
  };

  // Don't render if no users
  if (topUsers.length === 0) {
    return null;
  }

  return (
    <div
      style={glassCardStyle}
      className="mr-2 ml-3 sm:mx-4 my-3 rounded-2xl p-3 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-sm font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Top Contributors
        </h3>
        <span className="text-[9px] uppercase font-bold text-gray-500">
          Weekly Rank
        </span>
      </div>

      {/* Users List - Horizontal (WhatsApp Status Style) */}
      <div className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {topUsers.map((user, index) => {
          const ringColor = getRingColor(index);
          return (
            <button
              key={user.alias}
              onClick={() => onAliasClick(user.alias)}
              className="flex flex-col items-center gap-1.5 group w-14 flex-shrink-0"
            >
              {/* Avatar with Ring */}
              <div
                className={`w-11 h-11 rounded-full p-[2px] border-[2px] ${ringColor} flex-shrink-0 relative transition-transform duration-200 group-hover:scale-105`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative z-10">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.alias}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white font-bold text-base">
                      {user.alias[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Rank Badge */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 z-20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-black ${
                    index === 0
                      ? "bg-yellow-500"
                      : index === 1
                        ? "bg-slate-400"
                        : "bg-orange-500"
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center w-full">
                <p
                  className={`font-semibold text-[10px] truncate w-full ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user.alias}
                </p>
                <p
                  className={`text-[9px] font-black ${
                    index === 0
                      ? "text-yellow-500"
                      : index === 1
                        ? "text-slate-400"
                        : "text-orange-500"
                  }`}
                >
                  {user.totalTransmissions || 0}
                </p>
              </div>
            </button>
          );
        })}

        {/* View All Circle Button */}
        <button
          onClick={() => onNavigate?.("VANGUARD")}
          className="flex flex-col items-center gap-1.5 w-14 group flex-shrink-0"
        >
          <div
            className={`w-11 h-11 rounded-full border border-dashed flex items-center justify-center transition-colors ${
              isDarkMode
                ? "border-gray-700 group-hover:border-gray-500 bg-gray-800/50"
                : "border-gray-300 group-hover:border-gray-400 bg-gray-100"
            }`}
          >
            <svg
              className={`w-4 h-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          <span
            className={`text-[9px] font-medium whitespace-nowrap ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            All
          </span>
        </button>
      </div>
    </div>
  );
};
