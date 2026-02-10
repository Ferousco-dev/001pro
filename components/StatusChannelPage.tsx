import React, { useState, useEffect } from "react";
import {
  Status as StatusType,
  Channel,
  ChannelPost,
} from "../types/statusChannelTypes";
import { UserProfile } from "../types";
import { supabase } from "../supabaseClient";
import { StatusCircle } from "./StatusChannel/StatusCircle";
import { StatusViewer } from "./StatusChannel/StatusViewer";
import { ChannelCard } from "./StatusChannel/ChannelCard";
import { CreateStatusModal } from "./StatusChannel/CreateStatusModal";
import { CameraIcon, PlusIcon, RadioIcon } from "./StatusChannel/Icons";

interface StatusChannelPageProps {
  user: UserProfile | null;
  isDarkMode: boolean;
  statuses?: any[];
  channels?: any[];
}

export const StatusChannelPage: React.FC<StatusChannelPageProps> = ({
  user,
  isDarkMode,
  statuses: initialStatuses = [],
  channels: initialChannels = [],
}) => {
  const [statuses, setStatuses] = useState<StatusType[]>(
    initialStatuses as StatusType[],
  );
  const [channels, setChannels] = useState<Channel[]>(
    initialChannels as Channel[],
  );
  const [channelPosts, setChannelPosts] = useState<
    Record<string, ChannelPost[]>
  >({});
  const [followedChannels, setFollowedChannels] = useState<string[]>([]);

  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [selectedStatusUserAlias, setSelectedStatusUserAlias] = useState<
    string | null
  >(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showCreateStatus, setShowCreateStatus] = useState(false);

  // Sync statuses from props
  useEffect(() => {
    if (initialStatuses.length > 0) {
      setStatuses(
        initialStatuses.filter(
          (s) => new Date(s.expires_at) > new Date(),
        ) as StatusType[],
      );
    }
  }, [initialStatuses]);

  // Sync channels from props
  useEffect(() => {
    if (initialChannels.length > 0) {
      setChannels(initialChannels as Channel[]);
    }
  }, [initialChannels]);

  // Load followed channels
  useEffect(() => {
    if (!user) return;

    const loadFollowedChannels = async () => {
      const { data, error } = await supabase
        .from("channel_followers")
        .select("channel_id")
        .eq("user_alias", user.alias);

      if (!error && data) {
        setFollowedChannels(data.map((f) => f.channel_id));
      }
    };

    loadFollowedChannels();
  }, [user]);

  // Load interaction data for statuses
  useEffect(() => {
    const loadInteractions = async () => {
      if (statuses.length === 0) return;

      try {
        const statusIds = statuses.map((s) => s.id);

        // Fetch all interactions in parallel
        const results = (await Promise.all([
          // 1. Fetch MY views to determine seen status
          user
            ? supabase
                .from("status_views")
                .select("status_id, viewer_alias")
                .eq("viewer_alias", user.alias)
                .in("status_id", statusIds)
            : Promise.resolve({ data: [] as any[] }),

          // 2. Fetch all views just for counting
          supabase
            .from("status_views")
            .select("status_id")
            .in("status_id", statusIds),

          supabase
            .from("status_likes")
            .select("status_id")
            .in("status_id", statusIds),

          supabase
            .from("status_comments")
            .select("status_id")
            .in("status_id", statusIds),
        ])) as any[];

        const [myViewsData, viewsCountData, likesData, commentsData] = results;

        // Count interactions per status
        const viewCounts: Record<string, number> = {};
        const likeCounts: Record<string, number> = {};
        const commentCounts: Record<string, number> = {};

        // Map my views
        const myViewsMap: Record<string, any[]> = {};
        (myViewsData as any).data?.forEach((v: any) => {
          if (!myViewsMap[v.status_id]) myViewsMap[v.status_id] = [];
          myViewsMap[v.status_id].push(v);
        });

        viewsCountData.data?.forEach((v: any) => {
          viewCounts[v.status_id] = (viewCounts[v.status_id] || 0) + 1;
        });

        likesData.data?.forEach((l) => {
          likeCounts[l.status_id] = (likeCounts[l.status_id] || 0) + 1;
        });

        commentsData.data?.forEach((c) => {
          commentCounts[c.status_id] = (commentCounts[c.status_id] || 0) + 1;
        });

        // Update statuses with counts AND my views
        setStatuses((prev) =>
          prev.map((s) => ({
            ...s,
            // Attach my view if exists (preserves existing views if any, but usually we just want to know if I saw it)
            views: myViewsMap[s.id] || [],
            viewCount: viewCounts[s.id] || 0,
            likeCount: likeCounts[s.id] || 0,
            commentCount: commentCounts[s.id] || 0,
          })),
        );
      } catch (error) {
        console.error("Error loading interaction data:", error);
      }
    };

    loadInteractions();
  }, [statuses.length, user?.alias]); // Add user.alias dependency

  const getUserStatuses = (userAlias: string) => {
    return statuses.filter((s) => s.user_alias === userAlias);
  };

  const handleStatusCreated = async () => {
    // Refresh statuses from database
    try {
      const { data } = await supabase
        .from("statuses")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (data) {
        setStatuses(
          data.map((s) => ({
            ...s,
            created_at: new Date(s.created_at),
            expires_at: new Date(s.expires_at),
          })),
        );
      }
    } catch (error) {
      console.error("Error refreshing statuses:", error);
    }
  };

  const handleFollowChannel = async (channelId: string) => {
    if (!user) return;

    const { error } = await supabase.from("channel_followers").insert({
      channel_id: channelId,
      user_alias: user.alias,
    });

    if (!error) {
      setFollowedChannels((prev) => [...prev, channelId]);
    }
  };

  const handleUnfollowChannel = async (channelId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("channel_followers")
      .delete()
      .eq("channel_id", channelId)
      .eq("user_alias", user.alias);

    if (!error) {
      setFollowedChannels((prev: string[]) =>
        prev.filter((id) => id !== channelId),
      );
    }
  };

  const handleStatusViewed = (statusId: string) => {
    if (!user) return;
    setStatuses((prev) =>
      prev.map((s) => {
        if (s.id === statusId) {
          // Check if already viewed to avoid duplicate objects
          const alreadyViewed = s.views?.some(
            (v) => v.viewer_alias === user.alias,
          );
          if (alreadyViewed) return s;

          return {
            ...s,
            views: [
              ...(s.views || []),
              {
                id: "temp-" + Date.now(),
                status_id: statusId,
                viewer_alias: user.alias,
                viewed_at: new Date(),
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  // Group statuses by user
  const groupedStatuses = statuses.reduce(
    (acc, status) => {
      if (!status.user_alias) return acc;
      if (!acc[status.user_alias]) {
        acc[status.user_alias] = [];
      }
      acc[status.user_alias].push(status);
      return acc;
    },
    {} as Record<string, StatusType[]>,
  );

  // Convert to array and sort
  const groupedStatusList = Object.entries(groupedStatuses)
    .map(([alias, userStatuses]) => {
      // Sort statuses by date (oldest first for viewing)
      const sorted = [...userStatuses].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      // Determine if there are unseen statuses
      const hasUnseen = sorted.some(
        (s) => !s.views?.some((v) => v.viewer_alias === user?.alias),
      );

      // Get latest timestamp for sorting users
      const latestTimestamp = Math.max(
        ...sorted.map((s) => new Date(s.created_at).getTime()),
      );

      return {
        userAlias: alias,
        statuses: sorted,
        hasUnseen,
        latestTimestamp,
      };
    })
    .sort((a, b) => {
      // Sort priority:
      // 1. Users with unseen statuses first
      // 2. Then by latest status timestamp
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return b.latestTimestamp - a.latestTimestamp;
    });

  return (
    <div className="space-y-8 p-4">
      {/* Status Section */}
      <section>
        <h2
          className={`text-2xl font-bold mb-4 flex items-center gap-2 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          <CameraIcon size={28} /> Stories
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-4 px-1">
          {/* Add status button - Always visible */}
          {user && (
            <button
              onClick={() => setShowCreateStatus(true)}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-2xl shrink-0 transition-all hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-600"
                  : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300"
              } border-2 ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
            >
              <PlusIcon size={28} />
            </button>
          )}

          {/* Status circles */}
          {groupedStatusList.length > 0 ? (
            groupedStatusList.map((group) => (
              <StatusCircle
                key={group.userAlias}
                statuses={group.statuses}
                userAlias={group.userAlias}
                currentUserAlias={user?.alias || null}
                onClick={() => {
                  setSelectedStatusUserAlias(group.userAlias);
                  setShowStatusViewer(true);
                }}
                isDarkMode={isDarkMode}
              />
            ))
          ) : (
            <div
              className={`flex-1 text-center py-8 rounded-lg ${
                isDarkMode
                  ? "bg-gray-900/50 text-gray-400"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <p>No stories available yet.</p>
              <p className="text-sm mt-1">Post your first status!</p>
            </div>
          )}
        </div>
      </section>

      {/* Channels Section */}
      <section>
        <h2
          className={`text-2xl font-bold mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          📢 Channels
        </h2>

        {channels.length === 0 ? (
          <div
            className={`text-center py-8 rounded-lg ${
              isDarkMode
                ? "bg-gray-900 text-gray-400"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <p>No channels available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {channels.map((channel) => {
              if (!channel || !channel.id) return null;
              return (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isFollowing={followedChannels.includes(channel.id)}
                  onFollow={() => handleFollowChannel(channel.id)}
                  onUnfollow={() => handleUnfollowChannel(channel.id)}
                  onClick={() => setSelectedChannel(channel)}
                  isDarkMode={isDarkMode}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Status Viewer Modal */}
      {showStatusViewer && selectedStatusUserAlias && (
        <StatusViewer
          statuses={getUserStatuses(selectedStatusUserAlias) || []}
          currentUserAlias={user?.alias || null}
          isDarkMode={isDarkMode}
          onClose={() => setShowStatusViewer(false)}
          onStatusViewed={handleStatusViewed}
        />
      )}

      {/* Create Status Modal */}
      {showCreateStatus && user && (
        <CreateStatusModal
          userAlias={user.alias}
          isDarkMode={isDarkMode}
          onClose={() => setShowCreateStatus(false)}
          onStatusCreated={handleStatusCreated}
        />
      )}
    </div>
  );
};

export default StatusChannelPage;
