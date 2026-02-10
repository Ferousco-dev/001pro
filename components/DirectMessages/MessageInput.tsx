import React, { useRef, useState } from "react";
import { UserProfile } from "../../types";
import { DirectMessage } from "./types";
import { Icons } from "./Icons";
import { uploadToCatbox } from "../../utils/catboxService";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (val: string) => void;
  handleTyping: () => void;
  sendMessage: () => void;
  sending: boolean;
  replyingTo: DirectMessage | null;
  setReplyingTo: (msg: DirectMessage | null) => void;
  currentUser: UserProfile;
  isDarkMode: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  formatMessageContent: (content: string) => React.ReactNode;
  onSendMedia?: (url: string, type: "image" | "video") => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleTyping,
  sendMessage,
  sending,
  replyingTo,
  setReplyingTo,
  currentUser,
  isDarkMode,
  inputRef,
  formatMessageContent,
  onSendMedia,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video">("image");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Only images and videos are supported.");
      return;
    }

    // Show preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setPreviewType(isImage ? "image" : "video");

    // Upload to Catbox
    setUploading(true);
    setUploadProgress("Uploading...");
    try {
      const catboxUrl = await uploadToCatbox(file);
      setUploadProgress("");
      setUploading(false);

      if (onSendMedia) {
        onSendMedia(catboxUrl, isImage ? "image" : "video");
      }
      setPreviewUrl(null);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadProgress("Upload failed. Try again.");
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    setUploading(false);
    setUploadProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="shrink-0">
      {/* Reply Preview */}
      {replyingTo && (
        <div
          className={`p-3 border-t flex items-center gap-3 ${
            isDarkMode
              ? "bg-neutral-900/50 border-white/[0.06]"
              : "bg-gray-50 border-black/[0.06]"
          }`}
        >
          <div className={`w-1 h-10 rounded-full bg-blue-500`} />
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            >
              Replying to{" "}
              {replyingTo.sender_alias === currentUser.alias
                ? "yourself"
                : `@${replyingTo.sender_alias}`}
            </p>
            <p
              className={`text-sm truncate ${isDarkMode ? "text-neutral-400" : "text-gray-600"}`}
            >
              {formatMessageContent(replyingTo.content)}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-neutral-800 text-neutral-400"
                : "hover:bg-gray-200 text-gray-500"
            }`}
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Media Preview */}
      {previewUrl && (
        <div
          className={`p-3 border-t flex items-center gap-3 ${
            isDarkMode
              ? "bg-neutral-900/50 border-white/[0.06]"
              : "bg-gray-50 border-black/[0.06]"
          }`}
        >
          <div className="relative">
            {previewType === "image" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-medium ${isDarkMode ? "text-neutral-300" : "text-gray-700"}`}
            >
              {uploading ? "Uploading media..." : "Ready to send"}
            </p>
            {uploadProgress && (
              <p
                className={`text-[10px] ${uploadProgress.includes("fail") ? "text-red-400" : "text-neutral-500"}`}
              >
                {uploadProgress}
              </p>
            )}
          </div>
          {!uploading && (
            <button
              onClick={cancelPreview}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-neutral-800 text-neutral-400"
                  : "hover:bg-gray-200 text-gray-500"
              }`}
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Message Input */}
      <div
        className={`p-3 sm:p-4 border-t ${
          isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"
        }`}
      >
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
              isDarkMode
                ? "hover:bg-white/[0.06] text-neutral-400"
                : "hover:bg-black/[0.04] text-gray-500"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Icons.Attachment />
          </button>

          {/* Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className={`w-full px-4 py-3 rounded-2xl text-sm outline-none transition-colors ${
                isDarkMode
                  ? "bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-800 focus:border-blue-500"
                  : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500 shadow-sm"
              }`}
            />
          </div>

          {/* Emoji Button */}
          <button
            className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
              isDarkMode
                ? "hover:bg-white/[0.06] text-neutral-400"
                : "hover:bg-black/[0.04] text-gray-500"
            }`}
          >
            <Icons.Smile />
          </button>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-xl transition-all flex-shrink-0 ${
              newMessage.trim() && !sending
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95"
                : isDarkMode
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Icons.Send />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
