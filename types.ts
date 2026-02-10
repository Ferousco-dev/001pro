export type UserRole = "USER" | "ADMIN";

// types.ts
export interface UserProfile {
  alias: string;
  password?: string;
  email?: string;
  bio?: string;
  status?: string;
  avatar_url?: string;
  cover_url?: string;
  coverUrl?: string;
  avatarUrl?: string; // Keep for backwards compatibility
  followers?: string[];
  following?: string[];
  role?: string;
  joinedAt?: string;
  totalTransmissions?: number;
  reputation?: number;
  isWeeklyTop?: boolean;

  is_verified?: boolean;
  is_admin?: boolean;
  is_banned?: boolean;
  totalLikesReceived?: number;
  profile_image?: string; // URL from IMGBB
  full_name?: string; // User's full name
}

// For updates

export type UserProfileUpdate = Partial<UserProfile>;

export type GroupMemberRole = "admin" | "member";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string; // Alias of the user
  role: GroupMemberRole;
  joined_at: Date;
}

export type MessageType = "text" | "image" | "video";

export interface Message {
  id: string;
  senderAlias: string;
  senderRole: UserRole;
  content: string;
  timestamp: Date;
  type: MessageType;
  tags?: string[];
  replyToId?: string;
  groupId?: string;
  reactions?: Record<string, string[]>; // emoji: [aliases]
  readBy?: string[]; // aliases
  isFlagged?: boolean;
  likes?: string[];
}

export interface GroupChat {
  id: string;
  name: string;
  description: string;
  image?: string;
  created_by: string;
  created_at: Date;
  admins: string[]; // Aliases
  members: string[]; // Aliases
  settings?: {
    whoCanSendMessage: "all" | "admins";
    whoCanEditGroupInfo: "all" | "admins";
  };
}

export interface Comment {
  id: string;
  authorAlias: string;
  content: string;
  timestamp: Date;
  likes: string[];
  replies?: Comment[];
  mentionedUsers?: string[]; // Array of mentioned user aliases
}

export interface SocialPost {
  id: string;
  authorAlias: string;
  content: string;
  timestamp: Date;
  likes: string[];
  comments: Comment[];
  background?: string;
  fileUrl?: string;
  views?: string[]; // Array of user aliases who viewed the post
  repostOf?: string; // ID of original post if this is a repost
  repostCount?: number; // Number of times this post was reposted
  mediaUrls?: string[]; // Array of media URLs for multiple images/videos
  mentionedUsers?: string[]; // Array of mentioned user aliases
  viewCount?: number; // Number of views
  isDraft?: boolean; // Whether this is a draft
  categories?: string[]; // Category names for the post (stored as strings)
  reactions?: PostReaction[]; // Reactions beyond likes (stored as JSONB)
  bookmarks?: string[]; // User aliases who bookmarked (stored as array)
  externalLink?: string; // Link to an external website
  isOfficial?: boolean; // Whether this is an official system post
  poll?: PollData; // Poll details
}

export interface PollData {
  question: string;
  options: {
    text: string;
    votes: number;
  }[];
  totalVotes: number;
  endsAt?: Date; // Optional expiry
}

// New types for enhanced features
export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface PostReaction {
  id: string;
  postId: string;
  userAlias: string;
  reactionType: string; // 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
  emoji: string; // The actual emoji character
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  postId: string;
  userAlias: string;
  createdAt: Date;
}

export interface Draft {
  id: string;
  userAlias: string;
  content?: string;
  background?: string;
  mediaUrls?: string[]; // Array of image URLs from imgbb
  categoryIds?: string[]; // Array of category IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Mention {
  id: string;
  postId?: string;
  commentId?: string;
  mentionedUserAlias: string;
  mentionedByAlias: string;
  mentionType: "post" | "comment";
  createdAt: Date;
}

// Reaction types and their emojis
export const REACTION_TYPES = {
  like: { emoji: "👍", label: "Like" },
  love: { emoji: "❤️", label: "Love" },
  laugh: { emoji: "😂", label: "Laugh" },
  wow: { emoji: "😮", label: "Wow" },
  sad: { emoji: "😢", label: "Sad" },
  angry: { emoji: "😡", label: "Angry" },
} as const;

export type ReactionType = keyof typeof REACTION_TYPES;

export interface AppSettings {
  adminPin: string;
  announcement: string;
  donationTarget: number;
  donationCurrent: number;
  accountName: string;
  accountNumber: string;
  maintenanceMode?: boolean;
  verifiedOnlyMode?: boolean;
  // Flag to enable Claude Haiku 4.5 for all clients (optional)
  claudeHaiku45Enabled?: boolean;
}

export interface AdminActivityLog {
  id: string;
  adminAlias: string;
  targetAlias: string;
  action: "BAN" | "UNBAN" | "VERIFY" | "UNVERIFY" | "PROMOTE" | "DEMOTE";
  details?: string;
  timestamp: Date;
}

export interface SystemLog {
  id: string;
  event: string;
  timestamp: Date;
  type: "INFO" | "SECURITY" | "TRANSMISSION";
}

// AnonymousPost is now deprecated - use SocialPost instead
export type AnonymousPost = SocialPost;

// In types.ts or wherever UserProfile is defined
