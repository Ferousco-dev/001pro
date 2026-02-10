export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_alias: string;
  receiver_alias: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to?: string;
  reactions?: string[];
  attachment_url?: string;
  attachment_type?: string;
  message_type?: "text" | "image" | "video";
  is_edited?: boolean;
  edited_at?: string;
  deleted_for?: string[];
  status?: "sending" | "sent" | "error";
}

export interface Conversation {
  id: string;
  user_one: string;
  user_two: string;
  created_at: string;
  updated_at: string;
  lastMessage?: DirectMessage;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
}
