import React from "react";
import { FloatingInput } from "./FloatingInput";

interface SignupViewProps {
  alias: string;
  setAlias: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  adminKey: string;
  setAdminKey: (val: string) => void;
  showAdminKey: boolean;
  setShowAdminKey: (val: boolean) => void;
  acceptTerms: boolean;
  setAcceptTerms: (val: boolean) => void;
  isGenerating: boolean;
  handleGenerateAlias: () => void;
  isLoading: boolean;
  handleSignup: (e: React.FormEvent) => void;
  switchView: (view: "login") => void;
  setShowTerms: (val: boolean) => void;
  isDarkMode: boolean;
  icons: {
    user: React.ReactNode;
    email: React.ReactNode;
    lock: React.ReactNode;
  };
  passwordMetrics: {
    score: number;
    label: string;
    color: string;
    percentage: number;
  };
}

export const SignupView: React.FC<SignupViewProps> = ({
  alias,
  setAlias,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  adminKey,
  setAdminKey,
  showAdminKey,
  setShowAdminKey,
  acceptTerms,
  setAcceptTerms,
  isGenerating,
  handleGenerateAlias,
  isLoading,
  handleSignup,
  switchView,
  setShowTerms,
  isDarkMode,
  icons,
  passwordMetrics,
}) => {
  return (
    <form className="space-y-5" onSubmit={handleSignup}>
      <FloatingInput
        id="signup-alias"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        label="Username"
        icon={icons.user}
        isDarkMode={isDarkMode}
        rightElement={
          <button
            type="button"
            onClick={handleGenerateAlias}
            disabled={isGenerating}
            className={`p-2 rounded-xl transition-all ${
              isDarkMode
                ? "hover:bg-black text-neutral-400"
                : "hover:bg-gray-200 text-gray-500"
            }`}
            title="Generate random username"
          >
            {isGenerating ? "..." : "Generate"}
          </button>
        }
      />

      <FloatingInput
        id="signup-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        label="Email (optional)"
        icon={icons.email}
        isDarkMode={isDarkMode}
      />

      <div className="space-y-2">
        <FloatingInput
          id="signup-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Password"
          icon={icons.lock}
          isDarkMode={isDarkMode}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode
                  ? "hover:bg-black text-neutral-400"
                  : "hover:bg-gray-200 text-gray-500"
              }`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        />

        {/* Password Strength */}
        {password && (
          <div className="flex items-center gap-2 px-1">
            <div
              className={`flex-1 h-1.5 rounded-full ${
                isDarkMode ? "bg-black" : "bg-gray-200"
              } overflow-hidden`}
            >
              <div
                className={`h-full ${passwordMetrics.color} transition-all duration-300 rounded-full`}
                style={{ width: `${passwordMetrics.percentage}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium ${
                passwordMetrics.score >= 4
                  ? "text-emerald-500"
                  : passwordMetrics.score >= 3
                    ? "text-blue-500"
                    : passwordMetrics.score >= 2
                      ? "text-yellow-500"
                      : "text-red-500"
              }`}
            >
              {passwordMetrics.label}
            </span>
          </div>
        )}
      </div>

      {/* Admin Key Toggle */}
      <button
        type="button"
        onClick={() => setShowAdminKey(!showAdminKey)}
        className={`flex items-center gap-2 text-sm ${
          isDarkMode
            ? "text-neutral-500 hover:text-neutral-300"
            : "text-gray-500 hover:text-gray-700"
        } transition-colors`}
      >
        <span
          className={`transition-transform ${showAdminKey ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        Have an admin key?
      </button>

      {showAdminKey && (
        <FloatingInput
          id="admin-key"
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          label="Admin Key"
          icon={<span>Key</span>}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
            acceptTerms
              ? "bg-blue-500 text-white"
              : isDarkMode
                ? "bg-black border border-neutral-700"
                : "bg-gray-100 border border-gray-300"
          }`}
        >
          {acceptTerms && <span className="text-xs">✓</span>}
        </div>
        <span
          className={`text-sm ${
            isDarkMode ? "text-neutral-400" : "text-gray-600"
          }`}
        >
          I agree to the{" "}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-blue-500 hover:underline"
          >
            Terms & Privacy
          </button>
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !acceptTerms}
        className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
          isLoading || !acceptTerms
            ? isDarkMode
              ? "bg-black text-neutral-500"
              : "bg-gray-200 text-gray-400"
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          "Create Account →"
        )}
      </button>

      <div className="text-center">
        <p
          className={`text-sm ${
            isDarkMode ? "text-neutral-500" : "text-gray-500"
          }`}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => switchView("login")}
            className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
};
