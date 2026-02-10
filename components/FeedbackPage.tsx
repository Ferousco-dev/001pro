import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { UserProfile } from "../types";
import { uploadToCatbox } from "../utils/catboxService";

interface FeedbackPageProps {
  currentUser?: UserProfile | null;
  isDarkMode?: boolean;
  onClose?: () => void;
}

const SUBJECTS = ["Bug", "Suggestion", "Complaint", "Other"] as const;

const FeedbackPage: React.FC<FeedbackPageProps> = ({
  currentUser,
  isDarkMode = true,
  onClose,
}) => {
  const [subject, setSubject] = useState<string>("Bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported for screenshots.");
      return;
    }

    setUploading(true);
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      const url = await uploadToCatbox(file);
      setImageUrl(url);
    } catch (err) {
      console.error("Screenshot upload failed:", err);
      setError("Failed to upload screenshot. Please try again.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("feedback").insert({
        user_alias: currentUser?.alias || null,
        subject,
        message: message.trim(),
        email: email.trim() || null,
        image_url: imageUrl || null,
        is_read: false,
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const bg = isDarkMode ? "bg-black" : "bg-gray-50";
  const cardBg = isDarkMode
    ? "bg-neutral-900/60 border-white/[0.06]"
    : "bg-white border-gray-200";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-neutral-400" : "text-gray-500";
  const inputBg = isDarkMode
    ? "bg-neutral-800 text-white border-neutral-700 placeholder-neutral-500 focus:border-blue-500"
    : "bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400 focus:border-blue-500";

  if (submitted) {
    return (
      <div
        className={`min-h-screen ${bg} flex items-center justify-center p-4`}
      >
        <div
          className={`max-w-md w-full rounded-3xl border p-8 text-center ${cardBg}`}
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>
            Thank You!
          </h2>
          <p className={`text-sm mb-6 ${textSecondary}`}>
            Your feedback has been submitted successfully. We'll review it
            shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setMessage("");
              setEmail("");
              setImageUrl(null);
              setImagePreview(null);
              setSubject("Bug");
            }}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Submit Another
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`mt-3 px-6 py-3 rounded-2xl font-medium transition-colors block mx-auto ${
                isDarkMode
                  ? "text-neutral-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} p-4 sm:p-6`}>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode
                  ? "hover:bg-white/[0.06] text-neutral-400"
                  : "hover:bg-black/[0.04] text-gray-500"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>
              Send Feedback
            </h1>
            <p className={`text-sm ${textSecondary}`}>
              Help us improve your experience
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            className={`rounded-3xl border p-6 space-y-5 ${cardBg}`}
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Subject */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Subject
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      subject === s
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : isDarkMode
                          ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s === "Bug" && "🐛 "}
                    {s === "Suggestion" && "💡 "}
                    {s === "Complaint" && "⚠️ "}
                    {s === "Other" && "📝 "}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your feedback in detail..."
                rows={5}
                className={`w-full px-4 py-3 rounded-2xl text-sm outline-none border transition-colors resize-none ${inputBg}`}
              />
            </div>

            {/* Email */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Email{" "}
                <span
                  className={`text-xs font-normal normal-case ${textSecondary}`}
                >
                  (optional)
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 rounded-2xl text-sm outline-none border transition-colors ${inputBg}`}
              />
            </div>

            {/* Screenshot */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}
              >
                Screenshot{" "}
                <span
                  className={`text-xs font-normal normal-case ${textSecondary}`}
                >
                  (optional)
                </span>
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Screenshot preview"
                    className="max-w-full max-h-48 rounded-2xl object-cover border border-white/10"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-lg hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <label
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                    isDarkMode
                      ? "border-neutral-700 hover:border-neutral-600 text-neutral-500"
                      : "border-gray-300 hover:border-gray-400 text-gray-400"
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">Click to upload a screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || uploading || !message.trim()}
              className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                submitting || uploading || !message.trim()
                  ? isDarkMode
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
