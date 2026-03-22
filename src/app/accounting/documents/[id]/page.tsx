"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

interface FormFieldDef {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  sort_order: number;
}

interface SendRecord {
  id: string;
  recipient_discord_id: string;
  recipient_name: string;
  status: string;
  sent_at: string;
  completed_at: string | null;
}

interface UserResult {
  discord_id: string;
  username: string;
  avatar: string | null;
}

const inputCls =
  "w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors";

const FIELD_TYPES = [
  "text",
  "email",
  "date",
  "number",
  "textarea",
  "checkbox",
  "select",
  "signature",
] as const;

const sendStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  viewed: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  declined: "bg-red-100 text-red-700 border-red-300",
  expired: "bg-gray-100 text-gray-500 border-gray-300",
};

function tryParseJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function StructuredContent({ doc }: { doc: Doc }) {
  const parsed = tryParseJSON(doc.content);

  // Invoice
  if (parsed?._type === "invoice") {
    const items = parsed.items || [];
    const subtotal = items.reduce(
      (s: number, i: { quantity: number; rate: number }) =>
        s + i.quantity * i.rate,
      0
    );
    const tax = subtotal * ((parsed.tax_percent || 0) / 100);
    const total = subtotal + tax;

    return (
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-coco-coffee border-b border-coco-dark/10 pb-3">
          <span>
            Invoice #:{" "}
            <strong className="text-coco-dark">{parsed.invoice_number}</strong>
          </span>
          <span>
            Date:{" "}
            <strong className="text-coco-dark">{parsed.invoice_date}</strong>
          </span>
          <span>
            Due: <strong className="text-coco-dark">{parsed.due_date}</strong>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b-2 border-coco-dark/10 text-xs text-coco-coffee">
                <th className="text-left py-2">Description</th>
                <th className="text-center py-2 w-16">Qty</th>
                <th className="text-right py-2 w-20">Rate</th>
                <th className="text-right py-2 w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((i: { description: string }) => i.description)
                .map(
                  (
                    item: {
                      description: string;
                      quantity: number;
                      rate: number;
                    },
                    i: number
                  ) => (
                    <tr key={i} className="border-b border-coco-dark/5">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">
                        ${item.rate.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        ${(item.quantity * item.rate).toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-coco-dark/10 pt-3 space-y-1 text-sm text-right">
          <p>
            Subtotal: <strong>${subtotal.toFixed(2)}</strong>
          </p>
          {parsed.tax_percent > 0 && (
            <p>
              Tax ({parsed.tax_percent}%): <strong>${tax.toFixed(2)}</strong>
            </p>
          )}
          <p className="text-base font-black text-green-700 pt-1 border-t border-coco-dark/10">
            Total Due: ${total.toFixed(2)}
          </p>
        </div>
        {parsed.payment_terms && (
          <p className="text-xs text-coco-coffee mt-4">
            <strong>Payment Terms:</strong> {parsed.payment_terms}
          </p>
        )}
        {parsed.payment_method && (
          <p className="text-xs text-coco-coffee">
            <strong>Payment Method:</strong> {parsed.payment_method}
          </p>
        )}
        {parsed.notes && (
          <p className="text-xs text-coco-coffee/60 mt-2 italic">
            {parsed.notes}
          </p>
        )}
      </div>
    );
  }

  // Memo
  if (parsed?._type === "memo") {
    return (
      <div className="space-y-3 text-sm">
        <div className="border-b-2 border-coco-dark/10 pb-3 space-y-1 text-xs">
          <p>
            <strong className="text-coco-coffee uppercase w-16 inline-block">
              To:
            </strong>{" "}
            {parsed.to}
          </p>
          <p>
            <strong className="text-coco-coffee uppercase w-16 inline-block">
              From:
            </strong>{" "}
            {parsed.from}
          </p>
          <p>
            <strong className="text-coco-coffee uppercase w-16 inline-block">
              Date:
            </strong>{" "}
            {parsed.date}
          </p>
          <p>
            <strong className="text-coco-coffee uppercase w-16 inline-block">
              Re:
            </strong>{" "}
            {parsed.subject}
          </p>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{parsed.body}</div>
        {parsed.action_items?.length > 0 && (
          <div className="border-t border-coco-dark/10 pt-3">
            <p className="text-xs font-bold text-coco-coffee uppercase mb-2">
              Action Items
            </p>
            <ul className="space-y-1">
              {parsed.action_items
                .filter(Boolean)
                .map((a: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 border-2 border-coco-dark/20 flex-shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Letter
  if (parsed?._type === "letter") {
    return (
      <div className="text-sm space-y-4">
        <p>
          {parsed.greeting} {doc.recipient_name || "___"},
        </p>
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
    return (
      <div
        className="text-sm text-coco-dark leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    );
  }

  return (
    <div className="text-sm text-coco-dark leading-relaxed whitespace-pre-wrap">
      {doc.content}
    </div>
  );
}

// ============================================
// FORM FIELDS MANAGEMENT
// ============================================
function FormFieldsManager({ documentId }: { documentId: string }) {
  const [fields, setFields] = useState<FormFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<string>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/accounting/documents/fields?document_id=${documentId}`)
      .then((r) => r.json())
      .then((data) => setFields(data.fields || []))
      .finally(() => setLoading(false));
  }, [documentId]);

  const addField = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/documents/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          label: newLabel.trim(),
          type: newType,
          required: newRequired,
          options:
            newType === "select"
              ? newOptions
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean)
              : null,
          sort_order: fields.length,
        }),
      });
      if (res.ok) {
        const field = await res.json();
        setFields((prev) => [...prev, field]);
        setNewLabel("");
        setNewType("text");
        setNewRequired(false);
        setNewOptions("");
        setShowAdd(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (fieldId: string) => {
    await fetch("/api/accounting/documents/fields", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: fieldId }),
    });
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  return (
    <div className="card p-4 sm:p-6 print:hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-coco-dark uppercase tracking-wider">
          Form Fields
        </h3>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-green-600 hover:text-green-800 font-bold min-h-[40px] px-3 border border-green-300 hover:border-green-500 transition-colors"
        >
          + Add Field
        </button>
      </div>

      {loading && (
        <p className="text-xs text-coco-coffee/50">Loading fields...</p>
      )}

      {fields.length > 0 && (
        <div className="space-y-2 mb-4">
          {fields
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-2 border border-coco-dark/5 bg-coco-warm/30"
              >
                <span className="text-sm font-medium text-coco-dark flex-1">
                  {field.label}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 border bg-purple-50 text-purple-600 border-purple-200">
                  {field.type}
                </span>
                {field.required && (
                  <span className="text-[10px] font-bold px-2 py-0.5 border bg-red-50 text-red-500 border-red-200">
                    Required
                  </span>
                )}
                <button
                  onClick={() => deleteField(field.id)}
                  className="text-red-400 hover:text-red-600 font-bold text-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  &times;
                </button>
              </div>
            ))}
        </div>
      )}

      {!loading && fields.length === 0 && !showAdd && (
        <p className="text-xs text-coco-coffee/40">
          No form fields configured. Recipients will only need to sign.
        </p>
      )}

      {showAdd && (
        <div className="border-t border-coco-dark/5 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Label
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Field label..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className={inputCls}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {newType === "select" && (
            <div>
              <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Options (comma-separated)
              </label>
              <input
                type="text"
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                placeholder="Option 1, Option 2, Option 3..."
                className={inputCls}
              />
            </div>
          )}
          <label className="flex items-center gap-2 min-h-[40px] cursor-pointer">
            <input
              type="checkbox"
              checked={newRequired}
              onChange={(e) => setNewRequired(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-xs font-bold text-coco-coffee">
              Required field
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="text-xs px-3 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee min-h-[40px]"
            >
              Cancel
            </button>
            <button
              onClick={addField}
              disabled={saving || !newLabel.trim()}
              className="btn-primary text-xs !px-3 !py-2 disabled:opacity-50 min-h-[40px]"
            >
              {saving ? "Adding..." : "Add Field"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SEND TO USER MODAL
// ============================================
function SendModal({
  documentId,
  onClose,
  onSent,
}: {
  documentId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [message, setMessage] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.users || []))
      .finally(() => setSearching(false));
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedUser(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
  };

  const selectUser = (user: UserResult) => {
    setSelectedUser(user);
    setQuery(user.username);
    setResults([]);
  };

  const handleSend = async () => {
    if (!selectedUser) {
      alert("Please select a user");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          recipient_discord_id: selectedUser.discord_id,
          message: message || null,
          expires_in_days: expiryDays ? parseInt(expiryDays) : null,
        }),
      });
      if (res.ok) {
        onSent();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card p-4 sm:p-6 w-full max-w-md bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-coco-dark uppercase tracking-wider">
            Send to User
          </h3>
          <button
            onClick={onClose}
            className="text-coco-coffee/40 hover:text-coco-dark text-xl font-bold min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* User search */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">
            Recipient
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by Discord ID or username..."
            className={inputCls}
          />
          {selectedUser && (
            <p className="text-xs text-green-600 mt-1">
              Selected: {selectedUser.username} ({selectedUser.discord_id})
            </p>
          )}
          {/* Dropdown results */}
          {results.length > 0 && !selectedUser && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-coco-dark/10 shadow-lg max-h-48 overflow-y-auto">
              {results.map((user) => (
                <button
                  key={user.discord_id}
                  onClick={() => selectUser(user)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 transition-colors text-left min-h-[44px]"
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-7 h-7 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-coco-dark/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-coco-coffee">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-coco-dark">
                      {user.username}
                    </p>
                    <p className="text-[10px] text-coco-coffee/40">
                      {user.discord_id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <p className="text-[10px] text-coco-coffee/40 mt-1">
              Searching...
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note for the recipient..."
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-[10px] font-bold text-coco-coffee uppercase tracking-wider mb-1">
            Expires in (days, optional)
          </label>
          <input
            type="number"
            min="1"
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            placeholder="e.g. 7"
            className={inputCls}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee min-h-[40px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedUser}
            className="btn-primary text-xs !px-4 !py-2 disabled:opacity-50 min-h-[40px]"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SENT HISTORY
// ============================================
function SentHistory({ documentId }: { documentId: string }) {
  const [sends, setSends] = useState<SendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSends = useCallback(() => {
    setLoading(true);
    fetch(`/api/documents/sends?document_id=${documentId}`)
      .then((r) => r.json())
      .then((data) => setSends(data.sends || []))
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    fetchSends();
  }, [fetchSends]);

  return (
    <div className="card p-4 sm:p-6 print:hidden">
      <h3 className="text-sm font-black text-coco-dark uppercase tracking-wider mb-3">
        Sent History
      </h3>
      {loading ? (
        <p className="text-xs text-coco-coffee/50">Loading...</p>
      ) : sends.length === 0 ? (
        <p className="text-xs text-coco-coffee/40">
          This document has not been sent to anyone yet.
        </p>
      ) : (
        <div className="space-y-2">
          {sends.map((send) => (
            <div
              key={send.id}
              className="flex items-center gap-3 p-2 border border-coco-dark/5 bg-coco-warm/30"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-coco-dark truncate">
                  {send.recipient_name}
                </p>
                <p className="text-[10px] text-coco-coffee/40">
                  Sent {new Date(send.sent_at).toLocaleDateString()}
                  {send.completed_at &&
                    ` | Completed ${new Date(
                      send.completed_at
                    ).toLocaleDateString()}`}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 border flex-shrink-0 ${
                  sendStatusColors[send.status] || sendStatusColors.pending
                }`}
              >
                {send.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sentRefresh, setSentRefresh] = useState(0);
  const [form, setForm] = useState({
    title: "",
    content: "",
    recipient_name: "",
    recipient_title: "",
    effective_date: "",
    status: "draft" as "draft" | "final",
  });

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isExecutivePlus =
    userRole === "owner" || userRole === "executive";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/accounting/documents?type=`);
        const data = await res.json();
        const found = (data.documents || []).find(
          (d: Doc) => d.id === params.id
        );
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

  if (loading)
    return (
      <div className="p-8 text-center text-coco-coffee/60">Loading...</div>
    );
  if (!doc)
    return (
      <div className="p-8 text-center text-coco-coffee/60">
        Document not found.
      </div>
    );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <button
            onClick={() => router.push("/accounting/documents")}
            className="text-xs text-coco-accent hover:text-coco-ember font-bold mb-1 inline-block min-h-[36px]"
          >
            &larr; Back to Documents
          </button>
          <h2 className="text-lg sm:text-xl font-black text-coco-dark">
            {doc.title}
          </h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee transition-colors min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-xs !px-3 sm:!px-4 !py-2 disabled:opacity-50 min-h-[40px]"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <>
              {isExecutivePlus && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors min-h-[40px]"
                >
                  Send to User
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark transition-colors min-h-[40px]"
              >
                Print / PDF
              </button>
              <button
                onClick={() => setEditing(true)}
                className="btn-primary text-xs !px-3 sm:!px-4 !py-2 min-h-[40px]"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="card p-3 sm:p-6 space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Recipient
              </label>
              <input
                type="text"
                value={form.recipient_name}
                onChange={(e) =>
                  setForm({ ...form, recipient_name: e.target.value })
                }
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Recipient Title
              </label>
              <input
                type="text"
                value={form.recipient_title}
                onChange={(e) =>
                  setForm({ ...form, recipient_title: e.target.value })
                }
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) =>
                  setForm({ ...form, effective_date: e.target.value })
                }
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as "draft" | "final",
                  })
                }
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400"
              >
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
              Content
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={16}
              className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 font-mono leading-relaxed resize-y"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg max-w-3xl mx-auto print:border-0 print:shadow-none">
          <div className="bg-coco-midnight px-4 sm:px-10 py-4 sm:py-6 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-coco-accent/20 border-2 border-coco-accent/40 flex items-center justify-center">
                <span className="text-coco-gold font-black text-base sm:text-lg">
                  CG
                </span>
              </div>
              <div>
                <p className="text-coco-gold font-black text-sm sm:text-lg tracking-widest uppercase">
                  COCO GAMES
                </p>
                <p className="text-coco-cream/40 text-[10px] sm:text-xs tracking-wider">
                  GAME STUDIO
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-coco-cream/60 text-xs capitalize">
                {doc.type}
              </p>
              {doc.effective_date && (
                <p className="text-coco-cream/40 text-[10px] sm:text-xs">
                  {new Date(doc.effective_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              <p
                className={`text-[10px] font-bold mt-1 ${
                  doc.status === "final" ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {doc.status.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-coco-accent via-coco-gold to-coco-ember" />

          <div className="px-4 sm:px-10 py-5 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-black text-coco-dark mb-4 sm:mb-6 tracking-wide uppercase">
              {doc.title}
            </h2>
            {(doc.recipient_name || doc.recipient_title) && (
              <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-coco-dark/5">
                {doc.recipient_name && (
                  <p className="text-sm font-bold text-coco-dark">
                    {doc.recipient_name}
                  </p>
                )}
                {doc.recipient_title && (
                  <p className="text-xs text-coco-coffee/60">
                    {doc.recipient_title}
                  </p>
                )}
              </div>
            )}
            <StructuredContent doc={doc} />
            {doc.type === "contract" && doc.status === "final" && (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
                <div>
                  <div className="border-b-2 border-coco-dark/20 mb-2 h-10" />
                  <p className="text-xs font-bold text-coco-dark">
                    COCO GAMES
                  </p>
                  <p className="text-[10px] text-coco-coffee/50">
                    Authorized Representative
                  </p>
                  <p className="text-[10px] text-coco-coffee/50 mt-1">
                    Date: _______________
                  </p>
                </div>
                <div>
                  <div className="border-b-2 border-coco-dark/20 mb-2 h-10" />
                  <p className="text-xs font-bold text-coco-dark">
                    {doc.recipient_name || "CONTRACTOR"}
                  </p>
                  <p className="text-[10px] text-coco-coffee/50">
                    {doc.recipient_title || "Contractor"}
                  </p>
                  <p className="text-[10px] text-coco-coffee/50 mt-1">
                    Date: _______________
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-coco-dark/5 px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between">
            <p className="text-[10px] text-coco-coffee/40 uppercase tracking-wider">
              Confidential &mdash; COCO GAMES
            </p>
            <p className="text-[10px] text-coco-coffee/40">cocogames.com</p>
          </div>
        </div>
      )}

      {/* Form Fields Manager */}
      <FormFieldsManager documentId={doc.id} />

      {/* Sent History */}
      <SentHistory
        documentId={doc.id}
        key={`sent-${sentRefresh}`}
      />

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          documentId={doc.id}
          onClose={() => setShowSendModal(false)}
          onSent={() => setSentRefresh((n) => n + 1)}
        />
      )}
    </div>
  );
}
