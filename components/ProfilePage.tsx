import React, { useState, useRef } from "react";
import { UserProfile, SocialPost } from "../types";
import { PostCard } from "./HomePage/PostCard";
import UserListModal from "./UserListModal";
import ProfileImageUpload from "./ProfileImageUpload";

interface UserProfileUpdate {
  alias: string;
  password: string;
  bio: string;
  status: string;
  website?: string;
  location?: string;
  full_name?: string;
  profile_image?: string;
}

interface ProfilePageProps {
  profile: Partial<UserProfile>;
  viewerAlias: string;
  posts?: SocialPost[];
  onFollow: (alias: string) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onOpenDM?: (alias: string) => void;
  onDeletePost?: (postId: string) => void;
  onAliasClick?: (alias: string) => void;
  onNavigate?: (view: string) => void;
  onLikePost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onRepostPost?: (postId: string) => void;
  onSharePost?: (post: SocialPost) => void;
  isDarkMode?: boolean;
  allProfiles?: Record<string, UserProfile>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  viewerAlias,
  posts = [],
  onFollow,
  onUpdateProfile,
  onOpenDM,
  onDeletePost,
  onAliasClick,
  onNavigate,
  onLikePost = () => {},
  onAddComment = () => {},
  onRepostPost = () => {},
  onSharePost = () => {},
  isDarkMode = true,
  allProfiles = {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfileUpdate>({
    alias: profile.alias || "",
    password: "",
    bio: profile.bio || "",
    status: profile.status || "",
    website: profile.website || "",
    location: profile.location || "",
    full_name: profile.full_name || "",
    profile_image: profile.profile_image || "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // PostCard state
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<
    Record<string, number>
  >({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const contentRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isOwnProfile = profile.alias === viewerAlias;
  const isFollowing = profile.followers?.includes(viewerAlias) || false;
  const userPosts = posts.filter((p) => p.authorAlias === profile.alias);

  // Glass styles
  const glassStyle = {
    background: isDarkMode
      ? "rgba(0, 0, 0, 0.72)"
      : "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.08)"
      : "1px solid rgba(0, 0, 0, 0.06)",
  };

  const glassCardStyle = {
    background: isDarkMode
      ? "rgba(0, 0, 0, 0.65)"
      : "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.06)"
      : "1px solid rgba(0, 0, 0, 0.04)",
  };

  // PostCard handlers
  const handleImageError = (postId: string, imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(`${postId}-${imageUrl}`));
  };

  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleImageUploaded = (url: string) => {
    setEditData((prev) => ({ ...prev, profile_image: url }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<UserProfile> = {};
      if (editData.bio !== profile.bio) updates.bio = editData.bio;
      if (editData.status !== profile.status) updates.status = editData.status;
      if (editData.password) updates.password = editData.password;
      if (editData.full_name !== profile.full_name)
        updates.full_name = editData.full_name;
      if (editData.profile_image !== profile.profile_image)
        updates.profile_image = editData.profile_image;

      console.log("💾 ProfilePage: handleSave updates:", updates);
      await onUpdateProfile(updates);
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setMessageType("success");
      console.log("✅ ProfilePage: onUpdateProfile succeeded");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Save failed:", error);
      setMessage("Failed to save profile");
      setMessageType("error");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatJoinDate = (date: any) => {
    if (!date) return "Member";
    const d = new Date(date);
    return `Joined ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  };

  return (
    <div
      ref={contentRef}
      className={`min-h-screen ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div
          style={glassCardStyle}
          className="rounded-[32px] overflow-hidden mb-8 shadow-2xl"
        >
          <div className="relative h-24 sm:h-32 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
            <div className="absolute inset-0 backdrop-blur-3xl" />
          </div>

          <div className="px-6 sm:px-10 pb-8 -mt-12 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:justify-between">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                <div className="relative group">
                  <ProfileImageUpload
                    currentImage={
                      isEditing ? editData.profile_image : profile.profile_image
                    }
                    onImageUploaded={handleImageUploaded}
                    isEditing={isEditing}
                    alias={profile.alias || ""}
                  />
                </div>

                <div className="text-center sm:text-left space-y-2">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                      @{profile.alias}
                    </h1>
                    {profile.isVerified && (
                      <span className="text-blue-500 text-xl font-bold">✓</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-500">
                      {profile.role}
                    </span>
                    <span className="text-xs font-medium text-neutral-500">
                      •
                    </span>
                    <span className="text-xs font-medium text-neutral-500">
                      {formatJoinDate(profile.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isOwnProfile ? (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : isEditing
                        ? "Done"
                        : "Edit Profile"}
                  </button>
                ) : (
                  <button
                    onClick={() => onFollow(profile.alias!)}
                    className={`flex-1 sm:flex-none px-8 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg ${
                      isFollowing
                        ? "bg-neutral-800 text-neutral-400 hover:text-red-400"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}

                {onOpenDM && !isOwnProfile && (
                  <button
                    onClick={() => onOpenDM(profile.alias!)}
                    style={glassStyle}
                    className="p-2.5 rounded-2xl hover:scale-110 transition-transform active:scale-95"
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
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {(profile.bio || isEditing) && (
              <div className="mt-8">
                {isEditing ? (
                  <textarea
                    value={editData.bio}
                    onChange={(e) =>
                      setEditData({ ...editData, bio: e.target.value })
                    }
                    placeholder="Tell us something about yourself..."
                    className="w-full p-4 rounded-2xl bg-black/20 border border-white/10 text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                ) : (
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-6 border-t border-white/5 pt-6">
              <button
                onClick={() => setShowFollowers(true)}
                className="group flex flex-col items-start"
              >
                <span className="text-lg font-black">
                  {profile.followers?.length || 0}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-blue-500 transition-colors">
                  Followers
                </span>
              </button>
              <button
                onClick={() => setShowFollowing(true)}
                className="group flex flex-col items-start"
              >
                <span className="text-lg font-black">
                  {profile.following?.length || 0}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-blue-500 transition-colors">
                  Following
                </span>
              </button>
              <div className="flex flex-col items-start">
                <span className="text-lg font-black">{userPosts.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Posts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-neutral-500">
              Latest Posts
            </h3>
          </div>

          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
                )
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={allProfiles[viewerAlias] || (profile as any)}
                    profiles={allProfiles}
                    isDarkMode={isDarkMode}
                    glassStyle={glassStyle}
                    glassCardStyle={glassCardStyle}
                    onAliasClick={onAliasClick || (() => {})}
                    onLikePost={onLikePost}
                    onAddComment={onAddComment}
                    onDeletePost={onDeletePost}
                    handleRepost={onRepostPost}
                    handleShare={onSharePost}
                    setShowAnalyticsModal={() => {}}
                    toggleComments={toggleComments}
                    showComments={showComments}
                    commentInputs={commentInputs}
                    setCommentInputs={setCommentInputs}
                    currentImageIndex={currentImageIndex}
                    setCurrentImageIndex={setCurrentImageIndex}
                    failedImages={failedImages}
                    handleImageError={handleImageError}
                    postRefs={postRefs}
                  />
                ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-neutral-800 rounded-[32px]">
              <div className="text-4xl mb-4">🛸</div>
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                No posts detected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showFollowers && (
        <UserListModal
          title="Followers"
          userAliases={profile.followers || []}
          allProfiles={allProfiles}
          currentUserAlias={viewerAlias}
          onClose={() => setShowFollowers(false)}
          onAliasClick={onAliasClick || (() => {})}
          onFollow={onFollow}
          isDarkMode={isDarkMode}
        />
      )}
      {showFollowing && (
        <UserListModal
          title="Following"
          userAliases={profile.following || []}
          allProfiles={allProfiles}
          currentUserAlias={viewerAlias}
          onClose={() => setShowFollowing(false)}
          onAliasClick={onAliasClick || (() => {})}
          onFollow={onFollow}
          isDarkMode={isDarkMode}
        />
      )}

      {message && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm ${messageType === "success" ? "bg-blue-600 text-white" : "bg-red-600 text-white"} animate-in slide-in-from-top`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
