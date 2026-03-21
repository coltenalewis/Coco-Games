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

function tryParseJSON(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

function StructuredContent({ doc }: { doc: Doc }) {
  const parsed = tryParseJSON(doc.content);

  // Invoice
  if (parsed?._type === "invoice") {
    const items = parsed.items || [];
    const subtotal = items.reduce((s: number, i: { quantity: number; rate: number }) => s + i.quantity * i.rate, 0);
    const tax = subtotal * ((parsed.tax_percent || 0) / 100);
    const total = subtotal + tax;

    return (
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-coco-coffee border-b border-coco-dark/10 pb-3">
          <span>Invoice #: <strong className="text-coco-dark">{parsed.invoice_number}</strong></span>
          <span>Date: <strong className="text-coco-dark">{parsed.invoice_date}</strong></span>
          <span>Due: <strong className="text-coco-dark">{parsed.due_date}</strong></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead><tr className="border-b-2 border-coco-dark/10 text-xs text-coco-coffee">
              <th className="text-left py-2">Description</th><th className="text-center py-2 w-16">Qty</th><th className="text-right py-2 w-20">Rate</th><th className="text-right py-2 w-24">Amount</th>
            </tr></thead>
            <tbody>
              {items.filter((i: { description: string }) => i.description).map((item: { description: string; quantity: number; rate: number }, i: number) => (
                <tr key={i} className="border-b border-coco-dark/5">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">${item.rate.toFixed(2)}</td>
                  <td className="py-2 text-right font-medium">${(item.quantity * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-coco-dark/10 pt-3 space-y-1 text-sm text-right">
          <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
          {parsed.tax_percent > 0 && <p>Tax ({parsed.tax_percent}%): <strong>${tax.toFixed(2)}</strong></p>}
          <p className="text-base font-black text-green-700 pt-1 border-t border-coco-dark/10">Total Due: ${total.toFixed(2)}</p>
        </div>
        {parsed.payment_terms && <p className="text-xs text-coco-coffee mt-4"><strong>Payment Terms:</strong> {parsed.payment_terms}</p>}
        {parsed.payment_method && <p className="text-xs text-coco-coffee"><strong>Payment Method:</strong> {parsed.payment_method}</p>}
        {parsed.notes && <p className="text-xs text-coco-coffee/60 mt-2 italic">{parsed.notes}</p>}
      </div>
    );
  }

  // Memo
  if (parsed?._type === "memo") {
    return (
      <div className="space-y-3 text-sm">
        <div className="border-b-2 border-coco-dark/10 pb-3 space-y-1 text-xs">
          <p><strong className="text-coco-coffee uppercase w-16 inline-block">To:</strong> {parsed.to}</p>
          <p><strong className="text-coco-coffee uppercase w-16 inline-block">From:</strong> {parsed.from}</p>
          <p><strong className="text-coco-coffee uppercase w-16 inline-block">Date:</strong> {parsed.date}</p>
          <p><strong className="text-coco-coffee uppercase w-16 inline-block">Re:</strong> {parsed.subject}</p>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{parsed.body}</div>
        {parsed.action_items?.length > 0 && (
          <div className="border-t border-coco-dark/10 pt-3">
            <p className="text-xs font-bold text-coco-coffee uppercase mb-2">Action Items</p>
            <ul className="space-y-1">{parsed.action_items.filter(Boolean).map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm"><span className="w-5 h-5 border-2 border-coco-dark/20 flex-shrink-0 mt-0.5" />{a}</li>
            ))}</ul>
          </div>
        )}
      </div>
    );
  }

  // Letter
  if (parsed?._type === "letter") {
    return (
      <div className="text-sm space-y-4">
        <p>{parsed.greeting} {doc.recipient_name || "___"},</p>
        <div className="whitespace-pre-wrap leading-relaxed">{parsed.body}</div>
        <div className="mt-8">
          <p>{parsed.closing},</p>
          <p className="font-bold mt-4">{parsed.signer_name}</p>
          <p className="text-xs text-coco-coffee/60">{parsed.signer_title}</p>
        </div>
      </div>
    );
  }

  // Contract (HTML) or fallback plain text
  if (doc.content.includes("<") && doc.content.includes(">")) {
    return <div className="text-sm text-coco-dark leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: doc.content }} />;
  }

  return <div className="text-sm text-coco-dark leading-relaxed whitespace-pre-wrap">{doc.content}</div>;
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

  if (loading) return <div className="p-8 text-center text-coco-coffee/60">Loading...</div>;
  if (!doc) return <div className="p-8 text-center text-coco-coffee/60">Document not found.</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <button onClick={() => router.push("/accounting/documents")} className="text-xs text-coco-accent hover:text-coco-ember font-bold mb-1 inline-block min-h-[36px]">
            &larr; Back to Documents
          </button>
          <h2 className="text-lg sm:text-xl font-black text-coco-dark">{doc.title}</h2>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee transition-colors min-h-[40px]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-xs !px-3 sm:!px-4 !py-2 disabled:opacity-50 min-h-[40px]">{saving ? "Saving..." : "Save"}</button>
            </>
          ) : (
            <>
              <button onClick={() => window.print()} className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark transition-colors min-h-[40px]">Print / PDF</button>
              <button onClick={() => setEditing(true)} className="btn-primary text-xs !px-3 sm:!px-4 !py-2 min-h-[40px]">Edit</button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="card p-3 sm:p-6 space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div><label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recipient</label>
              <input type="text" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400" /></div>
            <div><label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recipient Title</label>
              <input type="text" value={form.recipient_title} onChange={(e) => setForm({ ...form, recipient_title: e.target.value })} className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400" /></div>
            <div><label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Effective Date</label>
              <input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400" /></div>
            <div><label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "final" })} className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400">
                <option value="draft">Draft</option><option value="final">Final</option>
              </select></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={16} className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 font-mono leading-relaxed resize-y" />
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg max-w-3xl mx-auto print:border-0 print:shadow-none">
          <div className="bg-coco-midnight px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-coco-accent/20 border-2 border-coco-accent/40 flex items-center justify-center">
                <span className="text-coco-gold font-black text-base sm:text-lg">CG</span>
              </div>
              <div>
                <p className="text-coco-gold font-black text-sm sm:text-lg tracking-widest uppercase">COCO GAMES</p>
                <p className="text-coco-cream/40 text-[10px] sm:text-xs tracking-wider">GAME STUDIO</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-coco-cream/60 text-xs capitalize">{doc.type}</p>
              {doc.effective_date && <p className="text-coco-cream/40 text-[10px] sm:text-xs">{new Date(doc.effective_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
              <p className={`text-[10px] font-bold mt-1 ${doc.status === "final" ? "text-green-400" : "text-yellow-400"}`}>{doc.status.toUpperCase()}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-coco-accent via-coco-gold to-coco-ember" />

          <div className="px-4 sm:px-10 py-5 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-black text-coco-dark mb-4 sm:mb-6 tracking-wide uppercase">{doc.title}</h2>
            {(doc.recipient_name || doc.recipient_title) && (
              <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-coco-dark/5">
                {doc.recipient_name && <p className="text-sm font-bold text-coco-dark">{doc.recipient_name}</p>}
                {doc.recipient_title && <p className="text-xs text-coco-coffee/60">{doc.recipient_title}</p>}
              </div>
            )}
            <StructuredContent doc={doc} />
            {doc.type === "contract" && doc.status === "final" && (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
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

          <div className="border-t-2 border-coco-dark/5 px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between">
            <p className="text-[10px] text-coco-coffee/40 uppercase tracking-wider">Confidential &mdash; COCO GAMES</p>
            <p className="text-[10px] text-coco-coffee/40">cocogames.com</p>
          </div>
        </div>
      )}
    </div>
  );
}
