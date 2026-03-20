"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEMPLATES: Record<string, { title: string; content: string; recipient_name: string; recipient_title: string }> = {
  contract: {
    title: "Service Agreement",
    recipient_name: "",
    recipient_title: "",
    content: `This Service Agreement ("Agreement") is entered into as of the Effective Date by and between COCO GAMES ("Company") and the Recipient named below ("Contractor").

1. SCOPE OF WORK
The Contractor agrees to provide the following services:
- [Describe services here]

2. COMPENSATION
The Company agrees to pay the Contractor a total of $[AMOUNT] for the services rendered under this Agreement.

3. TERM
This Agreement shall commence on the Effective Date and continue until [END DATE] unless terminated earlier by either party with 14 days written notice.

4. INTELLECTUAL PROPERTY
All work product, including but not limited to code, assets, designs, and documentation created under this Agreement shall be the exclusive property of COCO GAMES.

5. CONFIDENTIALITY
The Contractor agrees to maintain the confidentiality of all proprietary information shared during the course of this engagement.

6. TERMINATION
Either party may terminate this Agreement with 14 days written notice. Upon termination, the Contractor shall deliver all completed work to the Company.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with applicable laws.

By signing below, both parties agree to the terms and conditions outlined in this Agreement.`,
  },
  invoice: {
    title: "Invoice",
    recipient_name: "",
    recipient_title: "",
    content: `INVOICE

Bill To: [Recipient Name]
Invoice Date: [DATE]
Due Date: [DUE DATE]
Invoice #: [NUMBER]

ITEMS:
1. [Item description] — $[AMOUNT]
2. [Item description] — $[AMOUNT]

SUBTOTAL: $[AMOUNT]
TAX: $0.00
TOTAL DUE: $[AMOUNT]

PAYMENT TERMS:
Payment is due within 30 days of the invoice date.

PAYMENT METHOD:
[Payment details here]

Thank you for your business.`,
  },
  letter: {
    title: "Official Letter",
    recipient_name: "",
    recipient_title: "",
    content: `Dear [Recipient],

[Body of the letter]

We look forward to hearing from you.

Best regards,
COCO GAMES`,
  },
  memo: {
    title: "Internal Memo",
    recipient_name: "",
    recipient_title: "",
    content: `MEMORANDUM

TO: [Recipients]
FROM: COCO GAMES Management
DATE: [Date]
RE: [Subject]

[Memo body]

Please direct any questions to management.`,
  },
};

export default function NewDocumentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "contract" as "contract" | "invoice" | "letter" | "memo",
    title: "",
    content: "",
    recipient_name: "",
    recipient_title: "",
    effective_date: new Date().toISOString().split("T")[0],
  });
  const [showPreview, setShowPreview] = useState(false);

  const applyTemplate = (type: string) => {
    const tmpl = TEMPLATES[type];
    if (tmpl) {
      setForm({
        ...form,
        type: type as typeof form.type,
        title: tmpl.title,
        content: tmpl.content,
      });
    } else {
      setForm({ ...form, type: type as typeof form.type });
    }
  };

  const handleSubmit = async (status: "draft" | "final") => {
    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/accounting/documents/${doc.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-coco-dark">New Document</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark transition-colors"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="text-xs px-4 py-2 font-bold border-2 border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit("final")}
            disabled={saving}
            className="btn-primary text-xs !px-4 !py-2 disabled:opacity-50"
          >
            Finalize
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Document Preview - Studio branded */
        <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg max-w-3xl mx-auto">
          {/* Letterhead */}
          <div className="bg-coco-midnight px-10 py-6 flex items-center justify-between">
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
                {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
              </p>
              <p className="text-coco-cream/40 text-xs">
                {new Date(form.effective_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-coco-accent via-coco-gold to-coco-ember" />

          {/* Document body */}
          <div className="px-10 py-8">
            <h2 className="text-2xl font-black text-coco-dark mb-6 tracking-wide uppercase">
              {form.title || "Untitled Document"}
            </h2>

            {(form.recipient_name || form.recipient_title) && (
              <div className="mb-6 pb-4 border-b-2 border-coco-dark/5">
                {form.recipient_name && (
                  <p className="text-sm font-bold text-coco-dark">{form.recipient_name}</p>
                )}
                {form.recipient_title && (
                  <p className="text-xs text-coco-coffee/60">{form.recipient_title}</p>
                )}
              </div>
            )}

            <div className="text-sm text-coco-dark leading-relaxed whitespace-pre-wrap">
              {form.content || "No content yet."}
            </div>
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
      ) : (
        /* Editor Form */
        <div className="card p-6 space-y-5">
          {/* Document type selector */}
          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Document Type</label>
            <div className="flex gap-2 flex-wrap">
              {(["contract", "invoice", "letter", "memo"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => applyTemplate(t)}
                  className={`px-4 py-2 text-xs font-bold border-2 transition-colors ${
                    form.type === t
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-coco-dark/10 text-coco-coffee hover:border-green-300"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Document title..."
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recipient Name</label>
              <input
                type="text"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recipient Title</label>
              <input
                type="text"
                value={form.recipient_title}
                onChange={(e) => setForm({ ...form, recipient_title: e.target.value })}
                placeholder="Developer, Designer..."
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
          </div>

          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={20}
              placeholder="Document content..."
              className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 font-mono leading-relaxed resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}
