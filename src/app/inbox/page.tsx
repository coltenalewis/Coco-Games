"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DocumentSend {
  id: string;
  document_id: string;
  document_title: string;
  sender_name: string;
  status: "pending" | "viewed" | "completed" | "declined" | "expired";
  sent_at: string;
  expires_at: string | null;
  message: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  viewed: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  declined: "bg-red-100 text-red-700 border-red-300",
  expired: "bg-gray-100 text-gray-500 border-gray-300",
};

export default function InboxPage() {
  const router = useRouter();
  const [sends, setSends] = useState<DocumentSend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/documents/sends?inbox=true");
        if (res.ok) {
          const data = await res.json();
          setSends(data.sends || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <span className="text-green-600 font-bold text-xs uppercase tracking-[0.2em]">
          Documents
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-coco-dark mt-1">
          Inbox
        </h1>
      </div>

      {loading ? (
        <div className="p-8 text-center text-coco-coffee/60">Loading...</div>
      ) : sends.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <div className="text-4xl mb-3 text-coco-coffee/20">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51M21.75 9l-9.592-4.963a2.25 2.25 0 00-2.316 0L2.25 9" />
            </svg>
          </div>
          <p className="text-sm font-bold text-coco-dark">No pending documents</p>
          <p className="text-xs text-coco-coffee/50 mt-1">
            Documents sent to you will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sends.map((send) => (
            <button
              key={send.id}
              onClick={() => router.push(`/inbox/${send.id}`)}
              className="card p-4 sm:p-5 text-left hover:border-green-400 transition-colors w-full min-h-[44px]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-coco-dark truncate">
                    {send.document_title}
                  </h3>
                  <p className="text-xs text-coco-coffee/60 mt-0.5">
                    From: {send.sender_name}
                  </p>
                  {send.message && (
                    <p className="text-xs text-coco-coffee/40 mt-1 line-clamp-1 italic">
                      &ldquo;{send.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border ${
                      statusColors[send.status] || statusColors.pending
                    }`}
                  >
                    {send.status.toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] text-coco-coffee/40">
                      {new Date(send.sent_at).toLocaleDateString()}
                    </p>
                    {send.expires_at && (
                      <p className="text-[10px] text-red-400">
                        Expires{" "}
                        {new Date(send.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
