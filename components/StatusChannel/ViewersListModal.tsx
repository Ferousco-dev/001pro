import React from "react";
import { StatusView } from "../../types/statusChannelTypes";
import { EyeIcon, XIcon } from "./Icons";

interface ViewersListModalProps {
  viewers: StatusView[];
  isDarkMode: boolean;
  onClose: () => void;
}

export const ViewersListModal: React.FC<ViewersListModalProps> = ({
  viewers,
  isDarkMode,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`max-w-md w-full mx-4 rounded-2xl shadow-xl max-h-[80vh] overflow-hidden ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <EyeIcon
                size={24}
                className={isDarkMode ? "text-white" : "text-gray-900"}
              />{" "}
              Viewed by {viewers.length}
            </h3>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {/* Viewers list */}
        <div className="overflow-y-auto max-h-[60vh]">
          {viewers.length === 0 ? (
            <div
              className={`p-8 text-center ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <p>No views yet</p>
            </div>
          ) : (
            <div className="p-2">
              {viewers.map((view) => (
                <div
                  key={view.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {view.viewer_alias[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      @{view.viewer_alias}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {new Date(view.viewed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
