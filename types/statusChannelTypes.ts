import React from "react";

export interface Status {
  id: string;
  user_id?: string;
  user_alias: string;
  content_url?: string;
  text_content?: string;
  bg_color?: string;
  created_at: Date;
  expires_at: Date;
  // Interaction tracking
  views?: StatusView[];
  likes?: StatusLike[];
  comments?: StatusComment[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_alias: string;
  viewed_at: Date;
}

export interface StatusLike {
  id: string;
  status_id: string;
  liker_alias: string;
  liked_at: Date;
}

export interface StatusComment {
  id: string;
  status_id: string;
  commenter_alias: string;
  content: string;
  created_at: Date;
}

export interface Channel {
  id: string;
  name: string;
  avatar_url?: string;
  owner_alias: string;
  description?: string;
  created_at: Date;
}

export interface ChannelPost {
  id: string;
  channel_id: string;
  content: string;
  media_url?: string;
  created_at: Date;
}

export interface ChannelFollower {
  id: string;
  channel_id: string;
  user_alias: string;
  followed_at: Date;
}
