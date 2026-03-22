"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "question";
  const validCategories = ["discord_appeal", "game_appeal", "question", "business", "bug_report", "game_report"];

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(
    validCategories.includes(initialCategory) ? initialCategory : "question"
  );
  const [priority] = useState("normal");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, message, imageUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/tickets/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create ticket");
      }
    } catch {
      setError("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
        Support
      </span>
      <h1 className="text-3xl font-black text-coco-dark mt-1 mb-8">
        New Ticket
      </h1>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue..."
            className="w-full px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "question", label: "Question", icon: "?" },
              { value: "bug_report", label: "Bug Report", icon: "!" },
              { value: "game_report", label: "Game Report", icon: "R" },
              { value: "discord_appeal", label: "Discord Appeal", icon: "D" },
              { value: "game_appeal", label: "Game Appeal", icon: "G" },
              { value: "business", label: "Business Inquiry", icon: "B" },
            ].map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all flex items-center gap-2 ${
                  category === cat.value
                    ? "bg-coco-dark text-coco-gold border-coco-dark shadow-coco-sharp-sm"
                    : "bg-white text-coco-dark border-coco-dark/15 hover:border-coco-accent"
                }`}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center text-[10px] font-black border ${
                    category === cat.value
                      ? "bg-coco-gold/20 border-coco-gold/40 text-coco-gold"
                      : "bg-coco-accent/10 border-coco-accent/20 text-coco-accent"
                  }`}
                >
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Describe your issue in detail..."
            className="w-full px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent resize-none transition-colors"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Attachment (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          {imageUrl ? (
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Attachment"
                className="max-h-32 border-2 border-coco-dark/10"
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold border-2 border-white flex items-center justify-center"
              >
                X
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 border-2 border-dashed border-coco-dark/20 text-sm text-coco-coffee hover:border-coco-accent transition-colors w-full text-left"
            >
              {uploading
                ? "Uploading..."
                : "Click to attach an image (JPEG, PNG, GIF, WebP — max 5MB)"}
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !subject.trim() || !message.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Ticket"}
        </button>
      </form>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-6 animate-pulse h-96" />
        </div>
      }
    >
      <NewTicketForm />
    </Suspense>
  );
}
