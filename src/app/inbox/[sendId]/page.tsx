"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SignaturePad = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
});

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  sort_order: number;
}

interface DocumentSendDetail {
  id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  document_content: string;
  sender_name: string;
  status: "pending" | "viewed" | "completed" | "declined" | "expired";
  sent_at: string;
  expires_at: string | null;
  message: string | null;
  recipient_name: string | null;
  recipient_title: string | null;
  effective_date: string | null;
  form_fields: FormField[];
  form_responses: Record<string, string | boolean> | null;
  signature_data: string | null;
}

function tryParseJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Render document content in letterhead format
function DocumentContent({ doc }: { doc: DocumentSendDetail }) {
  const parsed = tryParseJSON(doc.document_content);

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
                    item: { description: string; quantity: number; rate: number },
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

  // Contract (HTML) or plain text
  if (
    doc.document_content.includes("<") &&
    doc.document_content.includes(">")
  ) {
    return (
      <div
        className="text-sm text-coco-dark leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: doc.document_content }}
      />
    );
  }

  return (
    <div className="text-sm text-coco-dark leading-relaxed whitespace-pre-wrap">
      {doc.document_content}
    </div>
  );
}

export default function InboxDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const sendId = params.sendId as string;

  const [doc, setDoc] = useState<DocumentSendDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formResponses, setFormResponses] = useState<
    Record<string, string | boolean>
  >({});
  const [signatureData, setSignatureData] = useState("");
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/sends/${sendId}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);
        if (data.form_responses) {
          setFormResponses(data.form_responses);
        }
        if (data.signature_data) {
          setSignatureData(data.signature_data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [sendId]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFormResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSign = async () => {
    if (!doc) return;

    // Validate required fields
    const missingFields = doc.form_fields
      .filter((f) => f.required)
      .filter((f) => {
        const val = formResponses[f.id];
        if (f.type === "checkbox") return val !== true;
        if (f.type === "signature") return !signatureData;
        return !val || (typeof val === "string" && !val.trim());
      });

    if (missingFields.length > 0) {
      alert(
        `Please fill in required fields: ${missingFields
          .map((f) => f.label)
          .join(", ")}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/sends/${sendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          form_responses: formResponses,
          signature_data: signatureData || null,
        }),
      });
      if (res.ok) {
        await fetchDoc();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/sends/${sendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          decline_reason: declineReason || null,
        }),
      });
      if (res.ok) {
        await fetchDoc();
        setDeclineMode(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to decline");
      }
    } finally {
      setSubmitting(false);
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

  const isReadOnly =
    doc.status === "completed" ||
    doc.status === "declined" ||
    doc.status === "expired";
  const hasSignatureField = doc.form_fields.some(
    (f) => f.type === "signature"
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/inbox")}
          className="text-xs text-coco-accent hover:text-coco-ember font-bold min-h-[40px]"
        >
          &larr; Back to Inbox
        </button>
        {isReadOnly && (
          <span
            className={`text-[10px] font-bold px-2 py-1 border ${
              doc.status === "completed"
                ? "bg-green-100 text-green-700 border-green-300"
                : doc.status === "declined"
                ? "bg-red-100 text-red-700 border-red-300"
                : "bg-gray-100 text-gray-500 border-gray-300"
            }`}
          >
            {doc.status.toUpperCase()}
          </span>
        )}
      </div>

      {/* Sender message */}
      {doc.message && (
        <div className="card p-3 sm:p-4 bg-blue-50 border-blue-200">
          <p className="text-xs font-bold text-blue-700 mb-1">
            Message from {doc.sender_name}
          </p>
          <p className="text-sm text-blue-800">{doc.message}</p>
        </div>
      )}

      {/* Document in letterhead format */}
      <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg max-w-3xl mx-auto">
        {/* Dark header with CG logo */}
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
              {doc.document_type}
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
          </div>
        </div>
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-coco-accent via-coco-gold to-coco-ember" />

        {/* Document body */}
        <div className="px-4 sm:px-10 py-5 sm:py-8">
          <h2 className="text-xl sm:text-2xl font-black text-coco-dark mb-4 sm:mb-6 tracking-wide uppercase">
            {doc.document_title}
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
          <DocumentContent doc={doc} />
        </div>

        {/* Footer */}
        <div className="border-t-2 border-coco-dark/5 px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between">
          <p className="text-[10px] text-coco-coffee/40 uppercase tracking-wider">
            Confidential &mdash; COCO GAMES
          </p>
          <p className="text-[10px] text-coco-coffee/40">cocogames.com</p>
        </div>
      </div>

      {/* Form fields section */}
      {doc.form_fields.length > 0 && (
        <div className="card p-4 sm:p-6 max-w-3xl mx-auto">
          <h3 className="text-sm font-black text-coco-dark uppercase tracking-wider mb-4">
            {isReadOnly ? "Submitted Responses" : "Please Complete"}
          </h3>
          <div className="space-y-4">
            {doc.form_fields
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((field) => (
                <div key={field.id}>
                  <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      value={(formResponses[field.id] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors disabled:bg-gray-50 disabled:text-coco-coffee/60"
                    />
                  )}

                  {field.type === "email" && (
                    <input
                      type="email"
                      value={(formResponses[field.id] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors disabled:bg-gray-50 disabled:text-coco-coffee/60"
                    />
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      value={(formResponses[field.id] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors disabled:bg-gray-50 disabled:text-coco-coffee/60"
                    />
                  )}

                  {field.type === "number" && (
                    <input
                      type="number"
                      value={(formResponses[field.id] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors disabled:bg-gray-50 disabled:text-coco-coffee/60"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      value={(formResponses[field.id] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      rows={4}
                      className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors resize-y disabled:bg-gray-50 disabled:text-coco-coffee/60"
                    />
                  )}

                  {field.type === "checkbox" && (
                    <label className="flex items-center gap-3 min-h-[40px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          (formResponses[field.id] as boolean) || false
                        }
                        onChange={(e) =>
                          handleFieldChange(field.id, e.target.checked)
                        }
                        disabled={isReadOnly}
                        className="w-5 h-5 border-2 border-coco-dark/20 accent-green-600"
                      />
                      <span className="text-sm text-coco-dark">
                        I agree / confirm
                      </span>
                    </label>
                  )}

                  {field.type === "select" && (
                    <select
                      value={(formResponses[field.id] as string) || ""}
                      onChange={(e) =>
                        handleFieldChange(field.id, e.target.value)
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-green-400 transition-colors disabled:bg-gray-50 disabled:text-coco-coffee/60 min-h-[40px]"
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === "signature" && (
                    <div>
                      {isReadOnly && signatureData ? (
                        <div className="border-2 border-coco-dark/10 bg-white p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={signatureData}
                            alt="Signature"
                            className="max-h-[150px] w-auto"
                          />
                        </div>
                      ) : isReadOnly ? (
                        <p className="text-xs text-coco-coffee/40 italic">
                          No signature provided
                        </p>
                      ) : (
                        <SignaturePad
                          onSave={setSignatureData}
                          initialData={signatureData || undefined}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Signature pad if no explicit signature field but document needs signing */}
      {!hasSignatureField && !isReadOnly && (
        <div className="card p-4 sm:p-6 max-w-3xl mx-auto">
          <h3 className="text-sm font-black text-coco-dark uppercase tracking-wider mb-3">
            Signature
          </h3>
          <SignaturePad
            onSave={setSignatureData}
            initialData={signatureData || undefined}
          />
        </div>
      )}

      {!hasSignatureField && isReadOnly && signatureData && (
        <div className="card p-4 sm:p-6 max-w-3xl mx-auto">
          <h3 className="text-sm font-black text-coco-dark uppercase tracking-wider mb-3">
            Signature
          </h3>
          <div className="border-2 border-coco-dark/10 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureData}
              alt="Signature"
              className="max-h-[150px] w-auto"
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="max-w-3xl mx-auto space-y-3">
          {declineMode ? (
            <div className="card p-4 sm:p-6 border-red-200">
              <h3 className="text-sm font-bold text-red-700 mb-3">
                Decline Document
              </h3>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (optional)..."
                rows={3}
                className="w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-red-400 transition-colors resize-y mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setDeclineMode(false)}
                  className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting}
                  className="text-xs px-4 py-2 font-bold border-2 border-red-400 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  {submitting ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSign}
                disabled={submitting}
                className="btn-primary text-sm !px-6 !py-3 disabled:opacity-50 min-h-[44px] flex-1 sm:flex-none"
              >
                {submitting ? "Submitting..." : "Sign & Complete"}
              </button>
              <button
                onClick={() => setDeclineMode(true)}
                className="text-xs px-4 py-2 font-bold border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
