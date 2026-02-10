import React, { useState, useMemo, useEffect, useRef } from "react";
import { UserProfile } from "../types";
import { generateCampusAlias } from "../paradoxRandoms";
import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { LoginView } from "./Auth/LoginView";
import { SignupView } from "./Auth/SignupView";
import {
  EmailEntryView,
  VerificationCodeView,
  ResetPasswordView,
} from "./Auth/ForgotPasswordViews";
import { LegalModals } from "./Auth/LegalModals";
import {
  UserIcon,
  LockIcon,
  EmailIcon,
  ShieldIcon,
  SunIcon,
  MoonIcon,
} from "./Auth/Icons";

interface AuthProps {
  onLogin: (user: UserProfile) => void;
  currentPin: string;
}

type AuthView =
  | "login"
  | "signup"
  | "forgot-password"
  | "verify-code"
  | "reset-password";

// ===== Main Auth Component =====
const Auth: React.FC<AuthProps> = ({ onLogin, currentPin }) => {
  const [view, setView] = useState<AuthView>("login");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Forgot password states
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Glass styles
  const glassStyle = {
    background: isDarkMode
      ? "rgba(10, 10, 10, 0.8)"
      : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
  };

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Direct Gmail SMTP approach (requires backend implementation)
  const sendPasswordResetEmailDirect = async (email: string, code: string) => {
    const emailData = {
      to: email,
      subject: "AnonPro Password Reset",
      message: `
Hello,

You requested a password reset for your AnonPro account.

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this reset, please ignore this email.

Best regards,
AnonPro Team
      `,
      from: "your-official-gmail@gmail.com",
    };

    // Call your backend API that handles Gmail SMTP
    try {
      // Determine API URL based on environment
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // Use the production serverless endpoint or the local development endpoint
      // If we are running on 'localhost:3000' (default Vercel Dev port), we can use relative paths
      const isVercelDev = window.location.port === "3000";

      const apiUrl =
        isDevelopment && !isVercelDev
          ? "http://localhost:5001/api/send-password-reset"
          : "/api/send-verification-code";

      console.log(`📡 Sending request to: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Email sent successfully");
        return true;
      } else {
        console.error(
          "❌ Email sending failed:",
          data.error || "Unknown error",
        );
        return false;
      }
    } catch (error) {
      console.error("📧 Email API call failed:", error);
      console.log("🔄 Falling back to direct code display for testing");
      console.log("🔑 VERIFICATION CODE:", code);
      console.log("📧 Would send to:", email);
      return false; // Return false to trigger the alert with the code
    }
  };

  // Password strength calculation
  const passwordMetrics = useMemo(() => {
    const pwd = view === "reset-password" ? newPassword : password;
    if (pwd.length === 0)
      return { score: 0, label: "", color: "bg-black", percentage: 0 };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (pwd.length < 6)
      return {
        score: 1,
        label: "Too short",
        color: "bg-red-500",
        percentage: 20,
      };
    if (score <= 2)
      return {
        score: 2,
        label: "Weak",
        color: "bg-orange-500",
        percentage: 40,
      };
    if (score <= 3)
      return {
        score: 3,
        label: "Fair",
        color: "bg-yellow-500",
        percentage: 60,
      };
    if (score <= 4)
      return { score: 4, label: "Good", color: "bg-blue-500", percentage: 80 };
    return {
      score: 5,
      label: "Strong",
      color: "bg-emerald-500",
      percentage: 100,
    };
  }, [password, newPassword, view]);

  // Handle verification code input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.slice(0, 6).split("");
      const newCode = [...verificationCode];
      chars.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setVerificationCode(newCode);
      const nextIndex = Math.min(index + chars.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!alias.trim()) {
      setError("Username is required");
      return;
    }

    if (alias.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const cleanAlias = alias.trim();

      if (isSupabaseConfigured) {
        const { data: allUsers, error: fetchError } = await supabase
          .from("profiles")
          .select("*");

        if (fetchError) throw fetchError;

        const existingUser = allUsers?.find(
          (u) => u.alias.toLowerCase() === cleanAlias.toLowerCase(),
        );

        if (existingUser) {
          if (existingUser.is_banned) {
            setError(
              "PROTOCOL ACCESS TERMINATED: This account is permanently banned.",
            );
            setIsLoading(false);
            return;
          }
          if (existingUser.password === password) {
            const userObj = {
              ...existingUser,
              joinedAt: new Date(existingUser.joinedAt),
            };

            setSuccess("Welcome back! Signing you in...");

            setTimeout(() => {
              onLogin(userObj);
              if (rememberMe) {
                localStorage.setItem(
                  "anonpro_session",
                  JSON.stringify({
                    alias: existingUser.alias,
                    password: existingUser.password,
                    rememberMe: true,
                  }),
                );
              } else {
                sessionStorage.setItem(
                  "anonpro_session",
                  JSON.stringify({
                    alias: existingUser.alias,
                    password: existingUser.password,
                  }),
                );
              }
            }, 1000);
          } else {
            setError("Incorrect password. Please try again.");
          }
        } else {
          setError("User not found. Please sign up first.");
        }
      } else {
        setError("Database not configured");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!alias.trim()) {
      setError("Username is required");
      return;
    }

    if (alias.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (alias.trim().length > 20) {
      setError("Username must be less than 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(alias.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password.length > 50) {
      setError("Password must be less than 50 characters");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const cleanAlias = alias.trim();
      const isAdmin = adminKey === currentPin;

      if (isSupabaseConfigured) {
        const { data: allUsers, error: fetchError } = await supabase
          .from("profiles")
          .select("*");

        if (fetchError) throw fetchError;

        const existingUser = allUsers?.find(
          (u) => u.alias.toLowerCase() === cleanAlias.toLowerCase(),
        );

        if (existingUser) {
          setError("Username already taken. Please choose another.");
          return;
        }

        const now = new Date();
        const newUser: UserProfile = {
          alias: cleanAlias,
          password: password,
          email: email.trim() || undefined,
          role: isAdmin ? "ADMIN" : "USER",
          joinedAt: now.toISOString(),
          reputation: 10,
          followers: [],
          following: [],
          totalLikesReceived: 0,
          bio: "",
          totalTransmissions: 0,
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newUser);

        if (insertError) throw insertError;

        setSuccess("Account created successfully! Welcome aboard!");

        setTimeout(() => {
          onLogin(newUser);
          localStorage.setItem(
            "anonpro_session",
            JSON.stringify({
              alias: newUser.alias,
              password: newUser.password,
            }),
          );
        }, 1000);
      } else {
        const newUser: UserProfile = {
          alias: cleanAlias,
          password: password,
          email: email.trim() || undefined,
          role: adminKey === currentPin ? "ADMIN" : "USER",
          is_admin: adminKey === currentPin,
          is_verified: adminKey === currentPin,
          joinedAt: new Date().toISOString(),
          reputation: 10,
          followers: [],
          following: [],
          totalLikesReceived: 0,
          bio: "",
          totalTransmissions: 0,
        };

        setSuccess("Account created!");
        setTimeout(() => onLogin(newUser), 1000);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!resetEmail.trim()) {
      setError("Email address is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured) {
        // Check if user exists first
        const { data: users, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", resetEmail.trim());

        if (fetchError) throw fetchError;

        if (!users || users.length === 0) {
          setError("No account found with this email address");
          return;
        }

        // Generate verification code and store it
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const { error: insertError } = await supabase
          .from("password_reset_codes")
          .insert({
            email: resetEmail.trim(),
            code: code,
            expires_at: expiresAt.toISOString(),
            used: false,
          });

        if (insertError) throw insertError;

        // Try to send email using custom Gmail approach
        const emailSent = await sendPasswordResetEmailDirect(
          resetEmail.trim(),
          code,
        );

        if (!emailSent) {
          // Fallback: Show code for manual entry
          console.log(
            "⚠️ Direct email sending failed - showing code for manual entry",
          );
          console.log("🔑 VERIFICATION CODE:", code);
          alert(
            `Code generated. Your verification code is: ${code}\n\nPlease save this code and continue with verification.`,
          );
        }

        if (emailSent) {
          setSuccess("Verification code sent to your email!");
        } else {
          setError("Failed to send email. Please check the backend.");
        }
        setResendTimer(60);

        // Only switch to verify-code view on initial send, not on resend
        if (view === "forgot-password") {
          setTimeout(() => {
            switchViewWithAnimation("verify-code");
          }, 1000);
        }
      } else {
        setError("Password reset requires database connection");
      }
    } catch (err: any) {
      console.error("Send code error:", err);
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured) {
        // First try to verify with our custom table
        const { data: codeData, error: fetchError } = await supabase
          .from("password_reset_codes")
          .select("*")
          .eq("email", resetEmail.trim())
          .eq("code", code)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (fetchError || !codeData) {
          setError("Invalid or expired verification code");
          return;
        }

        // Mark code as used
        await supabase
          .from("password_reset_codes")
          .update({ used: true })
          .eq("id", codeData.id);

        setSuccess("Code verified! Create your new password.");

        setTimeout(() => {
          switchViewWithAnimation("reset-password");
        }, 1000);
      }
    } catch (err: any) {
      console.error("Verify code error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword.length > 50) {
      setError("Password must be less than 50 characters");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured) {
        // Update password in profiles table
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ password: newPassword })
          .eq("email", resetEmail.trim());

        if (updateError) throw updateError;

        // If using Supabase Auth, also update the auth user password
        try {
          const { error: authError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (authError) {
            console.warn("Auth password update failed:", authError);
            // Don't throw here as the profile update succeeded
          }
        } catch (authErr) {
          console.warn("Auth password update failed:", authErr);
        }

        setSuccess("Password reset successful! Redirecting to login...");

        setTimeout(() => {
          switchViewWithAnimation("login");
          setResetEmail("");
          setVerificationCode(["", "", "", "", "", ""]);
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAlias = async () => {
    setIsGenerating(true);
    try {
      const newAlias = await generateCampusAlias();
      setAlias(newAlias);
    } finally {
      setIsGenerating(false);
    }
  };

  const switchViewWithAnimation = (newView: AuthView) => {
    setIsTransitioning(true);
    setError("");
    setSuccess("");

    setTimeout(() => {
      setView(newView);
      if (newView === "login" || newView === "signup") {
        setAlias("");
        setPassword("");
        setEmail("");
        setAdminKey("");
        setAcceptTerms(false);
      }
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <div
      className={`min-h-dvh flex items-start justify-center px-4 pt-8 pb-20 sm:items-center sm:pt-12 sm:pb-12 relative transition-colors duration-700 ${
        isDarkMode ? "bg-black" : "bg-gray-50"
      }`}
    >
      {/* Background Layer */}
      <div
        className={`fixed inset-0 -z-10 ${
          isDarkMode ? "bg-black" : "bg-gray-50"
        }`}
      />

      {/* Premium Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-6 right-6 z-50 group hidden sm:block"
        aria-label="Toggle theme"
      >
        <div className="relative">
          <div
            className="w-14 h-14 backdrop-blur-2xl rounded-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl"
            style={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
              border: isDarkMode
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.3)",
              boxShadow: isDarkMode
                ? "0 12px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)"
                : "0 12px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <div className="relative flex items-center justify-center w-full h-full">
              <div
                className={`transition-all duration-500 ${
                  isDarkMode ? "opacity-100 rotate-0" : "opacity-0 rotate-180"
                }`}
              >
                <MoonIcon />
              </div>
              <div
                className={`absolute transition-all duration-500 ${
                  !isDarkMode ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                }`}
              >
                <SunIcon />
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.1) 100%)"
                  : "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.08) 100%)",
                boxShadow:
                  "0 0 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>
      </button>

      {/* Premium Glass Auth Card */}
      <div className="relative max-w-md w-full z-10">
        <div
          className={`relative backdrop-blur-3xl rounded-3xl shadow-2xl transition-all duration-500 overflow-hidden ${
            isTransitioning
              ? "opacity-0 scale-95 translate-y-4"
              : "opacity-100 scale-100 translate-y-0"
          }`}
          style={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.01) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 100%)",
            border: isDarkMode
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(255,255,255,0.25)",
            boxShadow: isDarkMode
              ? `
                0 32px 64px rgba(0,0,0,0.4),
                0 16px 32px rgba(0,0,0,0.3),
                0 8px 16px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.05),
                inset 0 -1px 0 rgba(255,255,255,0.02)
              `
              : `
                0 32px 64px rgba(0,0,0,0.15),
                0 16px 32px rgba(0,0,0,0.1),
                0 8px 16px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.4),
                inset 0 -1px 0 rgba(255,255,255,0.2)
              `,
          }}
        >
          {/* Animated background gradient */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(147,51,234,0.02) 50%, transparent 100%)"
                : "linear-gradient(135deg, rgba(59,130,246,0.02) 0%, rgba(147,51,234,0.01) 50%, transparent 100%)",
            }}
          />

          {/* Subtle inner glow on hover */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 rounded-3xl">
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(147,51,234,0.03) 100%)"
                  : "linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(147,51,234,0.02) 100%)",
                boxShadow: isDarkMode
                  ? "inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 sm:p-10 space-y-6">
            {/* Logo & Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-2xl font-black shadow-2xl transition-all duration-500"
                  style={{
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
                    border: isDarkMode
                      ? "1px solid rgba(255,255,255,0.15)"
                      : "1px solid rgba(255,255,255,0.4)",
                    boxShadow: isDarkMode
                      ? "0 20px 40px rgba(0,0,0,0.3), 0 8px 16px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)"
                      : "0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)",
                    color: isDarkMode ? "white" : "black",
                  }}
                >
                  A
                </div>
              </div>

              <div className="space-y-3">
                <h1
                  className={`text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {view === "login" && "Welcome Back"}
                  {view === "signup" && "Create Account"}
                  {view === "forgot-password" && "Forgot Password"}
                  {view === "verify-code" && "Verify Email"}
                  {view === "reset-password" && "New Password"}
                </h1>

                <p
                  className={`text-sm font-medium transition-all duration-500 ${
                    isDarkMode ? "text-neutral-400" : "text-gray-600"
                  }`}
                >
                  {view === "login" && "Sign in to continue to AnonPro"}
                  {view === "signup" && "Join the anonymous community"}
                  {view === "forgot-password" &&
                    "We'll send you a verification code"}
                  {view === "verify-code" &&
                    `Enter the code sent to ${resetEmail}`}
                  {view === "reset-password" && "Create a strong new password"}
                </p>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl ${
                  isDarkMode
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-emerald-50 border border-emerald-200"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  {success}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl ${
                  isDarkMode
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✕</span>
                </div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-red-400" : "text-red-700"
                  }`}
                >
                  {error}
                </p>
              </div>
            )}

            {view === "login" && (
              <LoginView
                alias={alias}
                setAlias={setAlias}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                isLoading={isLoading}
                handleLogin={handleLogin}
                switchView={switchViewWithAnimation}
                isDarkMode={isDarkMode}
                icons={{ user: <UserIcon />, lock: <LockIcon /> }}
              />
            )}

            {view === "signup" && (
              <SignupView
                alias={alias}
                setAlias={setAlias}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                adminKey={adminKey}
                setAdminKey={setAdminKey}
                showAdminKey={showAdminKey}
                setShowAdminKey={setShowAdminKey}
                acceptTerms={acceptTerms}
                setAcceptTerms={setAcceptTerms}
                isGenerating={isGenerating}
                handleGenerateAlias={handleGenerateAlias}
                isLoading={isLoading}
                handleSignup={handleSignup}
                switchView={switchViewWithAnimation}
                setShowTerms={setShowTerms}
                isDarkMode={isDarkMode}
                icons={{
                  user: <UserIcon />,
                  email: <EmailIcon />,
                  lock: <LockIcon />,
                }}
                passwordMetrics={passwordMetrics}
              />
            )}

            {view === "forgot-password" && (
              <EmailEntryView
                email={resetEmail}
                setEmail={setResetEmail}
                isLoading={isLoading}
                handleSendCode={handleSendCode}
                switchView={switchViewWithAnimation}
                isDarkMode={isDarkMode}
                icon={<EmailIcon />}
              />
            )}

            {view === "verify-code" && (
              <VerificationCodeView
                code={verificationCode}
                handleCodeChange={handleCodeChange}
                handleCodeKeyDown={handleCodeKeyDown}
                codeInputRefs={codeInputRefs}
                resendTimer={resendTimer}
                handleSendCode={handleSendCode}
                isLoading={isLoading}
                handleVerifyCode={handleVerifyCode}
                switchView={switchViewWithAnimation}
                isDarkMode={isDarkMode}
              />
            )}

            {view === "reset-password" && (
              <ResetPasswordView
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                passwordMetrics={passwordMetrics}
                isLoading={isLoading}
                handleResetPassword={handleResetPassword}
                switchView={switchViewWithAnimation}
                isDarkMode={isDarkMode}
                icons={{ lock: <LockIcon />, shield: <ShieldIcon /> }}
              />
            )}
          </div>

          {/* Footer */}
          <div
            className={`text-center pt-4 border-t ${
              isDarkMode ? "border-white/10" : "border-black/10"
            }`}
          >
            <p
              className={`text-xs ${
                isDarkMode ? "text-neutral-500" : "text-gray-500"
              }`}
            >
              Email Optional
            </p>
          </div>
        </div>
      </div>

      <LegalModals
        showTerms={showTerms}
        setShowTerms={setShowTerms}
        setAcceptTerms={setAcceptTerms}
        isDarkMode={isDarkMode}
        glassStyle={glassStyle}
      />

      {/* Custom CSS Animations and Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-8px) rotate(1deg);
          }
          66% {
            transform: translateY(4px) rotate(-0.5deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .bg-radial-gradient-1 {
          background: radial-gradient(circle at 20% 20%, rgba(59,130,246,0.08) 0%, transparent 50%);
        }

        .bg-radial-gradient-2 {
          background: radial-gradient(circle at 80% 80%, rgba(147,51,234,0.06) 0%, transparent 50%);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Enhanced focus styles for accessibility */
        .auth-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
        }
      `}</style>
    </div>
  );
};

export default Auth;
