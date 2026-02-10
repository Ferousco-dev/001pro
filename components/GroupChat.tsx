import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  GroupChat,
  UserProfile,
  Message,
  GroupMemberRole,
  MessageType,
} from "../types";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

interface GroupChatProps {
  user: UserProfile;
  groups: GroupChat[];
  messages: Message[];
  onSendMessage: (text: string, groupId: string) => void;
  onCreateGroup: (
    name: string,
    description: string,
    isPrivate?: boolean,
    icon?: string,
  ) => void;
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onKickMember: (groupId: string, memberAlias: string) => void;
  onPromoteMember: (
    groupId: string,
    memberAlias: string,
    role: GroupMemberRole,
  ) => void;
  onDeleteMessage: (messageId: string, groupId: string) => void;
  onUpdateGroupInfo: (groupId: string, updates: Partial<GroupChat>) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onAliasClick: (alias: string) => void;
  onLikeMessage?: (messageId: string) => void;
  isDarkMode?: boolean;
}

const GROUP_ICONS = [
  "🚀",
  "💬",
  "🎮",
  "🎵",
  "📚",
  "💡",
  "🔥",
  "⚡",
  "🌟",
  "💎",
  "🎯",
  "🏆",
  "🌈",
  "🎨",
  "🤖",
  "👾",
];
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🙌", "💯"];

// SVG Icons
const Icons = {
  Plus: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className="w-5 h-5"
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Info: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <path
        d="M12 16v-4M12 8h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ChevronLeft: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className="w-5 h-5"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Reply: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="w-4 h-4"
    >
      <path
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Smile: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <path
        d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clip: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="w-5 h-5"
    >
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.82-2.82l8.49-8.48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Link: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="w-5 h-5"
    >
      <path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className="w-4 h-4"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Camera: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
};

const GroupChatContainer: React.FC<GroupChatProps> = ({
  user,
  groups,
  messages,
  onSendMessage,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onKickMember,
  onPromoteMember,
  onDeleteMessage,
  onUpdateGroupInfo,
  onReactToMessage,
  onAliasClick,
  onLikeMessage,
  isDarkMode = true,
}) => {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupIcon, setNewGroupIcon] = useState("🚀");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId),
    [groups, activeGroupId],
  );
  const userInGroup = useMemo(
    () => activeGroup?.members?.includes(user.alias),
    [activeGroup, user.alias],
  );
  const isAdmin = useMemo(
    () => activeGroup?.admins?.includes(user.alias) || user.role === "ADMIN",
    [activeGroup, user.alias, user.role],
  );

  const groupMessages = useMemo(() => {
    return messages
      .filter((m) => m.groupId === activeGroupId)
      .filter((m) =>
        messageSearch
          ? m.content?.toLowerCase().includes(messageSearch.toLowerCase())
          : true,
      );
  }, [messages, activeGroupId, messageSearch]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      scrollToBottom();
    }
  }, [groupMessages, activeGroupId, scrollToBottom]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroupId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("fileToUpload", file);
    formData.append("reqtype", "fileupload");

    try {
      // Catbox blocks direct uploads from localhost due to CORS
      // Implementing a warning and fallback
      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      if (response.ok) {
        const url = await response.text();
        onSendMessage(url, activeGroupId);
      } else {
        throw new Error("CORS or Server Error");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        "Catbox upload blocked by CORS on localhost. Please use the URL input fallback (link icon).",
      );
      setShowMediaInput(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateIcon = (icon: string) => {
    if (activeGroupId && isAdmin) {
      onUpdateGroupInfo(activeGroupId, { image: icon });
    }
  };

  const toggleLock = () => {
    if (activeGroupId && isAdmin) {
      const newWhoCanSend =
        activeGroup?.settings?.whoCanSendMessage === "all" ? "admins" : "all";
      onUpdateGroupInfo(activeGroupId, {
        settings: {
          ...activeGroup?.settings,
          whoCanSendMessage: newWhoCanSend as any,
          whoCanEditGroupInfo:
            activeGroup?.settings?.whoCanEditGroupInfo || "admins",
        },
      });
    }
  };

  return (
    <div
      className={`flex flex-col h-[600px] sm:h-[700px] max-h-[85vh] rounded-[32px] overflow-hidden border transition-all duration-500 shadow-2xl ${isDarkMode ? "bg-neutral-950 border-white/5 shadow-black" : "bg-white border-black/5 shadow-neutral-200"}`}
    >
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <div
          className={`w-full sm:w-80 flex flex-col border-r shrink-0 ${isDarkMode ? "border-white/5" : "border-black/5"} ${activeGroupId ? "hidden sm:flex" : "flex h-full"}`}
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-extrabold text-2xl tracking-tighter uppercase italic">
              Clusters
            </h2>
            <button
              onClick={() => setIsCreating(true)}
              className="w-10 h-10 bg-blue-500 rounded-2xl hover:bg-blue-600 transition-all active:scale-90 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white"
            >
              <Icons.Plus />
            </button>
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-5 py-3 rounded-2xl text-xs font-bold outline-none transition-all ${isDarkMode ? "bg-white/5 focus:bg-white/10" : "bg-black/5 focus:bg-black/10"}`}
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
            {groups
              .filter((g) =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((group) => (
                <div
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`p-4 mb-2 flex items-center gap-4 cursor-pointer transition-all rounded-[24px] group ${activeGroupId === group.id ? (isDarkMode ? "bg-blue-500/10" : "bg-blue-50") : isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xl transition-transform group-hover:scale-110 font-bold ${activeGroupId === group.id ? "bg-blue-500 text-white" : "bg-neutral-900 border border-white/5 text-neutral-500"}`}
                  >
                    {group.image || <Icons.Plus />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-black tracking-tight truncate text-sm uppercase ${activeGroupId === group.id ? "text-blue-500" : ""}`}
                    >
                      {group.name}
                    </h3>
                    <p className="text-[10px] text-neutral-500 truncate font-bold mt-1 uppercase tracking-widest">
                      {group.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-neutral-900/10 ${!activeGroupId ? "hidden sm:flex items-center justify-center" : "flex h-full"}`}
        >
          {activeGroupId && activeGroup ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveGroupId(null)}
                    className="sm:hidden p-2 text-neutral-500 hover:text-white transition-colors"
                  >
                    <Icons.ChevronLeft />
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-2xl">
                    {activeGroup.image || "👥"}
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight uppercase">
                      {activeGroup.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                        {activeGroup.members.length} nodes active
                      </p>
                      {activeGroup.settings?.whoCanSendMessage === "admins" && (
                        <span className="text-[8px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-black">
                          LOCKED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowGroupInfo(true)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all active:rotate-90 text-neutral-400 hover:text-white"
                >
                  <Icons.Info />
                </button>
              </div>

              {/* Messages Container - Fixed Scrolling */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {groupMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.senderAlias === user.alias ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-baseline gap-3 mb-2 px-1">
                      <span
                        className="text-[10px] font-black text-neutral-500 hover:text-blue-500 cursor-pointer transition-colors uppercase tracking-widest"
                        onClick={() => onAliasClick(msg.senderAlias)}
                      >
                        @{msg.senderAlias}
                      </span>
                      <span className="text-[9px] text-neutral-700 font-bold uppercase">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`relative group max-w-[85%] p-4 rounded-[28px] shadow-2xl border ${msg.senderAlias === user.alias ? "bg-blue-600 border-blue-500 text-white rounded-tr-none" : isDarkMode ? "bg-neutral-800 border-neutral-700 text-white rounded-tl-none" : "bg-gray-100 border-gray-200 text-black rounded-tl-none"}`}
                    >
                      {msg.type === "image" ? (
                        <div className="animate-in fade-in duration-500">
                          <img
                            src={msg.content}
                            alt="Media"
                            className="rounded-2xl max-w-full cursor-pointer hover:scale-[1.02] transition-transform shadow-xl"
                            onClick={() => window.open(msg.content, "_blank")}
                          />
                        </div>
                      ) : msg.type === "video" ? (
                        <video
                          src={msg.content}
                          controls
                          className="rounded-2xl max-w-full shadow-xl"
                        />
                      ) : (
                        <p className="text-[13px] font-medium whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      )}

                      {/* Reactions */}
                      {msg.reactions &&
                        Object.keys(msg.reactions).length > 0 && (
                          <div
                            className={`flex flex-wrap gap-2 mt-3 ${msg.senderAlias === user.alias ? "justify-end" : "justify-start"}`}
                          >
                            {Object.entries(msg.reactions).map(
                              ([emoji, aliases]) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    onReactToMessage(msg.id, emoji)
                                  }
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${Array.isArray(aliases) && aliases.includes(user.alias) ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-neutral-500 hover:border-white/20"}`}
                                >
                                  <span>{emoji}</span>
                                  <span>
                                    {Array.isArray(aliases)
                                      ? aliases.length
                                      : 0}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        )}

                      {/* Actions */}
                      <div
                        className={`absolute top-0 ${msg.senderAlias === user.alias ? "right-full mr-3" : "left-full ml-3"} opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2`}
                      >
                        <button
                          onClick={() => setReplyTo(msg)}
                          className="p-2.5 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white bg-black/20 backdrop-blur-sm shadow-xl transition-all active:scale-90"
                          title="Reply"
                        >
                          <Icons.Reply />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowEmojiPicker(
                                showEmojiPicker === msg.id ? null : msg.id,
                              )
                            }
                            className={`p-2.5 hover:bg-white/5 rounded-xl bg-black/20 backdrop-blur-sm shadow-xl transition-all active:scale-90 ${showEmojiPicker === msg.id ? "text-blue-500" : "text-neutral-400 hover:text-white"}`}
                            title="React"
                          >
                            <Icons.Smile />
                          </button>
                          {showEmojiPicker === msg.id && (
                            <div className="absolute bottom-full mb-3 bg-neutral-900 border border-white/10 p-2 rounded-[24px] flex gap-2 shadow-2xl z-30 animate-in zoom-in-95 backdrop-blur-2xl">
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    onReactToMessage(msg.id, emoji);
                                    setShowEmojiPicker(null);
                                  }}
                                  className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125 text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {(isAdmin || msg.senderAlias === user.alias) && (
                          <button
                            onClick={() =>
                              onDeleteMessage(msg.id, activeGroupId)
                            }
                            className="p-2.5 hover:bg-red-500/20 text-red-500 rounded-xl bg-black/20 backdrop-blur-sm shadow-xl transition-all active:scale-90"
                            title="Delete"
                          >
                            <Icons.Trash />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="pb-2" />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-white/5 space-y-4 bg-black/40 backdrop-blur-xl shrink-0">
                {activeGroup.settings?.whoCanSendMessage === "admins" &&
                !isAdmin ? (
                  <div className="text-center py-4 text-[9px] text-neutral-600 font-black tracking-[0.3em] uppercase bg-white/5 rounded-3xl border border-white/5 animate-pulse italic">
                    Node Encryption Active • Admins Only Transmission Permitted
                  </div>
                ) : !userInGroup ? (
                  <div className="flex flex-col items-center gap-4 py-8 bg-blue-500/5 rounded-[32px] border border-blue-500/10 animate-in fade-in duration-500">
                    <p className="text-[10px] text-blue-500/60 font-black tracking-[0.3em] uppercase italic">
                      Connection Restricted • Synchronize with cluster to
                      transmit
                    </p>
                    <button
                      onClick={() => onJoinGroup(activeGroupId)}
                      className="px-8 py-3 bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 shadow-xl shadow-blue-500/20 active:scale-95 transition-all italic"
                    >
                      JOIN CLUSTER
                    </button>
                  </div>
                ) : (
                  <>
                    {replyTo && (
                      <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-[24px] text-[10px] border border-blue-500/20 animate-in slide-in-from-bottom-4 shadow-inner">
                        <div className="truncate flex-1 flex items-center gap-3">
                          <span className="text-blue-500 font-black uppercase tracking-tighter">
                            THREADING: @{replyTo.senderAlias}
                          </span>
                          <span className="text-neutral-500 truncate font-bold italic">
                            {replyTo.content}
                          </span>
                        </div>
                        <button
                          onClick={() => setReplyTo(null)}
                          className="ml-3 p-1.5 hover:bg-white/10 rounded-full text-neutral-500 transition-colors"
                        >
                          <Icons.Close />
                        </button>
                      </div>
                    )}

                    {showMediaInput && (
                      <div className="flex gap-2 animate-in slide-in-from-bottom-2">
                        <input
                          type="text"
                          placeholder="Paste media URL (Catbox, etc)..."
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          className="flex-1 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold outline-none font-mono"
                        />
                        <button
                          onClick={() => {
                            if (mediaUrl.trim()) {
                              onSendMessage(mediaUrl.trim(), activeGroupId);
                              setMediaUrl("");
                              setShowMediaInput(false);
                            }
                          }}
                          className="px-6 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase"
                        >
                          PUSH
                        </button>
                        <button
                          onClick={() => setShowMediaInput(false)}
                          className="px-4 text-neutral-500 hover:text-white transition-colors"
                        >
                          <Icons.Close />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,video/*"
                      />
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowAttachmentMenu(!showAttachmentMenu)
                          }
                          className={`p-4 hover:bg-white/5 rounded-2xl transition-all shadow-xl active:scale-90 flex items-center justify-center ${showAttachmentMenu ? "text-blue-500 bg-white/10" : "text-neutral-500"}`}
                        >
                          <Icons.Plus />
                        </button>
                        {showAttachmentMenu && (
                          <div className="absolute bottom-full left-0 mb-4 bg-neutral-900 border border-white/10 p-2 rounded-[24px] flex flex-col gap-1 shadow-2xl z-30 animate-in slide-in-from-bottom-2 backdrop-blur-2xl min-w-[180px]">
                            <button
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowAttachmentMenu(false);
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white"
                            >
                              <Icons.Clip />
                              Upload Media
                            </button>
                            <button
                              onClick={() => {
                                setShowMediaInput(true);
                                setShowAttachmentMenu(false);
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white"
                            >
                              <Icons.Link />
                              Attach via URL
                            </button>
                          </div>
                        )}
                      </div>

                      <form
                        className="flex-1 flex gap-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.elements.namedItem(
                            "msg",
                          ) as HTMLInputElement;
                          if (input.value.trim()) {
                            onSendMessage(input.value.trim(), activeGroupId);
                            input.value = "";
                            setReplyTo(null);
                          }
                        }}
                      >
                        <input
                          name="msg"
                          type="text"
                          placeholder="Message..."
                          autoComplete="off"
                          className={`flex-1 px-6 py-4 rounded-3xl text-sm font-bold outline-none transition-all shadow-inner ${isDarkMode ? "bg-white/5 border border-white/5 focus:bg-white/10 focus:border-blue-500/30" : "bg-black/5 border border-black/5"}`}
                        />
                        <button
                          type="submit"
                          className="px-10 bg-blue-500 text-white rounded-[24px] font-black text-[10px] hover:bg-blue-600 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all uppercase tracking-widest italic"
                        >
                          SEND
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-10 opacity-20 pointer-events-none select-none h-full">
              <div className="w-40 h-40 rounded-[60px] bg-neutral-900 flex items-center justify-center text-blue-500 shadow-2xl border border-white/5 relative">
                <Icons.Plus />
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
              </div>
              <div className="text-center space-y-3">
                <p className="font-black text-2xl tracking-[0.4em] uppercase italic">
                  NO SIGNAL
                </p>
                <p className="text-xs font-black text-neutral-600 uppercase tracking-widest">
                  Select an encrypted node to begin neural sync
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showGroupInfo && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
            onClick={() => setShowGroupInfo(false)}
          />
          <div className="relative max-w-md w-full bg-neutral-950 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl border-4 border-white/10 transform transition-transform group-hover:scale-105">
                  {activeGroup.image || "👥"}
                </div>
                {isAdmin && (
                  <div className="absolute -bottom-2 -right-2 flex flex-wrap gap-1 justify-center max-w-[150px]">
                    <button
                      onClick={() => setShowEmojiPicker("group_icon")}
                      className="p-2.5 bg-neutral-900 rounded-xl border border-white/10 shadow-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all shadow-blue-500/10"
                    >
                      <Icons.Camera />
                    </button>
                    {showEmojiPicker === "group_icon" && (
                      <div className="absolute top-full mt-2 bg-neutral-900 border border-white/10 p-2 rounded-2xl grid grid-cols-4 gap-1 shadow-2xl z-50">
                        {GROUP_ICONS.map((i) => (
                          <button
                            key={i}
                            onClick={() => {
                              handleUpdateIcon(i);
                              setShowEmojiPicker(null);
                            }}
                            className="p-2 hover:bg-white/10 rounded-xl text-xl"
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight uppercase italic">
                  {activeGroup.name}
                </h2>
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-[250px] mx-auto">
                  {activeGroup.description}
                </p>
              </div>

              {/* Admin Panel */}
              {isAdmin && (
                <div className="w-full bg-white/5 p-4 rounded-[24px] border border-white/5 space-y-3">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 text-left px-1">
                    Command Center
                  </h3>
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-white/5">
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-tight">
                        Lock Transmission
                      </p>
                      <p className="text-[9px] text-neutral-500 font-bold">
                        Only admins can broadcast
                      </p>
                    </div>
                    <button
                      onClick={toggleLock}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeGroup.settings?.whoCanSendMessage === "admins" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/10 text-neutral-400 hover:bg-white/20"}`}
                    >
                      {activeGroup.settings?.whoCanSendMessage === "admins"
                        ? "LOCKED"
                        : "OPEN"}
                    </button>
                  </div>
                </div>
              )}

              <div className="w-full bg-white/5 p-5 rounded-[32px] border border-white/5 max-h-56 overflow-hidden flex flex-col">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-4 text-left shrink-0 italic">
                  Nodes ({activeGroup.members.length})
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {activeGroup.members.map((member) => (
                    <div
                      key={member}
                      className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-transparent hover:border-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-500 hover:text-white transition-colors cursor-pointer"
                          onClick={() => onAliasClick(member)}
                        >
                          @
                        </div>
                        <div className="flex flex-col items-start translate-y-[-1px]">
                          <span className="text-[11px] font-black tracking-tight">
                            @{member}
                          </span>
                          {activeGroup.admins.includes(member) && (
                            <span className="text-[8px] text-blue-500 font-black uppercase tracking-[0.1em] italic">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        {isAdmin && member !== user.alias && (
                          <>
                            <button
                              onClick={() =>
                                onPromoteMember(
                                  activeGroupId,
                                  member,
                                  activeGroup.admins.includes(member)
                                    ? "member"
                                    : "admin",
                                )
                              }
                              className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-blue-500 hover:border-blue-500 transition-all"
                            >
                              {activeGroup.admins.includes(member) ? "↓" : "↑"}
                            </button>
                            <button
                              onClick={() =>
                                onKickMember(activeGroupId, member)
                              }
                              className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all underline decoration-dotted"
                            >
                              EJECT
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full flex gap-3 pt-2">
                {!userInGroup ? (
                  <button
                    onClick={() => {
                      onJoinGroup(activeGroupId);
                    }}
                    className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl italic"
                  >
                    JOIN CLUSTER
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onLeaveGroup(activeGroupId);
                      setShowGroupInfo(false);
                      setActiveGroupId(null);
                    }}
                    className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl"
                  >
                    DISCONNECT
                  </button>
                )}
                <button
                  onClick={() => setShowGroupInfo(false)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500"
            onClick={() => setIsCreating(false)}
          />
          <div className="relative max-w-lg w-full bg-neutral-950 border border-white/10 rounded-[64px] p-12 space-y-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-3">
              <h3 className="text-4xl font-black tracking-tighter uppercase italic">
                Deploy New Cluster
              </h3>
              <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.4em]">
                Establish an encrypted communication node
              </p>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] text-center">
                  Node Visual ID
                </p>
                <div className="grid grid-cols-8 gap-3 bg-white/5 p-6 rounded-[32px] border border-white/5">
                  {GROUP_ICONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setNewGroupIcon(i)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${newGroupIcon === i ? "bg-blue-500 scale-125 shadow-2xl shadow-blue-500/50" : "bg-white/5 hover:bg-white/10"}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="CLUSTER_DESIGNATION"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-8 py-6 rounded-[28px] bg-white/5 border border-white/10 focus:border-blue-500/50 outline-none text-sm font-black uppercase tracking-widest shadow-inner placeholder:text-neutral-800"
                />
                <textarea
                  placeholder="DEFINE OPERATIONAL OBJECTIVES..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-8 py-6 rounded-[32px] bg-white/5 border border-white/10 focus:border-blue-500/50 outline-none text-xs font-bold resize-none h-40 placeholder:text-neutral-800 uppercase tracking-widest"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-6 bg-white/5 border border-white/10 text-neutral-600 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                  ABORT
                </button>
                <button
                  onClick={() => {
                    if (newGroupName.trim()) {
                      onCreateGroup(
                        newGroupName.trim(),
                        newGroupDesc.trim(),
                        false,
                        newGroupIcon,
                      );
                      setIsCreating(false);
                      setNewGroupName("");
                      setNewGroupDesc("");
                    }
                  }}
                  disabled={!newGroupName.trim()}
                  className="flex-[2] py-6 bg-blue-500 text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-600 shadow-2xl shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-20 italic"
                >
                  INITIALIZE NODE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatContainer;
