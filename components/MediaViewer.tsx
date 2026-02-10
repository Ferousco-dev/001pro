import React from "react";

interface MediaViewerProps {
  mediaUrls: string[];
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ mediaUrls, onClose }) => {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-60"
      >
        Close
      </button>
      <div className="max-w-4xl max-h-full w-full overflow-hidden">
        {mediaUrls.map((u, idx) => (
          <div key={u + idx} className="mb-4">
            {u.includes(".mp4") || u.includes("video") ? (
              <video
                src={u}
                controls
                className="w-full max-h-[86vh] object-contain"
              />
            ) : (
              <img
                src={u}
                alt={`media-${idx}`}
                className="w-full max-h-[86vh] object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaViewer;
