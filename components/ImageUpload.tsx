import React, { useState, useRef } from "react";

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  onCancel: () => void;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onCancel,
  maxSizeMB = 5,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setLoading(false);
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Image must be less than ${maxSizeMB}MB`);
      setLoading(false);
      return;
    }

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;

        // Compress if needed
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const maxWidth = 1920;
          const maxHeight = 1920;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height / width) * maxWidth;
              width = maxWidth;
            } else {
              width = (width / height) * maxHeight;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setPreview(compressed);
          setLoading(false);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process image");
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onImageSelect(preview);
      setPreview(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-white">Upload Image</h3>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center"
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
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-600/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold">
            {error}
          </div>
        )}

        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-3xl p-12 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950/80"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold">Processing image...</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-slate-400 font-bold mb-2">
                  Click to select an image
                </p>
                <p className="text-slate-600 text-xs">
                  Max {maxSizeMB}MB • JPG, PNG, GIF
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-slate-800">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain bg-slate-950"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPreview(null);
                  setError(null);
                }}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
              >
                Change
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
              >
                Upload
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
