import React, { useState } from "react";

// Modern Glassmorphism Search Bar Component
// Standalone component with premium glassmorphism effects

interface GlassmorphismSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  isDarkMode?: boolean;
}

const GlassmorphismSearchBar: React.FC<GlassmorphismSearchBarProps> = ({
  placeholder = "Search for anything...",
  onSearch,
  className = "",
  isDarkMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${className}`}
    >
      {/* Standalone Search Bar Section */}
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          {/* Glassmorphism Container */}
          <div
            className={`relative overflow-hidden rounded-3xl transition-all duration-700 ease-out ${
              isFocused ? "scale-105" : "scale-100"
            }`}
            style={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)",
              backdropFilter: "blur(32px) saturate(200%)",
              WebkitBackdropFilter: "blur(32px) saturate(200%)",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: isDarkMode
                ? isFocused
                  ? "0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 12px 24px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                : isFocused
                ? "0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
                : "0 12px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            }}
          >
            {/* Subtle Inner Glow */}
            <div
              className={`absolute inset-0 rounded-3xl transition-opacity duration-700 ${
                isFocused ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(219, 39, 119, 0.04) 100%)"
                  : "linear-gradient(135deg, rgba(147, 51, 234, 0.06) 0%, rgba(219, 39, 119, 0.03) 100%)",
                boxShadow: isDarkMode
                  ? "inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              }}
            />

            {/* Search Input */}
            <div className="relative px-6 py-5">
              <div className="flex items-center gap-4">
                {/* Search Icon */}
                <div className="flex-shrink-0">
                  <svg
                    className={`w-6 h-6 transition-all duration-300 ${
                      isFocused
                        ? isDarkMode
                          ? "text-purple-400"
                          : "text-purple-600"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  className={`flex-1 text-lg font-medium transition-all duration-300 outline-none ${
                    isDarkMode
                      ? "text-white placeholder-gray-400"
                      : "text-gray-900 placeholder-gray-500"
                  } bg-transparent`}
                  style={{
                    fontSize: "18px",
                    lineHeight: "1.5",
                  }}
                />

                {/* Clear Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      if (onSearch) onSearch("");
                    }}
                    className={`flex-shrink-0 p-1 rounded-full transition-all duration-200 ${
                      isDarkMode
                        ? "hover:bg-white/10 text-gray-400 hover:text-white"
                        : "hover:bg-black/5 text-gray-500 hover:text-gray-700"
                    }`}
                    aria-label="Clear search"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Submit Button (optional, hidden but accessible) */}
                <button
                  type="submit"
                  className="sr-only"
                  aria-label="Submit search"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Animated Border Effect */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out ${
                isFocused ? "w-full" : "w-0"
              }`}
              style={{
                borderRadius: "0 0 12px 12px",
              }}
            />
          </div>

          {/* Subtle Background Pattern */}
          <div
            className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
            style={{
              background: isDarkMode
                ? "radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)"
                : "radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)",
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default GlassmorphismSearchBar;
