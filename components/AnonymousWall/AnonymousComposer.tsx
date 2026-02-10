import React from "react";
import { Category, Draft, UserProfile } from "../../types";
import { IconClose, IconImage, IconDraft } from "./Icons";

interface AnonymousComposerProps {
  isDarkMode: boolean;
  user: UserProfile;
  showTextComposer: boolean;
  closeComposer: () => void;
  postInput: string;
  setPostInput: (v: string) => void;
  handleCreatePost: () => void;
  handleSaveDraft: () => void;
  uploadedImages: string[];
  removeUploadedImage: (index: number) => void;
  selectedBackground: string;
  setSelectedBackground: (v: string) => void;
  BACKGROUND_OPTIONS: { id: string; label: string; gradient: string }[];
  categories: Category[];
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImages: boolean;
  drafts: Draft[];
  showDrafts: boolean;
  setShowDrafts: (v: boolean) => void;
  handleLoadDraft: (draft: Draft) => void;
  handleDeleteDraft: (id: string) => void;
  currentDraft: Draft | null;
  sheetTranslateY: number;
  handleDragStart: (e: React.TouchEvent | React.MouseEvent) => void;
  composerRef: React.RefObject<HTMLDivElement>;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
}

export const AnonymousComposer: React.FC<AnonymousComposerProps> = ({
  isDarkMode,
  user,
  showTextComposer,
  closeComposer,
  postInput,
  setPostInput,
  handleCreatePost,
  handleSaveDraft,
  uploadedImages,
  removeUploadedImage,
  selectedBackground,
  setSelectedBackground,
  BACKGROUND_OPTIONS,
  categories,
  selectedCategories,
  toggleCategory,
  fileInputRef,
  handleImageUpload,
  isUploadingImages,
  drafts,
  showDrafts,
  setShowDrafts,
  handleLoadDraft,
  handleDeleteDraft,
  currentDraft,
  sheetTranslateY,
  handleDragStart,
  composerRef,
  textAreaRef,
}) => {
  if (!showTextComposer) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${
          isDarkMode ? "bg-black/80" : "bg-black/40"
        } backdrop-blur-[2px]`}
        onClick={closeComposer}
      />

      {/* Bottom Sheet */}
      <div
        ref={composerRef}
        className={`fixed bottom-0 left-0 right-0 z-50 ${
          isDarkMode ? "bg-black" : "bg-white"
        } rounded-t-3xl max-h-[85vh] overflow-hidden transition-transform duration-300 ease-out`}
        style={{ transform: `translateY(${sheetTranslateY}px)` }}
      >
        {/* Drag Handle */}
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-10 h-1 bg-gray-500/50 rounded-full mx-auto my-3" />
        </div>

        <div
          className="px-3 pb-6 overflow-y-auto"
          style={{ maxHeight: "calc(85vh - 40px)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-[10px]">
                ?
              </div>
              <h3 className="text-sm font-bold">Post Anonymously</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={!postInput.trim() && uploadedImages.length === 0}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-full font-bold text-[10px] transition-colors disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={handleCreatePost}
                disabled={
                  (!postInput.trim() && uploadedImages.length === 0) ||
                  isUploadingImages
                }
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white px-4 py-1.5 rounded-full font-bold text-[10px] transition-colors disabled:cursor-not-allowed"
              >
                Post
              </button>
              <button
                onClick={closeComposer}
                className={`p-1 rounded ${
                  isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <IconClose />
              </button>
            </div>
          </div>

          {currentDraft && (
            <div
              className={`mb-2 p-2 rounded-lg text-[10px] ${
                isDarkMode
                  ? "bg-blue-950/30 border border-blue-800/50 text-blue-400"
                  : "bg-blue-50 border border-blue-200 text-blue-600"
              }`}
            >
              📝 Loaded from draft
            </div>
          )}

          <textarea
            ref={textAreaRef}
            value={postInput}
            onChange={(e) => setPostInput(e.target.value)}
            placeholder="Share your thoughts anonymously..."
            className={`w-full min-h-20 ${
              isDarkMode ? "bg-transparent text-white" : "bg-white text-black"
            } border-none resize-none outline-none text-sm`}
            maxLength={500}
            autoFocus
          />

          {uploadedImages.length > 0 && (
            <div className="mt-2">
              <div className="grid grid-cols-4 gap-1">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeUploadedImage(index)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Background Options */}
          <div className="mb-2 mt-3">
            <p
              className={`text-[10px] font-medium mb-1.5 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Background
            </p>
            <div className="grid grid-cols-7 gap-1">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg.gradient)}
                  className={`relative h-7 rounded-lg transition-all ${
                    bg.gradient || (isDarkMode ? "bg-black" : "bg-gray-100")
                  } ${
                    selectedBackground === bg.gradient
                      ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-gray-900 scale-105"
                      : "hover:scale-105"
                  }`}
                >
                  {bg.id === "" && (
                    <span
                      className={`text-[8px] ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      ×
                    </span>
                  )}
                  {selectedBackground === bg.gradient && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-2 h-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mb-2">
              <p
                className={`text-[10px] font-medium mb-1.5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                      selectedCategories.includes(category.id)
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20 scale-105"
                        : isDarkMode
                          ? "bg-black border-white/10 text-gray-400 hover:border-purple-500/50"
                          : "bg-gray-100 border-gray-200 text-gray-600 hover:border-purple-500/50"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Media Upload */}
          <div className="mb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages || uploadedImages.length >= 4}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  isUploadingImages || uploadedImages.length >= 4
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <IconImage />
                {isUploadingImages
                  ? "..."
                  : `Images (${uploadedImages.length}/4)`}
              </button>

              {drafts.length > 0 && (
                <button
                  onClick={() => setShowDrafts(!showDrafts)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <IconDraft />
                  Drafts ({drafts.length})
                </button>
              )}
            </div>
          </div>

          {showDrafts && drafts.length > 0 && (
            <div
              className={`mb-2 p-2 rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`flex items-center justify-between p-1.5 rounded ${
                      isDarkMode ? "bg-gray-700" : "bg-white"
                    }`}
                  >
                    <p className="text-[10px] truncate flex-1">
                      {draft.content ||
                        `${draft.mediaUrls?.length || 0} images`}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleLoadDraft(draft)}
                        className="px-1.5 py-0.5 text-[9px] bg-purple-500 text-white rounded"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-1.5 py-0.5 text-[9px] bg-red-500 text-white rounded"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={`${
              isDarkMode ? "bg-purple-950/30" : "bg-purple-50"
            } rounded-lg p-2 mb-2`}
          >
            <p
              className={`text-[10px] ${
                isDarkMode ? "text-purple-400" : "text-purple-600"
              }`}
            >
              Your identity is completely hidden.
            </p>
          </div>

          <div className="flex items-center">
            <span
              className={`text-[10px] ${
                isDarkMode ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {postInput.length}/500
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
