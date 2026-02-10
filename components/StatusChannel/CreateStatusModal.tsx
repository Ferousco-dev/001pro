import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  SparklesIcon,
  TypeIcon,
  ImageIcon,
  XIcon,
  CameraIcon,
  SendIcon,
} from "./Icons";

interface CreateStatusModalProps {
  userAlias: string;
  isDarkMode: boolean;
  onClose: () => void;
  onStatusCreated: () => void;
}

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  userAlias,
  isDarkMode,
  onClose,
  onStatusCreated,
}) => {
  const [statusType, setStatusType] = useState<"text" | "image">("text");
  const [textContent, setTextContent] = useState("");
  const [bgColor, setBgColor] = useState("#4F46E5"); // Default indigo
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    "#4F46E5", // Indigo
    "#EC4899", // Pink
    "#8B5CF6", // Purple
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Green
    "#3B82F6", // Blue
    "#06B6D4", // Cyan
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      // Using ImgBB API (you'll need to add your API key to .env)
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY || "your_imgbb_api_key"}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      if (data.success) {
        return data.data.url;
      }
      return null;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (statusType === "text" && !textContent.trim()) {
      alert("Please enter some text for your status");
      return;
    }

    if (statusType === "image" && !imageFile) {
      alert("Please select an image");
      return;
    }

    setIsSubmitting(true);

    try {
      let content_url = null;

      if (statusType === "image" && imageFile) {
        content_url = await uploadImage(imageFile);
        if (!content_url) {
          alert("Failed to upload image. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      const { error } = await supabase.from("statuses").insert({
        user_alias: userAlias,
        content_url: content_url,
        text_content: statusType === "text" ? textContent.trim() : null,
        bg_color: statusType === "text" ? bgColor : null,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      onStatusCreated();
      onClose();
    } catch (error) {
      console.error("Error creating status:", error);
      alert("Failed to create status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <SparklesIcon size={20} className="inline mr-2" />
              Create Status
            </h3>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Type selector */}
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setStatusType("text")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                statusType === "text"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <TypeIcon size={18} className="inline mr-1" />
              Text
            </button>
            <button
              onClick={() => setStatusType("image")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                statusType === "image"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ImageIcon size={18} className="inline mr-1" />
              Image
            </button>
          </div>

          {/* Text status */}
          {statusType === "text" && (
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Your Status
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={200}
                  className={`w-full h-32 px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? "bg-gray-800 text-white placeholder-gray-500"
                      : "bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`}
                />
                <p
                  className={`text-xs mt-1 text-right ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {textContent.length}/200
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Background Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={`w-10 h-10 rounded-full transition-transform ${
                        bgColor === color
                          ? "ring-4 ring-blue-500 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Image status */}
          {statusType === "image" && (
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Upload Image
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              ) : (
                <label
                  className={`block w-full h-64 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    isDarkMode
                      ? "border-gray-700 hover:border-gray-600 bg-gray-800"
                      : "border-gray-300 hover:border-gray-400 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <CameraIcon
                      size={48}
                      className={isDarkMode ? "text-gray-400" : "text-gray-500"}
                    />
                    <span
                      className={`text-sm mt-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Click to upload image
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              } text-white`}
            >
              {isSubmitting ? (
                "Posting..."
              ) : (
                <>
                  Post Status <SendIcon size={18} className="inline ml-1" />
                </>
              )}
            </button>
          </div>
          <p
            className={`text-xs text-center mt-3 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Status will be visible for 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};
