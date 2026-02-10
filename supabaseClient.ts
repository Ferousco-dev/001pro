import { createClient } from "@supabase/supabase-js";

// ============================================
// CORRECTED VERSION - TypeScript Error Fixed
// ============================================

const getEnv = (key: string): string => {
  try {
    // METHOD 1: Check for Vite import.meta.env
    // @ts-ignore - Vite adds env to import.meta at runtime
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env[key]
    ) {
      // @ts-ignore
      const val = String(import.meta.env[key]);
      // Reject placeholder values
      if (
        val.includes("YOUR_") ||
        val.includes("placeholder") ||
        val.length < 10
      ) {
        return "";
      }
      return val;
    }
  } catch (e) {
    // Continue to next method
  }

  try {
    // METHOD 2: Check for process.env
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      const val = String(process.env[key]);
      // Reject placeholder values
      if (
        val.includes("YOUR_") ||
        val.includes("placeholder") ||
        val.length < 10
      ) {
        return "";
      }
      return val;
    }
  } catch (e) {
    // Continue to next method
  }

  return "";
};

// FIXED: Try VITE_ prefix first, then fall back to non-prefixed
const supabaseUrl = getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL");
const supabaseAnonKey =
  getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("SUPABASE_ANON_KEY");

// Strict validation: Must be a real https URL and not a generic string
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  (supabaseUrl.startsWith("https://") || supabaseUrl.startsWith("http://")) &&
  supabaseAnonKey.length > 20
);

// Log configuration status for debugging
if (!isSupabaseConfigured) {
  console.log(
    "%c [PROTOCOL ALERT] Supabase credentials missing or invalid. ",
    "color: #fbbf24; font-weight: bold; background: #1e1b4b; padding: 6px; border-radius: 8px;",
  );
  console.log("Debug info:", {
    VITE_SUPABASE_URL: getEnv("VITE_SUPABASE_URL") ? "✓ Found" : "✗ Missing",
    VITE_SUPABASE_ANON_KEY: getEnv("VITE_SUPABASE_ANON_KEY")
      ? "✓ Found"
      : "✗ Missing",
    SUPABASE_URL: getEnv("SUPABASE_URL") ? "✓ Found" : "✗ Missing",
    SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY") ? "✓ Found" : "✗ Missing",
  });
  console.log(
    "%c Fix: Create .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    "color: #10b981; font-weight: bold;",
  );
} else {
  console.log(
    "%c [STATUS]  connection active ✓ ",
    "color: #10b981; font-weight: bold; background: #1e1b4b; padding: 6px; border-radius: 8px;",
  );
  // console.log("Connected to:", supabaseUrl);
}

// Mock client for when Supabase is not configured
const createMockClient = () => {
  console.warn("Using mock Supabase client - app will not persist data");
  const handler = {
    get(target: any, prop: string): any {
      if (prop === "from" || prop === "channel" || prop === "auth") {
        return () => new Proxy({}, handler);
      }
      if (
        [
          "select",
          "insert",
          "update",
          "delete",
          "eq",
          "ilike",
          "order",
          "single",
        ].includes(prop)
      ) {
        return () => new Proxy({ data: null, error: null }, handler);
      }
      if (prop === "then") return undefined;
      return target[prop];
    },
  };
  return new Proxy({ isMock: true }, handler) as any;
};

// Create the actual client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Make it available in console for debugging
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
  (window as any).supabaseConfig = {
    url: supabaseUrl,
    configured: isSupabaseConfigured,
  };
}
