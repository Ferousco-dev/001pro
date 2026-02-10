import React from "react";

interface ComposerProps {
  showTextComposer: boolean;
  setShowTextComposer: (show: boolean) => void;
  showImageComposer: boolean;
  setShowImageComposer: (show: boolean) => void;
  postInput: string;
  setPostInput: (input: string) => void;
  postBackground: string | null;
  setPostBackground: (bg: string | null) => void;
  BG_PRESETS: string[];
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  filePreview: string | null;
  setFilePreview: (preview: string | null) => void;
  uploadProgress: number;
  isUploading: boolean;
  handleCreatePost: () => void;
  isDarkMode: boolean;
  glassModalStyle: React.CSSProperties;
  showPollComposer: boolean;
  setShowPollComposer: (show: boolean) => void;
  pollQuestion: string;
  setPollQuestion: (q: string) => void;
  pollOptions: string[];
  setPollOptions: (opts: string[]) => void;
}

export const Composer: React.FC<ComposerProps> = ({
  showTextComposer,
  setShowTextComposer,
  showImageComposer,
  setShowImageComposer,
  postInput,
  setPostInput,
  postBackground,
  setPostBackground,
  BG_PRESETS,
  selectedFile,
  setSelectedFile,
  filePreview,
  setFilePreview,
  uploadProgress,
  isUploading,
  handleCreatePost,
  isDarkMode,
  glassModalStyle,
  showPollComposer,
  setShowPollComposer,
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
}) => {
  if (!showTextComposer && !showImageComposer && !showPollComposer) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!isUploading) {
            setShowTextComposer(false);
            setShowImageComposer(false);
            setShowPollComposer(false);
          }
        }}
      />

      {/* Modal */}
      <div
        style={glassModalStyle}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {showImageComposer
                ? "Share Media"
                : showPollComposer
                  ? "New Poll"
                  : "New Transmission"}
            </h2>
            <button
              onClick={() => {
                setShowTextComposer(false);
                setShowImageComposer(false);
                setShowPollComposer(false);
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Background Selector (Text Only) */}
          {showTextComposer && !selectedFile && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setPostBackground(null)}
                className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all ${
                  postBackground === null
                    ? "border-blue-500 scale-110"
                    : "border-white/10"
                } bg-neutral-800`}
              />
              {BG_PRESETS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setPostBackground(bg)}
                  className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all ${
                    postBackground === bg
                      ? "border-blue-500 scale-110"
                      : "border-transparent"
                  } ${bg}`}
                />
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            className={`relative rounded-2xl overflow-hidden mb-4 ${postBackground || "bg-white/5"}`}
          >
            <textarea
              value={postInput}
              onChange={(e) => setPostInput(e.target.value)}
              placeholder={
                showImageComposer ? "Add a caption..." : "What's happening?"
              }
              className={`w-full min-h-[160px] p-4 bg-transparent outline-none resize-none text-lg font-medium placeholder-white/40 ${
                postBackground
                  ? "text-white text-center flex items-center justify-center"
                  : "text-white"
              }`}
              autoFocus
            />
          </div>

          {/* Image Preview */}
          {filePreview && (
            <div className="relative rounded-2xl overflow-hidden mb-4 bg-black/20 aspect-video">
              <img
                src={filePreview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Poll Composer UI */}
          {showPollComposer && (
            <div className="mb-6 space-y-3">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors placeholder-white/40"
                autoFocus
              />

              <div className="space-y-2">
                {pollOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[idx] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-colors placeholder-white/30 text-sm"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => {
                          setPollOptions(
                            pollOptions.filter((_, i) => i !== idx),
                          );
                        }}
                        className="p-2 text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium px-2 py-1"
                >
                  + Add Option
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <label className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setFilePreview(URL.createObjectURL(file));
                    }
                  }}
                />
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`text-xs font-medium ${postInput.length > 250 ? "text-red-400" : "text-white/40"}`}
              >
                {postInput.length}/280
              </span>
              <button
                onClick={handleCreatePost}
                disabled={isUploading || (!postInput.trim() && !selectedFile)}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                  isUploading || (!postInput.trim() && !selectedFile)
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{uploadProgress}%</span>
                  </div>
                ) : (
                  "Transmit"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
