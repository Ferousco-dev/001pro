import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { UserProfile } from "../types";
import { supabase } from "../supabaseClient";
import { DirectMessage, Conversation } from "./DirectMessages/types";
import { Icons, REACTIONS } from "./DirectMessages/Icons";
import { ConversationSidebar } from "./DirectMessages/ConversationSidebar";
import { ChatHeader, ChatWindow } from "./DirectMessages/ChatWindow";
import { NewChatModal } from "./DirectMessages/NewChatModal";
import { MessageInput } from "./DirectMessages/MessageInput";

interface DirectMessagesProps {
  currentUser: UserProfile;
  allProfiles: Record<string, UserProfile>;
  onClose: () => void;
  isDarkMode?: boolean;
  openToAlias?: string;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({
  currentUser,
  allProfiles,
  onClose,
  isDarkMode = true,
  openToAlias,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(
    new Set(),
  );
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Glass styles
  const glassStyle = {
    background: isDarkMode
      ? "rgba(10, 10, 10, 0.92)"
      : "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
  };

  const glassCardStyle = {
    background: isDarkMode
      ? "rgba(25, 25, 25, 0.6)"
      : "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
  };

  // Simulate online status (in real app, use presence)
  useEffect(() => {
    const interval = setInterval(() => {
      const online = new Set<string>();
      Object.keys(allProfiles).forEach((alias) => {
        if (Math.random() > 0.5) online.add(alias);
      });
      setOnlineUsers(online);
    }, 30000);

    // Initial random online users
    const initial = new Set<string>();
    Object.keys(allProfiles).forEach((alias) => {
      if (Math.random() > 0.5) initial.add(alias);
    });
    setOnlineUsers(initial);

    return () => clearInterval(interval);
  }, [allProfiles]);

  // Load conversations on mount + auto-open conversation if openToAlias is set
  useEffect(() => {
    loadConversations();

    if (openToAlias && openToAlias !== currentUser.alias) {
      startConversation(openToAlias);
    }

    const conversationSubscription = supabase
      .channel("conversations_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => loadConversations(),
      )
      .subscribe();

    return () => {
      conversationSubscription.unsubscribe();
    };
  }, [currentUser.alias, openToAlias]);

  // Subscribe to messages in active conversation + typing broadcast
  useEffect(() => {
    if (!activeConversation) return;

    loadMessages(activeConversation);

    const messagesSubscription = supabase
      .channel(`messages_${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          setMessages((prev) => {
            // Check if message already exists by ID
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // If it's our own message, check if there's an optimistic version already in state
            // (One with a temp ID but same content)
            if (newMsg.sender_alias === currentUser.alias) {
              const hasOptimistic = prev.some(
                (m) =>
                  m.status === "sending" &&
                  m.content === newMsg.content &&
                  m.sender_alias === newMsg.sender_alias,
              );
              if (hasOptimistic) {
                // Return prev and let sendMessage update the optimistic message with the real ID
                return prev;
              }
            }

            return [...prev, newMsg];
          });

          if (newMsg.receiver_alias === currentUser.alias) {
            markAsRead(newMsg.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const updatedMsg = payload.new as DirectMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
          );
        },
      )
      .subscribe();

    // Typing broadcast channel
    const typingChannel = supabase.channel(`typing_${activeConversation}`);
    typingChannel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload?.alias !== currentUser.alias) {
          setOtherUserTyping(true);
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, [activeConversation]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input when conversation opens
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showConversationMenu &&
        !(event.target as Element).closest(".conversation-menu")
      ) {
        setShowConversationMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showConversationMenu]);

  // Handle typing indicator with broadcast
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      if (activeConversation) {
        supabase.channel(`typing_${activeConversation}`).send({
          type: "broadcast",
          event: "typing",
          payload: { alias: currentUser.alias },
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [isTyping, activeConversation, currentUser.alias]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user_one.eq.${currentUser.alias},user_two.eq.${currentUser.alias}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const convsWithData = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsgData, error: lastMsgError } = await supabase
            .from("dm_messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Handle case where there are no messages
          const lastMsg =
            lastMsgData && lastMsgData.length > 0 ? lastMsgData[0] : null;

          const { data: unreadData, error: unreadError } = await supabase
            .from("dm_messages")
            .select("id")
            .eq("conversation_id", conv.id)
            .eq("receiver_alias", currentUser.alias)
            .eq("is_read", false);

          // Log errors but don't throw - allow conversation to load even if message queries fail
          if (lastMsgError) {
            console.warn(
              `Error loading last message for conversation ${conv.id}:`,
              lastMsgError,
            );
          }
          if (unreadError) {
            console.warn(
              `Error loading unread count for conversation ${conv.id}:`,
              unreadError,
            );
          }

          return {
            ...conv,
            lastMessage: lastMsg,
            unreadCount: unreadData?.length || 0,
            isPinned: pinnedConversations.has(conv.id),
          };
        }),
      );

      // Sort: pinned first, then by updated_at
      convsWithData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      setConversations(convsWithData);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("dm_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from("dm_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_alias", currentUser.alias)
        .eq("is_read", false);

      loadConversations();
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("dm_messages")
      .update({ is_read: true })
      .eq("id", messageId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeUserId) return;

    const content = newMessage.trim();
    const tempId = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    // Optimistic message
    const optimisticMsg: DirectMessage = {
      id: tempId,
      conversation_id: activeConversation || "",
      sender_alias: currentUser.alias,
      receiver_alias: activeUserId,
      content: content,
      is_read: false,
      created_at: now,
      status: "sending",
    };

    if (replyingTo) {
      optimisticMsg.reply_to = replyingTo.id;
    }

    // Update UI immediately
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setReplyingTo(null);

    try {
      // Find or create conversation if it doesn't exist locally yet
      let conversationId = activeConversation;
      if (!conversationId) {
        const { data: convData, error: convError } = await supabase.rpc(
          "get_or_create_conversation",
          {
            user_a: currentUser.alias,
            user_b: activeUserId,
          },
        );
        if (convError) throw convError;
        conversationId = convData;
        setActiveConversation(conversationId);
      }

      const messageData: any = {
        conversation_id: conversationId,
        sender_alias: currentUser.alias,
        receiver_alias: activeUserId,
        content: content,
        is_read: false,
      };

      if (optimisticMsg.reply_to) {
        messageData.reply_to = optimisticMsg.reply_to;
      }

      const { data: insertedData, error: msgError } = await supabase
        .from("dm_messages")
        .insert(messageData)
        .select()
        .single();

      if (msgError) throw msgError;

      // Update message status and ID in local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: insertedData.id, status: "sent" as const }
            : m,
        ),
      );

      // Other side-effects
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      await supabase.from("notifications").insert({
        user_alias: activeUserId,
        type: "dm",
        title: "New Message",
        content: `@${currentUser.alias} sent you a message`,
        from_alias: currentUser.alias,
      });

      loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      // Update status to error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "error" as const } : m,
        ),
      );
    }
  };

  const startConversation = async (userId: string) => {
    setActiveUserId(userId);
    setShowNewChat(false);

    try {
      const { data: convId, error } = await supabase.rpc(
        "get_or_create_conversation",
        {
          user_a: currentUser.alias,
          user_b: userId,
        },
      );

      if (error) throw error;

      setActiveConversation(convId);
      loadMessages(convId);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const togglePinConversation = (convId: string) => {
    setPinnedConversations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(convId)) {
        newSet.delete(convId);
      } else {
        newSet.add(convId);
      }
      return newSet;
    });
    loadConversations();
  };

  const deleteConversation = async (convId: string) => {
    if (
      !confirm(
        "Delete this conversation? Messages will be permanently removed.",
      )
    )
      return;

    try {
      await supabase.from("dm_messages").delete().eq("conversation_id", convId);
      await supabase.from("conversations").delete().eq("id", convId);

      if (activeConversation === convId) {
        setActiveConversation(null);
        setActiveUserId(null);
      }

      loadConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const addReaction = async (messageId: string, reactionId: string) => {
    // In real app, update in database
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          if (!reactions.includes(reactionId)) {
            return { ...msg, reactions: [...reactions, reactionId] };
          }
        }
        return msg;
      }),
    );
    setShowReactions(null);
  };

  const deleteMessage = async (
    messageId: string,
    mode: "for_me" | "for_everyone" = "for_everyone",
  ) => {
    if (mode === "for_everyone") {
      if (
        !confirm(
          "Delete this message for everyone? This action cannot be undone.",
        )
      )
        return;
      try {
        const { error } = await supabase
          .from("dm_messages")
          .delete()
          .eq("id", messageId);

        if (error) throw error;
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        loadConversations();
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message. Please try again.");
      }
    } else {
      // Delete for me: add current user alias to deleted_for array
      try {
        const msg = messages.find((m) => m.id === messageId);
        const deletedFor = msg?.deleted_for || [];
        const { error } = await supabase
          .from("dm_messages")
          .update({ deleted_for: [...deletedFor, currentUser.alias] })
          .eq("id", messageId);

        if (error) throw error;
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } catch (error) {
        console.error("Error deleting message for me:", error);
        alert("Failed to delete message. Please try again.");
      }
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from("dm_messages")
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: newContent,
                is_edited: true,
                edited_at: new Date().toISOString(),
              }
            : msg,
        ),
      );
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message.");
    }
  };

  const sendMediaMessage = async (url: string, type: "image" | "video") => {
    if (!activeUserId) return;

    const tempId = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    // Optimistic message
    const optimisticMsg: DirectMessage = {
      id: tempId,
      conversation_id: activeConversation || "",
      sender_alias: currentUser.alias,
      receiver_alias: activeUserId,
      content: url,
      message_type: type,
      is_read: false,
      created_at: now,
      status: "sending",
    };

    // Update UI immediately
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Find or create conversation if it doesn't exist locally yet
      let conversationId = activeConversation;
      if (!conversationId) {
        const { data: convData, error: convError } = await supabase.rpc(
          "get_or_create_conversation",
          {
            user_a: currentUser.alias,
            user_b: activeUserId,
          },
        );
        if (convError) throw convError;
        conversationId = convData;
        setActiveConversation(conversationId);
      }

      const { data: insertedData, error: msgError } = await supabase
        .from("dm_messages")
        .insert({
          conversation_id: conversationId,
          sender_alias: currentUser.alias,
          receiver_alias: activeUserId,
          content: url,
          message_type: type,
          is_read: false,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Update message status and ID in local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: insertedData.id, status: "sent" as const }
            : m,
        ),
      );

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      await supabase.from("notifications").insert({
        user_alias: activeUserId,
        type: "dm",
        title: "New Message",
        content: `@${currentUser.alias} sent you ${type === "image" ? "an image" : "a video"}`,
        from_alias: currentUser.alias,
      });

      loadConversations();
    } catch (error) {
      console.error("Error sending media message:", error);
      // Update status to error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "error" as const } : m,
        ),
      );
    }
  };

  const clearChat = async () => {
    if (!activeConversation) return;

    const messageCount = messages.length;
    if (
      !confirm(
        `Clear all ${messageCount} messages in this chat? This action cannot be undone.`,
      )
    )
      return;

    try {
      // Delete all messages in this conversation from database
      const { error } = await supabase
        .from("dm_messages")
        .delete()
        .eq("conversation_id", activeConversation);

      if (error) throw error;

      // Clear messages from local state
      setMessages([]);

      // Refresh conversations to update last message (should show no messages)
      loadConversations();
    } catch (error) {
      console.error("Error clearing chat:", error);
      alert("Failed to clear chat. Please try again.");
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatMessageContent = (content: string) => {
    // Split by spaces to get words
    const words = content.split(" ");
    const result: string[] = [];
    let currentLine = "";

    for (const word of words) {
      // If adding this word would make the line too long (more than ~17 chars or 7 words)
      if (
        (currentLine + " " + word).length > 17 ||
        currentLine.split(" ").length >= 7
      ) {
        if (currentLine.trim()) {
          result.push(currentLine.trim());
        }
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + " " + word : word;
      }
    }

    // Add the last line
    if (currentLine.trim()) {
      result.push(currentLine.trim());
    }

    return result.join("\n");
  };

  const getMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!conversationSearch) return true;
    const otherUser =
      conv.user_one === currentUser.alias ? conv.user_two : conv.user_one;
    return otherUser.toLowerCase().includes(conversationSearch.toLowerCase());
  });

  const filteredProfiles = (Object.values(allProfiles) as UserProfile[]).filter(
    (p) =>
      p.alias !== currentUser.alias &&
      p.alias.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredMessages = messages.filter((msg) => {
    // Filter out messages deleted for current user
    if (msg.deleted_for && msg.deleted_for.includes(currentUser.alias)) {
      return false;
    }
    if (!messageSearchQuery) return true;
    return msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase());
  });

  const activeProfile = activeUserId ? allProfiles[activeUserId] : null;
  const isOnline = activeUserId ? onlineUsers.has(activeUserId) : false;

  // Group messages by date
  const groupedMessages: Record<string, DirectMessage[]> =
    filteredMessages.reduce((groups, msg) => {
      const date = getMessageDate(msg.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    }, {});

  return (
    <div
      className="fixed inset-0 z-[70] animate-in fade-in duration-200"
      style={glassStyle}
    >
      <div className="h-full flex flex-col max-w-7xl mx-auto">
        {/* Header - Hide on mobile when chat is active */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b shrink-0 ${
            isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"
          } ${activeConversation ? "hidden lg:flex" : "flex"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isDarkMode ? "bg-blue-500/20" : "bg-blue-50"
              }`}
            >
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2
                className={`text-xl sm:text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Messages
              </h2>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-neutral-500" : "text-gray-500"
                }`}
              >
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""} •{" "}
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}{" "}
                unread
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              isDarkMode
                ? "hover:bg-white/[0.06] text-neutral-400 hover:text-white"
                : "hover:bg-black/[0.04] text-gray-500 hover:text-gray-900"
            }`}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          {/* Conversations List Sidebar */}
          <ConversationSidebar
            conversations={filteredConversations}
            currentUser={currentUser}
            allProfiles={allProfiles}
            onlineUsers={onlineUsers}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            setActiveUserId={setActiveUserId}
            loadMessages={loadMessages}
            pinnedConversations={pinnedConversations}
            togglePinConversation={togglePinConversation}
            deleteConversation={deleteConversation}
            isDarkMode={isDarkMode}
            conversationSearch={conversationSearch}
            setConversationSearch={setConversationSearch}
            showNewChat={showNewChat}
            setShowNewChat={setShowNewChat}
            loading={loading}
            formatMessageTime={formatMessageTime}
          />

          {/* Messages Area */}
          {activeConversation && activeProfile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatHeader
                activeProfile={activeProfile}
                isOnline={isOnline}
                otherUserTyping={otherUserTyping}
                showUserInfo={showUserInfo}
                setShowUserInfo={setShowUserInfo}
                showMessageSearch={showMessageSearch}
                setShowMessageSearch={setShowMessageSearch}
                showConversationMenu={showConversationMenu}
                setShowConversationMenu={setShowConversationMenu}
                setActiveConversation={setActiveConversation}
                setActiveUserId={setActiveUserId}
                setReplyingTo={setReplyingTo}
                clearChat={clearChat}
                isDarkMode={isDarkMode}
              />

              {/* Message Search Input */}
              {showMessageSearch && (
                <div
                  className={`p-3 border-b animate-in slide-in-from-top duration-200 ${
                    isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"
                  }`}
                >
                  <div className="relative">
                    <Icons.Search
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDarkMode ? "text-neutral-500" : "text-gray-400"
                      }`}
                    />
                    <input
                      type="text"
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      placeholder="Search in conversation..."
                      className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none ${
                        isDarkMode
                          ? "bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-800"
                          : "bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-200"
                      }`}
                      autoFocus
                    />
                    {messageSearchQuery && (
                      <span
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                          isDarkMode ? "text-neutral-500" : "text-gray-400"
                        }`}
                      >
                        {filteredMessages.length} found
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Info Panel */}
              {showUserInfo && (
                <div
                  className={`p-4 border-b animate-in slide-in-from-top duration-200 ${
                    isDarkMode
                      ? "bg-neutral-900/50 border-white/[0.06]"
                      : "bg-gray-50 border-black/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {activeProfile.alias[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        @{activeProfile.alias}
                      </h3>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-neutral-400" : "text-gray-600"
                        }`}
                      >
                        {activeProfile.role}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-neutral-500" : "text-gray-500"
                          }`}
                        >
                          {messages.length} messages in this chat
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ChatWindow
                messages={messages}
                groupedMessages={groupedMessages}
                currentUser={currentUser}
                activeProfile={activeProfile}
                isDarkMode={isDarkMode}
                messageListRef={messageListRef}
                messagesEndRef={messagesEndRef}
                formatMessageContent={formatMessageContent}
                setReplyingTo={setReplyingTo}
                showReactions={showReactions}
                setShowReactions={setShowReactions}
                addReaction={addReaction}
                deleteMessage={deleteMessage}
                editMessage={editMessage}
              />

              {otherUserTyping && (
                <div
                  className={`px-4 py-2 ${
                    isDarkMode ? "text-neutral-500" : "text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span>{activeProfile.alias} is typing...</span>
                  </div>
                </div>
              )}

              <MessageInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleTyping={handleTyping}
                sendMessage={sendMessage}
                sending={sending}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                currentUser={currentUser}
                isDarkMode={isDarkMode}
                inputRef={inputRef}
                formatMessageContent={formatMessageContent}
                onSendMedia={sendMediaMessage}
              />
            </div>
          ) : (
            // Empty State - Desktop
            <div
              className={`hidden lg:flex flex-1 items-center justify-center ${
                isDarkMode ? "bg-neutral-950" : "bg-gray-50"
              }`}
            >
              <div className="text-center max-w-sm">
                <div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
                    isDarkMode ? "bg-neutral-900" : "bg-gray-100"
                  }`}
                >
                  <Icons.MessageCircle className="w-12 h-12 text-blue-500" />
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Your Messages
                </h3>
                <p
                  className={`text-sm mb-6 ${
                    isDarkMode ? "text-neutral-500" : "text-gray-500"
                  }`}
                >
                  Send private messages to other users. Conversations are
                  end-to-end encrypted.
                </p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  Start a Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
