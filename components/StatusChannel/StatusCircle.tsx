import React from "react";
import { Status } from "../../types/statusChannelTypes";

interface StatusCircleProps {
  statuses: Status[];
  userAlias: string;
  currentUserAlias: string | null;
  onClick: () => void;
  isDarkMode: boolean;
}

export const StatusCircle: React.FC<StatusCircleProps> = ({
  statuses,
  userAlias,
  currentUserAlias,
  onClick,
  isDarkMode,
}) => {
  const radius = 38; // Radius of the ring
  const strokeWidth = 2.5; // Thickness of the ring
  const center = 40; // Center coordinate (half of 80px width)
  const circumference = 2 * Math.PI * radius;

  // Sort statuses by date (oldest to newest) to map segments correctly
  const sortedStatuses = [...statuses].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const numSegments = sortedStatuses.length;
  const gapLengthPx = numSegments > 1 ? 3 : 0;
  const segmentLength =
    (circumference - numSegments * gapLengthPx) / numSegments;

  // Check if all seen to determine if we show the full "gray" look or colorful
  const allSeen = sortedStatuses.every((s) =>
    s.views?.some((v) => v.viewer_alias === currentUserAlias),
  );

  // Interaction badge (sum of interactions on ALL statuses)
  const totalInteractions = statuses.reduce(
    (acc, s) => acc + (s.likeCount || 0) + (s.commentCount || 0),
    0,
  );

  return (
    <div className="relative flex flex-col items-center gap-1 group">
      <div
        className="relative w-24 h-24 flex items-center justify-center cursor-pointer transition-transform duration-200 group-hover:scale-105"
        onClick={onClick}
      >
        {/* SVG Ring container */}
        <svg
          width="90"
          height="90"
          viewBox="0 0 80 80"
          className="absolute inset-0 m-auto rotate-[-90deg]"
        >
          {/* Defs for gradient */}
          <defs>
            <linearGradient
              id="unseenGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {sortedStatuses.map((status, index) => {
            const isSeen = status.views?.some(
              (v) => v.viewer_alias === currentUserAlias,
            );
            const color = isSeen
              ? isDarkMode
                ? "#4b5563"
                : "#d1d5db"
              : "url(#unseenGradient)";

            return (
              <circle
                key={status.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-1 * (segmentLength + gapLengthPx) * index}
              />
            );
          })}
        </svg>

        {/* Profile Picture / Initials Center */}
        <div
          className={`relative w-[70px] h-[70px] rounded-full overflow-hidden flex items-center justify-center border-4 ${
            isDarkMode ? "border-black bg-gray-800" : "border-white bg-gray-200"
          }`}
        >
          <span
            className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {userAlias[0].toUpperCase()}
          </span>
        </div>

        {/* Interaction Badge */}
        {totalInteractions > 0 && (
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-md z-10">
            {totalInteractions > 99 ? "99+" : totalInteractions}
          </div>
        )}
      </div>

      <span
        className={`text-xs font-medium truncate max-w-[80px] ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        } ${!allSeen ? "font-bold" : ""}`}
      >
        {userAlias}
      </span>
    </div>
  );
};
