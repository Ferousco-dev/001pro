import React from "react";
import { FloatingInput } from "./FloatingInput";

// Email Entry View
interface EmailEntryViewProps {
  email: string;
  setEmail: (val: string) => void;
  isLoading: boolean;
  handleSendCode: (e: React.FormEvent) => void;
  switchView: (view: "login") => void;
  isDarkMode: boolean;
  icon: React.ReactNode;
}

export const EmailEntryView: React.FC<EmailEntryViewProps> = ({
  email,
  setEmail,
  isLoading,
  handleSendCode,
  switchView,
  isDarkMode,
  icon,
}) => (
  <form className="space-y-5" onSubmit={handleSendCode}>
    <FloatingInput
      id="reset-email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      label="Email Address"
      icon={icon}
      isDarkMode={isDarkMode}
    />
    <button
      type="submit"
      disabled={isLoading}
      className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
        isLoading
          ? "bg-zinc-900 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20"
      } text-white`}
    >
      {isLoading ? "Sending..." : "Send Verification Code"}
    </button>
    <button
      type="button"
      onClick={() => switchView("login")}
      className={`w-full py-3 rounded-2xl font-medium transition-colors ${
        isDarkMode
          ? "text-neutral-400 hover:text-white hover:bg-black"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      ← Back to Login
    </button>
  </form>
);

// Verification Code View
interface VerificationCodeViewProps {
  code: string[];
  handleCodeChange: (index: number, val: string) => void;
  handleCodeKeyDown: (index: number, e: React.KeyboardEvent) => void;
  codeInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  resendTimer: number;
  handleSendCode: () => void;
  isLoading: boolean;
  handleVerifyCode: (e: React.FormEvent) => void;
  switchView: (view: "login") => void;
  isDarkMode: boolean;
}

export const VerificationCodeView: React.FC<VerificationCodeViewProps> = ({
  code,
  handleCodeChange,
  handleCodeKeyDown,
  codeInputRefs,
  resendTimer,
  handleSendCode,
  isLoading,
  handleVerifyCode,
  switchView,
  isDarkMode,
}) => (
  <form className="space-y-6" onSubmit={handleVerifyCode}>
    <div className="flex justify-center gap-2 sm:gap-3">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (codeInputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={(e) =>
            handleCodeChange(index, e.target.value.replace(/\D/g, ""))
          }
          onKeyDown={(e) => handleCodeKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl outline-none transition-all ${
            isDarkMode
              ? "bg-black text-white border border-neutral-800 focus:border-blue-500"
              : "bg-gray-50 text-gray-900 border border-gray-200 focus:border-blue-500"
          }`}
        />
      ))}
    </div>
    <div className="text-center">
      <p
        className={`text-sm ${isDarkMode ? "text-neutral-500" : "text-gray-500"}`}
      >
        Didn't receive the code?{" "}
        {resendTimer > 0 ? (
          <span>Resend in {resendTimer}s</span>
        ) : (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isLoading}
            className="font-semibold text-blue-500 hover:text-blue-400"
          >
            Resend Code
          </button>
        )}
      </p>
    </div>
    <button
      type="submit"
      disabled={isLoading || code.some((d) => !d)}
      className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
        isLoading || code.some((d) => !d)
          ? isDarkMode
            ? "bg-black text-neutral-500"
            : "bg-gray-200 text-gray-400"
          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
      }`}
    >
      {isLoading ? "Verifying..." : "Verify Code"}
    </button>
    <button
      type="button"
      onClick={() => switchView("login")}
      className={`w-full py-3 rounded-2xl font-medium transition-colors ${
        isDarkMode
          ? "text-neutral-400 hover:text-white hover:bg-black"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      ← Back to Login
    </button>
  </form>
);

// Reset Password View
interface ResetPasswordViewProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  passwordMetrics: {
    score: number;
    label: string;
    color: string;
    percentage: number;
  };
  isLoading: boolean;
  handleResetPassword: (e: React.FormEvent) => void;
  switchView: (view: "login") => void;
  isDarkMode: boolean;
  icons: { lock: React.ReactNode; shield: React.ReactNode };
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordMetrics,
  isLoading,
  handleResetPassword,
  switchView,
  isDarkMode,
  icons,
}) => (
  <form className="space-y-5" onSubmit={handleResetPassword}>
    <FloatingInput
      id="new-password"
      type={showNewPassword ? "text" : "password"}
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      label="New Password"
      icon={icons.lock}
      isDarkMode={isDarkMode}
      rightElement={
        <button
          type="button"
          onClick={() => setShowNewPassword(!showNewPassword)}
          className="p-2"
        >
          {showNewPassword ? "🙈" : "👁️"}
        </button>
      }
    />
    {newPassword && (
      <div className="flex items-center gap-2 px-1">
        <div
          className={`flex-1 h-1.5 rounded-full ${isDarkMode ? "bg-black" : "bg-gray-200"} overflow-hidden`}
        >
          <div
            className={`h-full ${passwordMetrics.color} transition-all duration-300 rounded-full`}
            style={{ width: `${passwordMetrics.percentage}%` }}
          />
        </div>
        <span
          className={`text-xs font-medium ${passwordMetrics.score >= 4 ? "text-emerald-500" : "text-yellow-500"}`}
        >
          {passwordMetrics.label}
        </span>
      </div>
    )}
    <FloatingInput
      id="confirm-password"
      type={showConfirmPassword ? "text" : "password"}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      label="Confirm Password"
      icon={icons.shield}
      isDarkMode={isDarkMode}
      rightElement={
        confirmPassword && (
          <span
            className={
              newPassword === confirmPassword
                ? "text-emerald-500"
                : "text-red-500"
            }
          >
            {newPassword === confirmPassword ? "✓" : "✕"}
          </span>
        )
      }
    />
    <button
      type="submit"
      disabled={
        isLoading || newPassword !== confirmPassword || newPassword.length < 6
      }
      className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
        isLoading || newPassword !== confirmPassword || newPassword.length < 6
          ? isDarkMode
            ? "bg-black text-neutral-500"
            : "bg-gray-200 text-gray-400"
          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
      }`}
    >
      {isLoading ? "Resetting..." : "Reset Password"}
    </button>
    <button
      type="button"
      onClick={() => switchView("login")}
      className={`w-full py-3 rounded-2xl font-medium transition-colors ${
        isDarkMode
          ? "text-neutral-400 hover:text-white hover:bg-black"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      ← Back to Login
    </button>
  </form>
);
