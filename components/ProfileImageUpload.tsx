import React, { useState, useRef } from "react";
import { compressImage } from "../utils/imgbbService";
import { uploadToCatbox } from "../utils/catboxService";

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageUploaded: (url: string) => void;
  isEditing: boolean;
  alias: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  onImageUploaded,
  isEditing,
  alias,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = preview || currentImage;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setIsUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file (JPG, PNG)");
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size must be less than 5MB");
      }

      // Create local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Compress image
      const compressedBase64 = await compressImage(file, 800, 0.8);

      // Upload to Catbox
      const imageUrl = await uploadToCatbox(compressedBase64);

      if (imageUrl) {
        onImageUploaded(imageUrl);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
      setPreview(null); // Revert preview on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative group">
      {/* Profile Image Container */}
      <div
        onClick={handleClick}
        className={`
          relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 
          rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl 
          flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20
          ${isEditing ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}
        `}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={`${alias}'s profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white uppercase">
              {alias.charAt(0)}
            </span>
          </div>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Edit Overlay (only when editing and not uploading) */}
        {isEditing && !isUploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              className="w-8 h-8 text-white drop-shadow-md"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      {isEditing && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 text-center">
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded shadow-sm">
            {error}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
