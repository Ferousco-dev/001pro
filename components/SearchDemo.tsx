import React, { useState } from "react";
import GlassmorphismSearchBar from "./GlassmorphismSearchBar";

const SearchDemo: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");

  const handleSearch = (query: string) => {
    setCurrentQuery(query);

    // Simulate search results
    if (query.trim()) {
      const mockResults = [
        `Results for "${query}"`,
        "Premium glassmorphism design",
        "Modern UI components",
        "High-end web development",
        "Professional search experience",
      ].filter((result) => result.toLowerCase().includes(query.toLowerCase()));

      setSearchResults(
        mockResults.length > 0
          ? mockResults
          : [`No results found for "${query}"`]
      );
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-black to-gray-900"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}
    >
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full transition-all duration-300 ${
            isDarkMode
              ? "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
              : "bg-black/10 backdrop-blur-sm text-black hover:bg-black/20"
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm12-8.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm15 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5h-2.25a.75.75 0 01-.75-.75zM6.364 5.636a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.06 1.061L5.303 6.697a.75.75 0 010-1.06zm10.606 10.606a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06l-1.591-1.591a.75.75 0 010-1.06zm0-14.242a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06l-1.591-1.591a.75.75 0 010-1.06zM5.303 16.303a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06L5.303 17.363a.75.75 0 010-1.06z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main Search Section */}
      <GlassmorphismSearchBar
        placeholder="Search for modern design inspiration..."
        onSearch={handleSearch}
        isDarkMode={isDarkMode}
      />

      {/* Results Section (only shown when there are results) */}
      {searchResults.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 pb-12">
          <div
            className={`rounded-2xl p-6 transition-all duration-500 ${
              isDarkMode
                ? "bg-white/5 backdrop-blur-sm border border-white/10"
                : "bg-black/5 backdrop-blur-sm border border-black/10"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Search Results for "{currentQuery}"
            </h3>
            <ul className="space-y-3">
              {searchResults.map((result, index) => (
                <li
                  key={index}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? "bg-white/5 hover:bg-white/10 text-gray-300"
                      : "bg-black/5 hover:bg-black/10 text-gray-700"
                  }`}
                >
                  {result}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDemo;
