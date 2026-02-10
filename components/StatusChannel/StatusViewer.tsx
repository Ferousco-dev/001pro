import React, { useState, useEffect } from "react";
import {
  Status,
  StatusView,
  StatusLike,
  StatusComment,
} from "../../types/statusChannelTypes";
import { supabase } from "../../supabaseClient";
import { ViewersListModal } from "./ViewersListModal";
import { StatusCommentsModal } from "./StatusCommentsModal";
import { HeartIcon, MessageCircleIcon, EyeIcon, XIcon } from "./Icons";

interface StatusViewerProps {
  statuses: Status[];
  currentUserAlias: string | null;
  isDarkMode: boolean;
  onClose: () => void;
  onStatusViewed?: (statusId: string) => void;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({
  statuses,
  currentUserAlias,
  isDarkMode,
  onClose,
  onStatusViewed,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewersList, setShowViewersList] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Interaction states
  const [statusViews, setStatusViews] = useState<Record<string, StatusView[]>>(
    {},
  );
  const [statusLikes, setStatusLikes] = useState<Record<string, StatusLike[]>>(
    {},
  );
  const [statusComments, setStatusComments] = useState<
    Record<string, StatusComment[]>
  >({});
  const [hasViewedStatus, setHasViewedStatus] = useState<
    Record<string, boolean>
  >({});

  const currentStatus =
    statuses && statuses.length > 0 ? statuses[currentIndex] : null;

  const isOwner =
    currentStatus && currentUserAlias === currentStatus.user_alias;
  const currentStatusId = currentStatus?.id;

  // Check if current user has liked this status
  const hasLiked =
    currentStatusId && statusLikes[currentStatusId]
      ? statusLikes[currentStatusId].some(
          (like) => like.liker_alias === currentUserAlias,
        )
      : false;

  // Load interactions for current status
  useEffect(() => {
    if (!currentStatus) return;

    const loadInteractions = async () => {
      try {
        // Load views
        const { data: viewsData } = await supabase
          .from("status_views")
          .select("*")
          .eq("status_id", currentStatus.id);

        // Load likes
        const { data: likesData } = await supabase
          .from("status_likes")
          .select("*")
          .eq("status_id", currentStatus.id);

        // Load comments
        const { data: commentsData } = await supabase
          .from("status_comments")
          .select("*")
          .eq("status_id", currentStatus.id)
          .order("created_at", { ascending: true });

        if (viewsData) {
          setStatusViews((prev) => ({
            ...prev,
            [currentStatus.id]: viewsData.map((v) => ({
              ...v,
              viewed_at: new Date(v.viewed_at),
            })),
          }));
        }

        if (likesData) {
          setStatusLikes((prev) => ({
            ...prev,
            [currentStatus.id]: likesData.map((l) => ({
              ...l,
              liked_at: new Date(l.liked_at),
            })),
          }));
        }

        if (commentsData) {
          setStatusComments((prev) => ({
            ...prev,
            [currentStatus.id]: commentsData.map((c) => ({
              ...c,
              created_at: new Date(c.created_at),
            })),
          }));
        }
      } catch (error) {
        console.error("Error loading interactions:", error);
      }
    };

    loadInteractions();
  }, [currentStatus?.id]);

  // Track view when status is displayed
  useEffect(() => {
    if (
      !currentStatus ||
      !currentUserAlias ||
      hasViewedStatus[currentStatus.id]
    )
      return;

    const trackView = async () => {
      try {
        const { error } = await supabase.from("status_views").upsert(
          {
            status_id: currentStatus.id,
            viewer_alias: currentUserAlias,
            viewed_at: new Date(),
          },
          { onConflict: "status_id,viewer_alias", ignoreDuplicates: true },
        );

        if (!error) {
          setHasViewedStatus((prev) => ({ ...prev, [currentStatus.id]: true }));

          // Add to local state
          const newView: StatusView = {
            id: Math.random().toString(),
            status_id: currentStatus.id,
            viewer_alias: currentUserAlias,
            viewed_at: new Date(),
          };

          setStatusViews((prev) => ({
            ...prev,
            [currentStatus.id]: [...(prev[currentStatus.id] || []), newView],
          }));
          // Notify parent to update ring
          if (onStatusViewed) {
            onStatusViewed(currentStatus.id);
          }
        }
      } catch (error) {
        // Ignore duplicate key errors (already viewed)
        console.debug("View already tracked");
      }
    };

    // Track view after 1 second to ensure it's actually viewed
    const timer = setTimeout(trackView, 1000);
    return () => clearTimeout(timer);
  }, [currentStatus?.id, currentUserAlias, hasViewedStatus, onStatusViewed]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentStatusId) return;

    const channel = supabase
      .channel(`status_interactions:${currentStatusId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "status_likes",
          filter: `status_id=eq.${currentStatusId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLike = payload.new as StatusLike;
            // Avoid duplicate if we added it optimistically
            setStatusLikes((prev) => {
              const currentLikes = prev[currentStatusId] || [];
              if (
                currentLikes.some((l) => l.liker_alias === newLike.liker_alias)
              )
                return prev;
              return {
                ...prev,
                [currentStatusId]: [
                  ...currentLikes,
                  { ...newLike, liked_at: new Date(newLike.liked_at) },
                ],
              };
            });
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as StatusLike;
            if (oldLike.id) {
              setStatusLikes((prev) => ({
                ...prev,
                [currentStatusId]: (prev[currentStatusId] || []).filter(
                  (l) => l.id !== oldLike.id,
                ),
              }));
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "status_comments",
          filter: `status_id=eq.${currentStatusId}`,
        },
        (payload) => {
          const newComment = payload.new as StatusComment;
          setStatusComments((prev) => {
            const currentComments = prev[currentStatusId] || [];
            if (currentComments.some((c) => c.id === newComment.id))
              return prev;
            return {
              ...prev,
              [currentStatusId]: [
                ...currentComments,
                { ...newComment, created_at: new Date(newComment.created_at) },
              ],
            };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStatusId]);

  // Auto-advance progress
  useEffect(() => {
    if (!currentStatus) return;

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 2));
    }, 50);

    return () => clearInterval(interval);
  }, [currentStatus]);

  // Handle progress completion
  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < statuses.length - 1) {
        setCurrentIndex((i) => i + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [progress, currentIndex, statuses.length, onClose]);

  const goNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleLike = async () => {
    if (!currentUserAlias || !currentStatusId) return;

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from("status_likes")
          .delete()
          .eq("status_id", currentStatusId)
          .eq("liker_alias", currentUserAlias);

        setStatusLikes((prev) => ({
          ...prev,
          [currentStatusId]: (prev[currentStatusId] || []).filter(
            (like) => like.liker_alias !== currentUserAlias,
          ),
        }));
      } else {
        // Like
        const { data } = await supabase
          .from("status_likes")
          .insert({
            status_id: currentStatusId,
            liker_alias: currentUserAlias,
          })
          .select()
          .single();

        if (data) {
          const newLike: StatusLike = {
            ...data,
            liked_at: new Date(data.liked_at),
          };

          setStatusLikes((prev) => ({
            ...prev,
            [currentStatusId]: [...(prev[currentStatusId] || []), newLike],
          }));
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleCommentAdded = (comment: StatusComment) => {
    if (!currentStatusId) return;
    setStatusComments((prev) => ({
      ...prev,
      [currentStatusId]: [...(prev[currentStatusId] || []), comment],
    }));
  };

  const handleCommentDeleted = (commentId: string) => {
    if (!currentStatusId) return;
    setStatusComments((prev) => ({
      ...prev,
      [currentStatusId]: (prev[currentStatusId] || []).filter(
        (c) => c.id !== commentId,
      ),
    }));
  };

  if (!currentStatus) return null;

  const viewersCount = statusViews[currentStatus.id]?.length || 0;
  const likesCount = statusLikes[currentStatus.id]?.length || 0;
  const commentsCount = statusComments[currentStatus.id]?.length || 0;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 ${
          isDarkMode ? "bg-black" : "bg-white"
        } flex flex-col`}
      >
        {/* Progress bars */}
        <div className="flex gap-1 p-2">
          {statuses.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-gray-300"
              }`}
            >
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width:
                    idx === currentIndex
                      ? `${progress}%`
                      : idx < currentIndex
                        ? "100%"
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {currentStatus.content_url ? (
            <img
              src={currentStatus.content_url}
              alt="Status"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-6"
              style={{ backgroundColor: currentStatus.bg_color || "#000" }}
            >
              <p
                className={`text-2xl font-bold text-center ${
                  isDarkMode ? "text-white" : "text-white"
                }`}
              >
                {currentStatus.text_content}
              </p>
            </div>
          )}

          {/* User info at top */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-white">
              {currentStatus.user_alias[0].toUpperCase()}
            </div>
            <div>
              <span className="text-white font-semibold drop-shadow-lg">
                @{currentStatus.user_alias}
              </span>
              <p className="text-white/70 text-xs drop-shadow">
                {new Date(currentStatus.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Interaction stats - Bottom left */}
          {isOwner && viewersCount > 0 && (
            <button
              onClick={() => setShowViewersList(true)}
              className="absolute bottom-20 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm hover:bg-black/70 transition-colors"
            >
              <EyeIcon size={16} className="inline" />{" "}
              <span className="font-semibold">{viewersCount}</span>
            </button>
          )}

          {/* Interactive buttons - Bottom right */}
          <div className="absolute bottom-20 right-4 flex flex-col gap-3">
            {/* Like button */}
            {currentUserAlias && (
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                  <HeartIcon
                    size={28}
                    filled={hasLiked}
                    className={hasLiked ? "text-red-500" : "text-white"}
                  />
                </div>
                {likesCount > 0 && (
                  <span className="text-white text-sm font-semibold drop-shadow">
                    {likesCount}
                  </span>
                )}
              </button>
            )}

            {/* Comment button */}
            {currentUserAlias && (
              <button
                onClick={() => setShowComments(true)}
                className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                  <MessageCircleIcon size={28} className="text-white" />
                </div>
                {commentsCount > 0 && (
                  <span className="text-white text-sm font-semibold drop-shadow">
                    {commentsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Navigation areas */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
            onClick={goPrev}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
            onClick={goNext}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 z-10 transition-colors"
        >
          <XIcon size={24} className="text-white" />
        </button>
      </div>

      {/* Modals */}
      {showViewersList && isOwner && (
        <ViewersListModal
          viewers={statusViews[currentStatus.id] || []}
          isDarkMode={isDarkMode}
          onClose={() => setShowViewersList(false)}
        />
      )}

      {showComments && currentStatusId && (
        <StatusCommentsModal
          statusId={currentStatusId}
          comments={statusComments[currentStatusId] || []}
          currentUserAlias={currentUserAlias}
          isDarkMode={isDarkMode}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </>
  );
};
