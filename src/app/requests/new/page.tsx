"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { value: "feature_request", label: "Feature Request", icon: "F" },
  { value: "bug_report", label: "Bug Report", icon: "B" },
  { value: "resource_request", label: "Resource Request", icon: "R" },
  { value: "time_off", label: "Time Off", icon: "T" },
  { value: "access_request", label: "Access Request", icon: "A" },
  { value: "general", label: "General", icon: "G" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, priority, description }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/requests/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create request");
      }
    } catch {
      setError("Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/requests"
        className="text-coco-accent hover:text-coco-ember text-sm font-bold uppercase tracking-wider"
      >
        &larr; Requests
      </Link>
      <span className="block text-coco-accent font-bold text-xs uppercase tracking-[0.2em] mt-4">
        Internal
      </span>
      <h1 className="text-3xl font-black text-coco-dark mt-1 mb-8">
        New Request
      </h1>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your request..."
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
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all flex items-center gap-2 min-h-[40px] ${
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

        {/* Priority */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent transition-colors min-h-[40px]"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Provide details about your request..."
            className="w-full px-4 py-2.5 border-2 border-coco-dark/10 bg-white text-coco-dark text-sm focus:outline-none focus:border-coco-accent resize-none transition-colors"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !title.trim() || !description.trim()}
          className="btn-primary disabled:opacity-50 min-h-[40px]"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
