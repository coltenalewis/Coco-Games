"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  ticket_id: string;
  author_discord_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_username: string;
  author_avatar: string | null;
  author_role: string;
}

interface TicketChatProps {
  ticketId: string;
  currentUserDiscordId: string;
  isClosed: boolean;
}

const roleBadge: Record<string, string> = {
  owner: "bg-coco-ember text-white",
  executive: "bg-green-100 text-green-700",
  admin: "bg-red-100 text-red-700",
  developer: "bg-violet-100 text-violet-700",
  mod: "bg-blue-100 text-blue-700",
  contractor: "bg-amber-100 text-amber-700",
  user: "",
};

export default function TicketChat({
  ticketId,
  currentUserDiscordId,
  isClosed,
}: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // ignore polling errors
    }
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (imageUrl?: string) => {
    if (!content.trim() && !imageUrl) return;
    setSending(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || (imageUrl ? "Image attached" : ""),
          imageUrl,
        }),
      });

      if (res.ok) {
        setContent("");
        fetchMessages();
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ticketId", ticketId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        await handleSend(url);
      } else {
        const data = await res.json();
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getAvatarUrl = (msg: Message) => {
    if (msg.author_avatar) {
      return `https://cdn.discordapp.com/avatars/${msg.author_discord_id}/${msg.author_avatar}.png?size=64`;
    }
    const idx = (BigInt(msg.author_discord_id) >> BigInt(22)) % BigInt(6);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        {messages.length === 0 ? (
          <p className="text-center text-coco-coffee/50 text-sm py-8">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.author_discord_id === currentUserDiscordId;
            const badge = roleBadge[msg.author_role];
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <img
                  src={getAvatarUrl(msg)}
                  alt=""
                  className="w-8 h-8 border border-coco-dark/10 flex-shrink-0 mt-1"
                />
                <div
                  className={`max-w-[70%] ${
                    isOwn ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-coco-dark">
                      {msg.author_username}
                    </span>
                    {badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 ${badge}`}
                      >
                        {msg.author_role.toUpperCase()}
                      </span>
                    )}
                    <span className="text-[10px] text-coco-coffee/40">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`p-3 text-sm ${
                      isOwn
                        ? "bg-coco-accent/10 border border-coco-accent/20"
                        : "bg-white border border-coco-dark/10"
                    }`}
                  >
                    <p className="text-coco-dark whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Attachment"
                        className="mt-2 max-w-full max-h-48 border border-coco-dark/10 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setExpandedImage(msg.image_url)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Expanded"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Input */}
      {!isClosed ? (
        <div className="border-t-2 border-coco-dark/10 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent"
              disabled={sending}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-coffee hover:border-coco-accent transition-colors"
              title="Upload image"
            >
              {uploading ? (
                <span className="text-xs">...</span>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="square"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={sending || !content.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t-2 border-coco-dark/10 p-4 text-center">
          <p className="text-sm text-coco-coffee/60 font-medium">
            This ticket is closed.
          </p>
        </div>
      )}
    </div>
  );
}
