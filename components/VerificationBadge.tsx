import React from "react";

interface VerificationBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "blue" | "gold" | "gray";
}

/**
 * Twitter/X-Style Verified Badge
 * Authentic rosette/starburst design with white checkmark
 */
const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  size = "md",
  className = "",
  variant = "blue",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const variantColors = {
    blue: "#1D9BF0", // Twitter Blue
    gold: "#E2B719", // Twitter Gold (for organizations)
    gray: "#829AAB", // Twitter Gray (for government)
  };

  const variantLabels = {
    blue: "Verified account",
    gold: "Verified organization",
    gray: "Government or multilateral organization",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center align-middle group ${sizeClasses[size]} ${className}`}
      aria-label={variantLabels[variant]}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Twitter/X authentic verified badge - rosette shape with checkmark */}
        <path
          fill={variantColors[variant]}
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        />
        {/* White checkmark */}
        <path
          fill="#FFFFFF"
          d="M9.5 16.5l-4-4 1.41-1.41L9.5 13.67l7.59-7.59L18.5 7.5l-9 9z"
        />
      </svg>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {variantLabels[variant]}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default VerificationBadge;
