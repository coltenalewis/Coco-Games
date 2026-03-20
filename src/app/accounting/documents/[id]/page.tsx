"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Doc {
  id: string;
  type: "contract" | "invoice" | "letter" | "memo";
  title: string;
  content: string;
  status: "draft" | "final";
  created_by: string;
  recipient_name: string | null;
  recipient_title: string | null;
  effective_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    recipient_name: "",
    recipient_title: "",
    effective_date: "",
    status: "draft" as "draft" | "final",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/accounting/documents?type=`);
        const data = await res.json();
        const found = (data.documents || []).find((d: Doc) => d.id === params.id);
        if (found) {
          setDoc(found);
          setForm({
            title: found.title,
            content: found.content,
            recipient_name: found.recipient_name || "",
            recipient_title: found.recipient_title || "",
            effective_date: found.effective_date || "",
            status: found.status,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, ...form }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoc(updated);
        setEditing(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-coco-coffee/60">Loading...</div>;
  }

  if (!doc) {
    return <div className="p-8 text-center text-coco-coffee/60">Document not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <button onClick={() => router.push("/accounting/documents")} className="text-xs text-coco-accent hover:text-coco-ember font-bold mb-2 inline-block">
            &larr; Back to Documents
          </button>
          <h2 className="text-xl font-black text-coco-dark">{doc.title}</h2>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-xs !px-4 !py-2 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <>
              <button onClick={handlePrint} className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark transition-colors">
                Print / PDF
              </button>
              <button onClick={() => setEditing(true)} className="btn-primary text-xs !px-4 !py-2">
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="card p-6 space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recipient</label>
              <input
                type="text"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recipient Title</label>
              <input
                type="text"
                value={form.recipient_title}
                onChange={(e) => setForm({ ...form, recipient_title: e.target.value })}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Effective Date</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "final" })}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              >
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={20}
              className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 font-mono leading-relaxed resize-y"
            />
          </div>
        </div>
      ) : (
        /* Print-friendly branded document view */
        <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg max-w-3xl mx-auto print:border-0 print:shadow-none">
          {/* Letterhead */}
          <div className="bg-coco-midnight px-10 py-6 flex items-center justify-between print:bg-coco-midnight">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coco-accent/20 border-2 border-coco-accent/40 flex items-center justify-center">
                <span className="text-coco-gold font-black text-lg">CG</span>
              </div>
              <div>
                <p className="text-coco-gold font-black text-lg tracking-widest uppercase">COCO GAMES</p>
                <p className="text-coco-cream/40 text-xs tracking-wider">GAME STUDIO</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-coco-cream/60 text-xs">
                {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
              </p>
              {doc.effective_date && (
                <p className="text-coco-cream/40 text-xs">
                  {new Date(doc.effective_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
              <p className={`text-[10px] font-bold mt-1 ${doc.status === "final" ? "text-green-400" : "text-yellow-400"}`}>
                {doc.status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-coco-accent via-coco-gold to-coco-ember" />

          {/* Body */}
          <div className="px-10 py-8">
            <h2 className="text-2xl font-black text-coco-dark mb-6 tracking-wide uppercase">
              {doc.title}
            </h2>

            {(doc.recipient_name || doc.recipient_title) && (
              <div className="mb-6 pb-4 border-b-2 border-coco-dark/5">
                {doc.recipient_name && (
                  <p className="text-sm font-bold text-coco-dark">{doc.recipient_name}</p>
                )}
                {doc.recipient_title && (
                  <p className="text-xs text-coco-coffee/60">{doc.recipient_title}</p>
                )}
              </div>
            )}

            <div className="text-sm text-coco-dark leading-relaxed whitespace-pre-wrap">
              {doc.content}
            </div>

            {/* Signature lines for contracts */}
            {doc.type === "contract" && doc.status === "final" && (
              <div className="mt-12 grid grid-cols-2 gap-12">
                <div>
                  <div className="border-b-2 border-coco-dark/20 mb-2 h-10" />
                  <p className="text-xs font-bold text-coco-dark">COCO GAMES</p>
                  <p className="text-[10px] text-coco-coffee/50">Authorized Representative</p>
                  <p className="text-[10px] text-coco-coffee/50 mt-1">Date: _______________</p>
                </div>
                <div>
                  <div className="border-b-2 border-coco-dark/20 mb-2 h-10" />
                  <p className="text-xs font-bold text-coco-dark">{doc.recipient_name || "CONTRACTOR"}</p>
                  <p className="text-[10px] text-coco-coffee/50">{doc.recipient_title || "Contractor"}</p>
                  <p className="text-[10px] text-coco-coffee/50 mt-1">Date: _______________</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-coco-dark/5 px-10 py-4 flex items-center justify-between">
            <p className="text-[10px] text-coco-coffee/40 uppercase tracking-wider">
              Confidential &mdash; COCO GAMES
            </p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-coco-accent/30 border border-coco-accent/50" />
              <p className="text-[10px] text-coco-coffee/40">cocogames.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
