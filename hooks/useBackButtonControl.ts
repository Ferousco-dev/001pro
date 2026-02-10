import { useEffect, useState, useCallback, useRef } from "react";

interface BackButtonControlProps {
  currentView: string;
  onNavigate: (view: any) => void;
  defaultView?: string;
}

export const useBackButtonControl = ({
  currentView,
  onNavigate,
  defaultView = "HOME",
}: BackButtonControlProps) => {
  const [showExitToast, setShowExitToast] = useState(false);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalNavigation = useRef(false);

  // Helper to push a dummy state to "trap" the back button
  const pushDummyState = useCallback(() => {
    isInternalNavigation.current = true;
    window.history.pushState(
      { view: currentView },
      "",
      window.location.hash || "#",
    );
    // setTimeout to reset flag after the event loop clears
    setTimeout(() => {
      isInternalNavigation.current = false;
    }, 50);
  }, [currentView]);

  useEffect(() => {
    // Initial setup: ensure we have a state to pop
    // We replace the current state with itself to ensure it has the view data
    window.history.replaceState(
      { view: currentView },
      "",
      window.location.hash || "#",
    );
    // Then push a dummy state so the first back press doesn't exit immediately if we are at the "root"
    // specific to our SPA behavior where we want to trap "Back"
    pushDummyState();

    const handlePopState = (event: PopStateEvent) => {
      // If we initiated this popstate (e.g. via code), ignore logic
      if (isInternalNavigation.current) {
        return;
      }

      // 1. If not on Home, go Home
      if (currentView !== defaultView) {
        event.preventDefault(); // Browser doesn't support this on popstate, but good for intent
        onNavigate(defaultView);
        // Restore the trap for the next interaction
        pushDummyState();
        return;
      }

      // 2. If on Home -> handle Key Press
      // Condition: User is on HOME and pressed back.
      // At this point, the browser HAS popped the state. access to the "dummy" state is lost.

      if (exitTimerRef.current) {
        // Timer is active implies this is the SECOND press within window
        // Allow exit (do nothing, let browser popped state remain popped, effectively going back to true history or previous page)
        // However, since we "pushed" a dummy state on mount, "going back" might just take us to the entry point.
        // If the user entered the site, we pushed State B. Current is B.
        // Back -> State A.
        // If State A was the entry, the browser stays on the page but history is at 0.
        // To truly exit, we might need to go back again or let the user press back again if they are at the absolute root.
        // But for "Prevent Accidental Exit", letting the history pop naturally is usually enough if it matches standard behavior.
        // If we want to forciby close: window.close() (only works if script opened), otherwise just let it be.
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
        setShowExitToast(false);
        // We do NOT push dummy state here, allowing the browser traversal to continue backward.
        return;
      }

      // First Press
      setShowExitToast(true);

      // Restore the trap immediately so the user is "still" on the current page according to history
      // This effectively cancels the "Back" navigation from a history stack perspective
      pushDummyState();

      // Start timer
      exitTimerRef.current = setTimeout(() => {
        setShowExitToast(false);
        exitTimerRef.current = null;
      }, 2000);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [currentView, defaultView, onNavigate, pushDummyState]);

  return { showExitToast };
};
