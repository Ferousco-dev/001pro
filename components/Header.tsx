import React, { useState, useEffect, useRef, useCallback } from "react";
import { UserProfile } from "../types";
import VerificationBadge from "./VerificationBadge";

type ViewType =
  | "CHAT"
  | "ANONYMOUS"
  | "ADMIN"
  | "HOME"
  | "ABOUT"
  | "DONATE"
  | "PROFILE"
  | "VANGUARD"
  | "GROUPS"
  | "STATUS_CHANNEL"
  | "POST"
  | "AUTH"
  | "SEARCH"
  | "FEEDBACK";

interface HeaderProps {
  user: UserProfile;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  totalMessages: number;
  onLogout: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenDMs?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onSetTheme?: (mode: "dark" | "light") => void;
  onSilentRefresh?: (view: ViewType) => Promise<void>;
  onOpenAnonymousPost?: () => void;
  onSearch?: (query: string) => void;
}

// SVG Icons
const IconHome = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="28"
    height="28"
  >
    <path d="M3 12l9-9 9 9v9a3 3 0 0 1-3 3h-3v-6h-6v6H6a3 3 0 0 1-3-3v-9z" />
  </svg>
);

const IconGroups = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="28"
    height="28"
  >
    <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-8 0c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const IconAnonymous = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="28"
    height="28"
  >
    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8.008 8.008 0 0 1 8-8 8.008 8.008 0 0 1 8 8 8 8 0 0 1-8 8zm-1-7h2v2h-2zm0-6h2v4h-2z" />
  </svg>
);

const IconStories = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="28"
    height="28"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2a10 10 0 0 0-10 10h2a8 8 0 1 1 16 0h2a10 10 0 0 0-10-10z" />
  </svg>
);

const IconSearch = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    width="24"
    height="24"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
  </svg>
);

const IconBell = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    width="24"
    height="24"
  >
    <path
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconMail = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    width="24"
    height="24"
  >
    <path
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 7a2 2 0 100-4 2 2 0 000 4zM12 14a2 2 0 100-4 2 2 0 000 4zM12 21a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const IconClose = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width="24"
    height="24"
  >
    <path
      d="M6 18L18 6M6 6l12 12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width="24"
    height="24"
  >
    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrowLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width="24"
    height="24"
  >
    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSettings = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    width="24"
    height="24"
  >
    <path
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
    <path
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm12-8.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm15 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5h-2.25a.75.75 0 01-.75-.75zM6.364 5.636a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.06 1.061L5.303 6.697a.75.75 0 010-1.06zm10.606 10.606a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06l-1.591-1.591a.75.75 0 010-1.06zm0-14.242a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06l-1.591-1.591a.75.75 0 010-1.06zM5.303 16.303a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06L5.303 17.363a.75.75 0 010-1.06z" />
  </svg>
);

const Header: React.FC<HeaderProps> = ({
  user,
  currentView,
  onViewChange,
  totalMessages,
  onLogout,
  notificationCount = 0,
  onOpenNotifications,
  onOpenDMs,
  isDarkMode = true,
  onToggleTheme,
  onSetTheme,
  onSilentRefresh,
  onOpenAnonymousPost,
  onSearch,
}) => {
  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "settings">("main");

  // Scroll behavior for bottom nav
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRAF = useRef<number | null>(null);

  // Pull-to-go-back gesture
  const touchStartY = useRef(0);
  const [pullDownDistance, setPullDownDistance] = useState(0);

  // Silent refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingTab, setRefreshingTab] = useState<ViewType | null>(null);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery("");
      if (onSearch) onSearch("");
    }
  };

  // Page title mapping
  const pageNames: Record<ViewType, string> = {
    HOME: "Home",
    GROUPS: "Groups",
    ANONYMOUS: "Anonymous",
    CHAT: "Messages",
    PROFILE: "Profile",
    VANGUARD: "Rankings",
    ABOUT: "About",
    DONATE: "Support Us",
    ADMIN: "Admin Panel",
    STATUS_CHANNEL: "Stories",
    POST: "Post",
    AUTH: "Sign In",
    SEARCH: "Search",
    FEEDBACK: "Feedback",
  };

  // Glass effect styles
  const glassStyle: React.CSSProperties = {
    background: isDarkMode ? "rgba(12,12,14,0.62)" : "rgba(255,255,255,0.68)",
    WebkitBackdropFilter: "saturate(180%) blur(18px)",
    backdropFilter: "saturate(180%) blur(18px)",
    paddingTop: "env(safe-area-inset-top)",
  };

  const sheetStyle: React.CSSProperties = {
    background: isDarkMode ? "rgba(10,10,12,0.94)" : "rgba(255,255,255,0.96)",
    WebkitBackdropFilter: "saturate(180%) blur(24px)",
    backdropFilter: "saturate(180%) blur(24px)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
  };

  const bottomNavGlassStyle: React.CSSProperties = {
    background: isDarkMode ? "rgba(12,12,14,0.85)" : "rgba(255,255,255,0.85)",
    WebkitBackdropFilter: "saturate(180%) blur(18px)",
    backdropFilter: "saturate(180%) blur(18px)",
    paddingBottom: "env(safe-area-inset-bottom)",
  };

  // Reset menu when view changes
  useEffect(() => {
    setShowMenu(false);
  }, [currentView]);

  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMenu]);

  // Bottom nav auto-hide on scroll
  useEffect(() => {
    // Correctly detect scroll container
    const getScrollY = () =>
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      window.scrollY ||
      document.querySelector("main")?.scrollTop ||
      0;

    // Initialize with current scroll
    lastScrollY.current = getScrollY();

    const onScroll = () => {
      if (scrollRAF.current) return;
      scrollRAF.current = requestAnimationFrame(() => {
        const y = getScrollY();
        const delta = y - lastScrollY.current;

        // Apple-style logic:
        // 1. Always show at the top
        // 2. Hide on scroll down (significant delta)
        // 3. Show on any scroll up (even slight)
        if (y <= 10) {
          setIsBottomNavVisible(true);
        } else if (delta > 8) {
          setIsBottomNavVisible(false);
        } else if (delta < -3) {
          setIsBottomNavVisible(true);
        }

        lastScrollY.current = y;
        scrollRAF.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Also listen on body and document for maximum compatibility
    document.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll);
      if (scrollRAF.current) cancelAnimationFrame(scrollRAF.current);
    };
  }, []);

  // Pull-to-go-back gesture handler
  useEffect(() => {
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const mainElement = document.querySelector("main");
      const isAtTop = mainElement
        ? mainElement.scrollTop === 0
        : window.scrollY === 0;

      if (isAtTop) {
        touchStartY.current = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const mainElement = document.querySelector("main");
      const isAtTop = mainElement
        ? mainElement.scrollTop === 0
        : window.scrollY === 0;

      if (!isAtTop) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY.current;
      const deltaX = currentX - touchStartX;

      if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (e.cancelable) {
          e.preventDefault();
        }
        setPullDownDistance(Math.min(deltaY, 150));
      }
    };

    const handleTouchEnd = () => {
      if (pullDownDistance > 80) {
        window.history.back();
      }
      setPullDownDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDownDistance]);

  // Tab click handler
  const handleTabClick = useCallback(
    async (tabId: ViewType) => {
      if (refreshingTab === tabId) return;

      setRefreshingTab(tabId);
      setIsRefreshing(true);

      onViewChange(tabId);

      window.dispatchEvent(
        new CustomEvent("silentRefresh", {
          detail: { view: tabId, timestamp: Date.now() },
        }),
      );

      // Dispatch specific refresh events based on the tab being clicked
      switch (tabId) {
        case "HOME":
          window.dispatchEvent(new CustomEvent("refreshPosts"));
          break;
        case "CHAT":
          window.dispatchEvent(new CustomEvent("refreshMessages"));
          break;
        case "GROUPS":
          window.dispatchEvent(new CustomEvent("refreshGroups"));
          break;
        // Other tabs don't need specific refresh events
      }

      try {
        if (onSilentRefresh) {
          await onSilentRefresh(tabId);
        }
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        console.error("Silent refresh failed:", e);
      } finally {
        setIsRefreshing(false);
        setRefreshingTab(null);
      }
    },
    [onViewChange, onSilentRefresh, refreshingTab],
  );

  // Menu item click handler
  const handleMenuItemClick = useCallback(
    async (itemId: ViewType) => {
      setRefreshingTab(itemId);
      setIsRefreshing(true);
      onViewChange(itemId);
      setShowMenu(false);

      window.dispatchEvent(
        new CustomEvent("silentRefresh", {
          detail: { view: itemId, timestamp: Date.now() },
        }),
      );

      try {
        if (onSilentRefresh) {
          await onSilentRefresh(itemId);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Silent refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setRefreshingTab(null);
      }
    },
    [onViewChange, onSilentRefresh],
  );

  // Main navigation tabs for bottom bar
  const mainTabs = [
    {
      id: "HOME" as ViewType,
      label: "Home",
      component: <IconHome />,
    },
    {
      id: "GROUPS" as ViewType,
      label: "Groups",
      component: <IconGroups />,
    },
    {
      id: "ANONYMOUS" as ViewType,
      label: "Anon",
      component: <IconAnonymous />,
    },
    {
      id: "STATUS_CHANNEL" as ViewType,
      label: "Stories",
      component: <IconStories />,
    },
  ];

  const menuItems = [
    {
      id: "PROFILE" as ViewType,
      label: "My Profile",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="w-5 h-5"
        >
          <path
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      description: "View and edit your profile",
    },
    {
      id: "VANGUARD" as ViewType,
      label: "Rankings",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="w-5 h-5"
        >
          <path
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      description: "Leaderboard & achievements",
    },
    {
      id: "ABOUT" as ViewType,
      label: "About",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="w-5 h-5"
        >
          <path
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      description: "Learn about AnonPro",
    },
    {
      id: "DONATE" as ViewType,
      label: "Support Us",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      description: "Help keep AnonPro running",
    },
    {
      id: "FEEDBACK" as ViewType,
      label: "Feedback",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="w-5 h-5"
        >
          <path
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      description: "Report bugs & suggestions",
    },
  ];

  if (user && user.role === "ADMIN") {
    menuItems.push({
      id: "ADMIN" as ViewType,
      label: "Admin Panel",
      icon: <IconSettings />,
      description: "Manage the platform",
    });
  }

  // Guest header for /anonymous route
  const isGuestAnonymous =
    currentView === "ANONYMOUS" && (!user || !user.alias);

  return (
    <>
      {/* Skip to content */}
      <button
        className="skip-link"
        onClick={() => {
          const main = document.querySelector("main");
          if (main) {
            (main as HTMLElement).focus?.();
            (main as HTMLElement).scrollTo?.({ top: 0, behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      >
        Skip to content
      </button>

      {/* Top Header */}
      <header
        style={glassStyle}
        className={[
          "fixed inset-x-0 top-0 z-40 w-full",
          "border-b",
          isDarkMode ? "border-white/10" : "border-black/10",
          "transform-gpu transition-all duration-300",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          {isSearching ? (
            <div className="flex-1 flex items-center gap-2 mr-2">
              <button
                onClick={toggleSearch}
                className={isDarkMode ? "text-neutral-400" : "text-gray-500"}
              >
                <IconArrowLeft />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search usernames, posts..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={[
                  "w-full bg-transparent outline-none font-medium text-sm sm:text-base",
                  isDarkMode
                    ? "text-white placeholder-white/30"
                    : "text-gray-900 placeholder-black/30",
                ].join(" ")}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    if (onSearch) onSearch("");
                  }}
                  className={isDarkMode ? "text-neutral-400" : "text-gray-500"}
                >
                  <IconClose />
                </button>
              )}
            </div>
          ) : (
            <h1
              className={[
                "font-extrabold tracking-tight text-base sm:text-2xl",
                isDarkMode ? "text-white" : "text-gray-900",
              ].join(" ")}
            >
              {pageNames[currentView]}
            </h1>
          )}

          {/* Guest mode for /anonymous: show Login/Sign Up, hide all user controls */}
          {isGuestAnonymous ? (
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm transition"
                onClick={() => onViewChange("AUTH" as any)}
              >
                Login
              </button>
              <button
                className="px-3 py-1.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 shadow-sm transition"
                onClick={() => onViewChange("AUTH" as any)}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Search button */}
              {!isGuestAnonymous && !isSearching && (
                <button
                  onClick={toggleSearch}
                  className={[
                    "icon-btn",
                    isDarkMode
                      ? "text-neutral-300 hover:text-white hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-black/5",
                  ].join(" ")}
                >
                  <IconSearch />
                </button>
              )}
              {/* Notifications */}
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  aria-label={`Notifications ${
                    notificationCount > 0 ? `(${notificationCount})` : ""
                  }`}
                  className={[
                    "icon-btn relative",
                    isDarkMode
                      ? "text-neutral-300 hover:text-white hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-black/5",
                  ].join(" ")}
                >
                  <IconBell />
                  {notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                      <span className="text-[9px] font-bold text-white">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    </div>
                  )}
                </button>
              )}

              {/* Messages */}
              {onOpenDMs && (
                <button
                  onClick={onOpenDMs}
                  aria-label={`Messages ${
                    totalMessages > 0 ? `(${totalMessages})` : ""
                  }`}
                  className={[
                    "icon-btn relative",
                    isDarkMode
                      ? "text-neutral-300 hover:text-white hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-black/5",
                  ].join(" ")}
                >
                  <IconMail />
                  {totalMessages > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <span className="text-[9px] font-bold text-white">
                        {totalMessages > 99 ? "99+" : totalMessages}
                      </span>
                    </div>
                  )}
                </button>
              )}

              {/* Menu button */}
              <button
                onClick={() => {
                  setShowMenu((v) => !v);
                  setMenuView("main");
                }}
                aria-haspopup="dialog"
                aria-expanded={showMenu}
                aria-label="Open menu"
                className={[
                  "icon-btn",
                  isDarkMode
                    ? "text-neutral-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-black/5",
                ].join(" ")}
              >
                <IconMenu />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* REMOVED: Spacer for fixed header - no longer needed! */}

      {/* Pull-to-go-back indicator */}
      {pullDownDistance > 0 && (
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{
            opacity: Math.min(pullDownDistance / 80, 1),
          }}
        >
          <div className="flex flex-col items-center gap-2 mt-2">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            <span className="text-xs font-medium text-blue-500">
              {pullDownDistance > 80 ? "Release to go back" : "Pull to go back"}
            </span>
          </div>
        </div>
      )}

      {/* Apple-Style Floating Bottom Navigation Bar */}
      {!isGuestAnonymous && (
        <nav
          className={[
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
            "flex justify-around items-center",
            "w-[92%] max-w-[480px] py-1.5 px-2",
            isDarkMode ? "bg-zinc-900/60" : "bg-white/80",
            "backdrop-blur-[20px] rounded-[40px]",
            "border border-white/10",
            "shadow-2xl shadow-black/20",
            "transform-gpu transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
            isBottomNavVisible
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-32 opacity-0 scale-90 pointer-events-none",
          ].join(" ")}
        >
          <div className="flex items-center justify-around w-full relative">
            {mainTabs.map((tab) => {
              const isActive = currentView === tab.id;
              const isTabRefreshing = refreshingTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as any)}
                  disabled={isTabRefreshing}
                  aria-label={`${tab.label} tab`}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5",
                    "transition-all duration-300 ease-in-out cursor-pointer",
                    isActive
                      ? "text-white"
                      : "text-neutral-400 hover:text-neutral-200",
                    "active:scale-90 relative",
                  ].join(" ")}
                >
                  {/* Icon with scale animation */}
                  <div
                    className={[
                      "transition-all duration-300",
                      isActive
                        ? "scale-110 brightness-110"
                        : "scale-100 opacity-60",
                    ].join(" ")}
                  >
                    {tab.component}
                  </div>

                  {/* Label that appears under active icon */}
                  <span
                    className={[
                      "text-[10px] sm:text-[11px] font-bold transition-all duration-300",
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-1 pointer-events-none",
                    ].join(" ")}
                  >
                    {tab.label}
                  </span>

                  {isTabRefreshing && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 rounded-full border border-blue-500 border-t-transparent animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Bottom spacer - adjusted for larger nav */}
      {!isGuestAnonymous && <div className="h-14 sm:h-16" />}

      {/* Bottom-sheet Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            aria-label="Close menu"
            onClick={() => setShowMenu(false)}
            className="absolute inset-0 bg-black/50"
          />

          {/* Sheet */}
          <div
            className={[
              "absolute left-0 right-0 bottom-0 max-h-[90vh] overflow-y-auto",
              "rounded-t-2xl sm:rounded-t-3xl shadow-2xl",
              "transition-transform duration-300 ease-out translate-y-0",
            ].join(" ")}
            style={sheetStyle}
          >
            {/* Grabber */}
            <div className="pt-2 grid place-items-center sticky top-0 z-10">
              <div className="w-12 h-1.5 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div
              className={[
                "flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b",
                isDarkMode ? "border-white/10" : "border-black/10",
              ].join(" ")}
            >
              <div>
                <h2
                  className={[
                    "text-lg sm:text-2xl font-bold tracking-tight",
                    isDarkMode ? "text-white" : "text-gray-900",
                  ].join(" ")}
                >
                  {menuView === "main" ? "Menu" : "Settings"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {user && (
                    <>
                      <p
                        className={[
                          "text-xs font-medium uppercase tracking-widest",
                          isDarkMode ? "text-neutral-500" : "text-gray-500",
                        ].join(" ")}
                      >
                        @{user.alias}
                      </p>
                      {user.is_verified && <VerificationBadge size="sm" />}
                      {user.is_admin && (
                        <span className="text-[10px]" title="Admin">
                          👑
                        </span>
                      )}
                      {user.is_banned && (
                        <span className="bg-red-500 text-white text-[8px] px-1 rounded font-bold">
                          BANNED
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className={[
                  "icon-btn",
                  isDarkMode
                    ? "text-neutral-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-black/5",
                  "rounded-xl sm:rounded-2xl w-10 h-10 sm:w-11 sm:h-11",
                ].join(" ")}
                aria-label="Close menu"
              >
                <IconClose />
              </button>
            </div>

            {/* User card */}
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-white/10">
              <div
                className={[
                  "flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl p-3 sm:p-4",
                  isDarkMode
                    ? "bg-white/5 ring-1 ring-white/10"
                    : "bg-black/5 ring-1 ring-black/10",
                ].join(" ")}
              >
                {user &&
                  (user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.alias}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl object-cover shadow-lg shadow-black/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 grid place-items-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-blue-500/20 flex-shrink-0">
                      {user.alias[0].toUpperCase()}
                    </div>
                  ))}
                <div className="flex-1 min-w-0">
                  {user && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="truncate">@{user.alias}</span>
                        {user.is_verified && <VerificationBadge size="sm" />}
                        {user.is_admin && (
                          <span className="text-xs" title="Admin">
                            👑
                          </span>
                        )}
                      </div>
                      <div
                        className={[
                          "text-xs font-medium uppercase tracking-widest flex items-center gap-2",
                          isDarkMode ? "text-neutral-500" : "text-gray-600",
                        ].join(" ")}
                      >
                        <span>{user.role}</span>
                        {user.is_banned && (
                          <span className="bg-red-500/20 text-red-500 text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-tighter">
                            BANNED
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-xl font-bold text-blue-500">
                    {user.totalTransmissions || 0}
                  </div>
                  <div
                    className={[
                      "text-[9px] sm:text-[10px] font-medium uppercase",
                      isDarkMode ? "text-neutral-500" : "text-gray-500",
                    ].join(" ")}
                  >
                    Posts
                  </div>
                </div>
              </div>
            </div>

            {/* Menu content */}
            <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-2 sm:space-y-3">
              {menuView === "main" ? (
                <>
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.id)}
                      className={[
                        "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-2xl text-left",
                        "transition-colors active:scale-95",
                        isDarkMode
                          ? "hover:bg-white/10 bg-white/5 ring-1 ring-white/10"
                          : "hover:bg-black/5 bg-black/5 ring-1 ring-black/10",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl grid place-items-center flex-shrink-0",
                          isDarkMode ? "bg-white/10" : "bg-black/10",
                        ].join(" ")}
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6">{item.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={[
                            "font-semibold text-sm sm:text-base",
                            isDarkMode ? "text-neutral-100" : "text-gray-800",
                          ].join(" ")}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div
                            className={[
                              "text-xs mt-0.5",
                              isDarkMode ? "text-neutral-500" : "text-gray-600",
                            ].join(" ")}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                        <IconArrowRight />
                      </div>
                    </button>
                  ))}

                  {/* Preferences */}
                  <button
                    onClick={() => setMenuView("settings")}
                    className={[
                      "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-2xl text-left",
                      "transition-colors active:scale-95",
                      isDarkMode
                        ? "hover:bg-white/10 bg-white/5 ring-1 ring-white/10"
                        : "hover:bg-black/5 bg-black/5 ring-1 ring-black/10",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl grid place-items-center flex-shrink-0",
                        isDarkMode ? "bg-white/10" : "bg-black/10",
                      ].join(" ")}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6">
                        <IconSettings />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={[
                          "font-semibold text-sm sm:text-base",
                          isDarkMode ? "text-neutral-100" : "text-gray-800",
                        ].join(" ")}
                      >
                        Preferences
                      </div>
                      <div
                        className={[
                          "text-xs mt-0.5",
                          isDarkMode ? "text-neutral-500" : "text-gray-600",
                        ].join(" ")}
                      >
                        Appearance & settings
                      </div>
                    </div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                      <IconArrowRight />
                    </div>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      onLogout();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-2xl ring-1 ring-red-500/25 hover:ring-red-500/40 hover:bg-red-500/10 transition-colors active:scale-95"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl grid place-items-center ring-1 ring-red-500/30 flex-shrink-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 text-red-500">
                        <IconLogout />
                      </div>
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-red-500">
                      Sign Out
                    </span>
                  </button>
                </>
              ) : (
                // Settings View
                <div className="space-y-4">
                  <button
                    onClick={() => setMenuView("main")}
                    className={[
                      "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
                      isDarkMode
                        ? "text-neutral-400 hover:text-white hover:bg-white/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-black/5",
                    ].join(" ")}
                  >
                    <IconArrowLeft />
                    <span className="text-sm font-medium">Back</span>
                  </button>

                  {/* Edit Profile Shortcut */}
                  <div
                    className={[
                      "p-4 sm:p-5 rounded-lg sm:rounded-2xl",
                      isDarkMode
                        ? "bg-white/5 ring-1 ring-white/10"
                        : "bg-black/5 ring-1 ring-black/10",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "font-semibold mb-3 sm:mb-4 text-sm sm:text-base",
                        isDarkMode ? "text-neutral-100" : "text-gray-800",
                      ].join(" ")}
                    >
                      Profile
                    </div>
                    <button
                      onClick={() => {
                        onViewChange("PROFILE");
                        setShowMenu(false);
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors"
                    >
                      Edit Profile & Avatar
                    </button>
                  </div>

                  {/* Theme Selection */}
                  <div
                    className={[
                      "p-4 sm:p-5 rounded-lg sm:rounded-2xl",
                      isDarkMode
                        ? "bg-white/5 ring-1 ring-white/10"
                        : "bg-black/5 ring-1 ring-black/10",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "font-semibold mb-3 sm:mb-4 text-sm sm:text-base",
                        isDarkMode ? "text-neutral-100" : "text-gray-800",
                      ].join(" ")}
                    >
                      Appearance
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => onSetTheme && onSetTheme("dark")}
                        className={[
                          "flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all active:scale-95",
                          isDarkMode
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-transparent hover:border-gray-300 bg-gray-100",
                        ].join(" ")}
                      >
                        <div className="text-xl sm:text-2xl mb-2">
                          <IconMoon />
                        </div>
                        <div
                          className={[
                            "text-xs sm:text-sm font-semibold",
                            isDarkMode ? "text-white" : "text-gray-700",
                          ].join(" ")}
                        >
                          Dark
                        </div>
                      </button>
                      <button
                        onClick={() => onSetTheme && onSetTheme("light")}
                        className={[
                          "flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all active:scale-95",
                          !isDarkMode
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:border-neutral-600 bg-neutral-800",
                        ].join(" ")}
                      >
                        <div className="text-xl sm:text-2xl mb-2">
                          <IconSun />
                        </div>
                        <div
                          className={[
                            "text-xs sm:text-sm font-semibold",
                            !isDarkMode ? "text-gray-900" : "text-neutral-300",
                          ].join(" ")}
                        >
                          Light
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div
                    className={[
                      "p-4 sm:p-5 rounded-lg sm:rounded-2xl",
                      isDarkMode
                        ? "bg-white/5 ring-1 ring-white/10"
                        : "bg-black/5 ring-1 ring-black/10",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "font-semibold mb-3 sm:mb-4 text-sm sm:text-base",
                        isDarkMode ? "text-neutral-100" : "text-gray-800",
                      ].join(" ")}
                    >
                      Account
                    </div>

                    <div className="space-y-2 sm:space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span
                          className={[
                            isDarkMode ? "text-neutral-400" : "text-gray-500",
                          ].join(" ")}
                        >
                          Username
                        </span>
                        <span
                          className={[
                            "font-medium text-xs sm:text-sm",
                            isDarkMode ? "text-white" : "text-gray-900",
                          ].join(" ")}
                        >
                          @{user.alias}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-500"
                          }
                        >
                          Role
                        </span>
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-900"
                          }
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-500"
                          }
                        >
                          Posts
                        </span>
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-900"
                          }
                        >
                          {user.totalTransmissions || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={[
                "px-4 sm:px-5 py-3 sm:py-4 text-center border-t sticky bottom-0",
                isDarkMode
                  ? "border-white/10 bg-black/20"
                  : "border-black/10 bg-white/20",
              ].join(" ")}
            >
              <p
                className={[
                  "text-xs sm:text-sm",
                  isDarkMode ? "text-neutral-500" : "text-gray-500",
                ].join(" ")}
              >
                AnonPro • Powered by Ferous
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .skip-link {
          position: fixed;
          z-index: 9999;
          left: 12px;
          top: 12px;
          transform: translateY(-150%);
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 600;
          background: ${
            isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
          };
          color: ${isDarkMode ? "#fff" : "#111"};
          border: 1px solid ${
            isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
          };
          transition: transform .2s ease;
          font-size: 14px;
        }
        .skip-link:focus {
          transform: translateY(0);
          outline: none;
        }

        .icon-btn {
          -webkit-tap-highlight-color: transparent;
          position: relative;
          display: inline-grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid ${
            isDarkMode ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.08)"
          };
          background: ${
            isDarkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.03)"
          };
          transition: background .2s ease, transform .15s ease, color .2s ease;
          cursor: pointer;
        }
        .icon-btn:active {
          transform: scale(.96);
        }
        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (min-width: 640px) {
          .icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Header;
