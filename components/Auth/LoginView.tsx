import React from "react";
import { FloatingInput } from "./FloatingInput";

interface LoginViewProps {
  alias: string;
  setAlias: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  isLoading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  switchView: (view: "signup" | "forgot-password") => void;
  isDarkMode: boolean;
  icons: {
    user: React.ReactNode;
    lock: React.ReactNode;
  };
}

export const LoginView: React.FC<LoginViewProps> = ({
  alias,
  setAlias,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  handleLogin,
  switchView,
  isDarkMode,
  icons,
}) => {
  return (
    <form className="space-y-5" onSubmit={handleLogin}>
      <FloatingInput
        id="login-alias"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        label="Username"
        icon={icons.user}
        isDarkMode={isDarkMode}
      />

      <FloatingInput
        id="login-password"
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
              isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
            }`}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        }
      />

      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded-md border-2 transition-all ${
                rememberMe
                  ? "bg-blue-500 border-blue-500"
                  : isDarkMode
                    ? "border-neutral-700 bg-black/50"
                    : "border-gray-200 bg-white"
              }`}
            >
              {rememberMe && (
                <svg
                  className="w-full h-full text-white p-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <span
            className={`text-xs font-medium ${
              isDarkMode ? "text-neutral-400" : "text-gray-500"
            }`}
          >
            Remember me
          </span>
        </label>

        <button
          type="button"
          onClick={() => switchView("forgot-password")}
          className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="text-center pt-2">
        <p
          className={`text-sm ${isDarkMode ? "text-neutral-400" : "text-gray-500"}`}
        >
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => switchView("signup")}
            className="text-blue-500 font-bold hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    </form>
  );
};
