"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Document {
  id: string;
  type: "contract" | "invoice" | "letter" | "memo";
  title: string;
  status: "draft" | "final";
  recipient_name: string | null;
  created_at: string;
  updated_at: string;
}

const typeLabel: Record<string, { label: string; color: string }> = {
  contract: { label: "Contract", color: "bg-purple-100 text-purple-700 border-purple-300" },
  invoice: { label: "Invoice", color: "bg-blue-100 text-blue-700 border-blue-300" },
  letter: { label: "Letter", color: "bg-coco-warm text-coco-accent border-coco-accent/30" },
  memo: { label: "Memo", color: "bg-gray-100 text-gray-600 border-gray-300" },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("type", filter);
      const res = await fetch(`/api/accounting/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/accounting/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchDocs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-coco-dark">Documents</h2>
        <Link href="/accounting/documents/new" className="btn-primary text-xs !px-4 !py-2">
          + New Document
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: "All" },
          { value: "contract", label: "Contracts" },
          { value: "invoice", label: "Invoices" },
          { value: "letter", label: "Letters" },
          { value: "memo", label: "Memos" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs font-bold border-2 transition-colors ${
              filter === f.value
                ? "border-green-400 bg-green-50 text-green-700"
                : "border-coco-dark/10 text-coco-coffee hover:border-green-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Document Cards */}
      {loading ? (
        <div className="p-8 text-center text-coco-coffee/60">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="card p-8 text-center text-coco-coffee/60">
          No documents yet. Create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card-interactive p-5 group">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 border ${typeLabel[doc.type]?.color || ""}`}>
                  {typeLabel[doc.type]?.label || doc.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                  doc.status === "final"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                }`}>
                  {doc.status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-coco-dark text-sm mb-1 line-clamp-2">{doc.title}</h3>
              {doc.recipient_name && (
                <p className="text-xs text-coco-coffee/50">To: {doc.recipient_name}</p>
              )}
              <p className="text-xs text-coco-coffee/40 mt-2">
                {new Date(doc.updated_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-coco-dark/5">
                <Link
                  href={`/accounting/documents/${doc.id}`}
                  className="text-xs text-green-600 hover:text-green-800 font-bold"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
