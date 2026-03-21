"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---

interface BoardLabel {
  id: string;
  name: string;
  color: string;
}

interface CardLabel {
  card_id: string;
  label_id: string;
  board_labels?: BoardLabel;
}

interface RawChecklist {
  id: string;
  card_id: string;
  title: string;
  position: number;
}

interface RawChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  completed: boolean;
  position: number;
}

interface ChecklistWithItems extends RawChecklist {
  items: RawChecklistItem[];
}

interface Comment {
  id: string;
  content: string;
  author_discord_id: string;
  discord_username?: string;
  role?: string;
  created_at: string;
}

interface Assignee {
  discord_id: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
}

interface CardDetailRaw {
  id: string;
  title: string;
  description: string | null;
  card_type: "card" | "request";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string | null;
  created_at: string;
  checklists: RawChecklist[];
  checklist_items: RawChecklistItem[];
  comments: Comment[];
  assignees: Assignee[];
  labels: CardLabel[];
  attachments: Attachment[];
}

interface SearchUser {
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
}

interface CardDetailModalProps {
  cardId: string;
  boardId: string;
  onClose: () => void;
  onUpdate: () => void;
}

// --- Constants ---

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  normal: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const roleBadgeColors: Record<string, string> = {
  owner: "bg-orange-500/20 text-orange-400",
  executive: "bg-green-500/20 text-green-400",
  admin: "bg-red-500/20 text-red-400",
  developer: "bg-violet-500/20 text-violet-400",
  mod: "bg-blue-500/20 text-blue-400",
  contractor: "bg-amber-500/20 text-amber-400",
};

// --- Helpers ---

function nestChecklistItems(
  checklists: RawChecklist[],
  items: RawChecklistItem[]
): ChecklistWithItems[] {
  const sorted = [...checklists].sort((a, b) => a.position - b.position);
  return sorted.map((cl) => ({
    ...cl,
    items: items
      .filter((item) => item.checklist_id === cl.id)
      .sort((a, b) => a.position - b.position),
  }));
}

function getChecklistProgress(checklist: ChecklistWithItems): number {
  if (checklist.items.length === 0) return 0;
  return Math.round(
    (checklist.items.filter((i) => i.completed).length /
      checklist.items.length) *
      100
  );
}

function getDiscordAvatarUrl(discordId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=64`;
}

// --- Component ---

export default function CardDetailModal({
  cardId,
  boardId,
  onClose,
  onUpdate,
}: CardDetailModalProps) {
  const [card, setCard] = useState<CardDetailRaw | null>(null);
  const [checklists, setChecklists] = useState<ChecklistWithItems[]>([]);
  const [boardLabels, setBoardLabels] = useState<BoardLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [dueDate, setDueDate] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  // Assignees
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeResults, setAssigneeResults] = useState<SearchUser[]>([]);
  const [assigneeSearching, setAssigneeSearching] = useState(false);
  const assigneeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assigneeInputRef = useRef<HTMLInputElement>(null);

  // Labels
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  // Checklists
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const itemInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Comments
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // --- Data fetching ---

  const fetchCard = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`);
      if (res.ok) {
        const data: CardDetailRaw = await res.json();
        setCard(data);
        setChecklists(nestChecklistItems(data.checklists, data.checklist_items));
        setTitle(data.title);
        setDescription(data.description || "");
        setPriority(data.priority || "normal");
        setDueDate(data.due_date ? data.due_date.slice(0, 10) : "");
      }
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, [boardId, cardId]);

  const fetchBoardLabels = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/labels`);
      if (res.ok) {
        const data = await res.json();
        setBoardLabels(Array.isArray(data) ? data : data.labels ?? []);
      }
    } catch {
      // network error
    }
  }, [boardId]);

  useEffect(() => {
    fetchCard();
    fetchBoardLabels();
  }, [fetchCard, fetchBoardLabels]);

  // --- Generic card field save (title, description, priority, due_date) ---

  const saveField = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        await fetchCard();
        onUpdate();
      }
    } catch {
      // network error
    } finally {
      setSaving(false);
    }
  };

  // --- Field handlers ---

  const handleTitleSave = () => {
    if (title.trim() && title !== card?.title) {
      saveField({ title: title.trim() });
    }
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    if (description !== (card?.description || "")) {
      saveField({ description: description || null });
    }
    setEditingDesc(false);
  };

  const handlePriorityChange = (p: string) => {
    setPriority(p);
    saveField({ priority: p });
  };

  const handleDueDateChange = (d: string) => {
    setDueDate(d);
    saveField({ due_date: d || null });
  };

  // --- Labels (POST/DELETE to dedicated route) ---

  const handleToggleLabel = async (labelId: string) => {
    const isActive = card?.labels.some((l) => l.label_id === labelId);
    try {
      if (isActive) {
        await fetch(`/api/boards/${boardId}/cards/${cardId}/labels`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label_id: labelId }),
        });
      } else {
        await fetch(`/api/boards/${boardId}/cards/${cardId}/labels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label_id: labelId }),
        });
      }
      await fetchCard();
      onUpdate();
    } catch {
      // network error
    }
  };

  // --- Assignees (POST/DELETE to dedicated route) ---

  const handleAssigneeSearch = (query: string) => {
    setAssigneeQuery(query);
    if (assigneeDebounceRef.current) {
      clearTimeout(assigneeDebounceRef.current);
    }
    if (!query.trim()) {
      setAssigneeResults([]);
      setAssigneeSearching(false);
      return;
    }
    setAssigneeSearching(true);
    assigneeDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/users?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setAssigneeResults(data.users ?? []);
        }
      } catch {
        // network error
      } finally {
        setAssigneeSearching(false);
      }
    }, 300);
  };

  const handleAddAssignee = async (discordId: string) => {
    const alreadyAssigned = card?.assignees.some(
      (a) => a.discord_id === discordId
    );
    if (alreadyAssigned) return;
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discord_id: discordId }),
      });
      await fetchCard();
      onUpdate();
    } catch {
      // network error
    }
    setAssigneeQuery("");
    setAssigneeResults([]);
    setShowAddAssignee(false);
  };

  const handleRemoveAssignee = async (discordId: string) => {
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discord_id: discordId }),
      });
      await fetchCard();
      onUpdate();
    } catch {
      // network error
    }
  };

  // --- Checklists ---

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChecklistTitle.trim() }),
      });
      setNewChecklistTitle("");
      setShowAddChecklist(false);
      await fetchCard();
      onUpdate();
    } catch {
      // network error
    }
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist_id: checklistId, content: text }),
      });
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: "" }));
      await fetchCard();
      onUpdate();
      // Keep focus on the input for rapid entry
      requestAnimationFrame(() => {
        itemInputRefs.current[checklistId]?.focus();
      });
    } catch {
      // network error
    }
  };

  const handleToggleChecklistItem = async (
    itemId: string,
    currentCompleted: boolean
  ) => {
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/checklists`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, completed: !currentCompleted }),
      });
      await fetchCard();
      onUpdate();
    } catch {
      // network error
    }
  };

  // --- Comments ---

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment("");
      await fetchCard();
    } catch {
      // network error
    } finally {
      setSubmittingComment(false);
    }
  };

  // --- Archive ---

  const handleArchive = async () => {
    if (!confirm("Archive this card?")) return;
    try {
      await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
        method: "DELETE",
      });
      onUpdate();
      onClose();
    } catch {
      // network error
    }
  };

  // --- Render ---

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#1e1e2e] border border-[#2a2a3d] shadow-2xl mx-4 my-4 sm:my-12 rounded-lg"
      >
        {loading ? (
          <div className="p-6 animate-pulse h-64" />
        ) : !card ? (
          <div className="p-6 text-center">
            <p className="text-gray-400 font-medium">Card not found.</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 text-gray-200">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-white text-lg font-bold transition-colors rounded"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>

            {/* Card Type Badge */}
            {card.card_type === "request" && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded mb-2 inline-block">
                REQUEST
              </span>
            )}

            {/* Title */}
            <div className="mb-4 pr-8">
              {editingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave();
                    if (e.key === "Escape") {
                      setTitle(card.title);
                      setEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-xl font-black text-gray-100 w-full px-2 py-1 border border-[#E8944A] bg-[#2a2a3d] rounded focus:outline-none min-h-[40px]"
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-black text-gray-100 cursor-pointer hover:bg-[#2f2f45] px-2 py-1 -mx-2 rounded transition-colors"
                >
                  {card.title}
                </h2>
              )}
            </div>

            {/* Labels */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {card.labels.map((cl) => {
                  const lbl = cl.board_labels;
                  if (!lbl) return null;
                  return (
                    <span
                      key={cl.label_id}
                      className="text-[10px] font-bold px-2 py-0.5 text-white rounded"
                      style={{ backgroundColor: lbl.color }}
                    >
                      {lbl.name}
                    </span>
                  );
                })}
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="text-[10px] font-bold px-2 py-0.5 bg-[#252538] text-gray-400 hover:bg-[#2f2f45] transition-colors min-h-[40px] rounded"
                >
                  {showLabelPicker ? "Done" : "+ Label"}
                </button>
              </div>
              {showLabelPicker && (
                <div className="mt-2 p-3 border border-[#2a2a3d] bg-[#252538] rounded space-y-1">
                  {boardLabels.map((label) => {
                    const isActive = card.labels.some(
                      (l) => l.label_id === label.id
                    );
                    return (
                      <button
                        key={label.id}
                        onClick={() => handleToggleLabel(label.id)}
                        className={`flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm transition-colors min-h-[40px] rounded ${
                          isActive
                            ? "bg-[#E8944A]/10"
                            : "hover:bg-[#2f2f45]"
                        }`}
                      >
                        <span
                          className="w-4 h-4 flex-shrink-0 rounded-sm"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-gray-200 font-medium">
                          {label.name}
                        </span>
                        {isActive && (
                          <span className="ml-auto text-[#E8944A] font-bold text-xs">
                            active
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {boardLabels.length === 0 && (
                    <p className="text-xs text-gray-500 italic py-2">
                      No labels available for this board.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Meta Row: Priority + Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={saving}
                  className={`w-full px-3 py-2 border text-sm font-bold uppercase rounded focus:outline-none focus:border-[#E8944A] transition-colors min-h-[40px] bg-[#2a2a3d] ${
                    priorityColors[priority] || priorityColors.normal
                  }`}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-[#2a2a3d] bg-[#2a2a3d] text-gray-200 text-sm rounded focus:outline-none focus:border-[#E8944A] transition-colors min-h-[40px] [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Description
              </label>
              {editingDesc ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    autoFocus
                    className="w-full px-3 py-2 border border-[#E8944A] bg-[#2a2a3d] text-gray-200 text-sm rounded focus:outline-none resize-none min-h-[40px]"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleDescSave}
                      className="text-xs py-1 px-3 min-h-[40px] bg-[#E8944A] text-white font-bold rounded hover:bg-[#d4833f] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setDescription(card.description || "");
                        setEditingDesc(false);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-300 font-bold min-h-[40px] px-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="px-3 py-2 border border-[#2a2a3d] bg-[#252538] text-sm text-gray-300 min-h-[60px] cursor-pointer hover:border-[#E8944A]/50 transition-colors whitespace-pre-wrap rounded"
                >
                  {card.description || (
                    <span className="text-gray-600 italic">
                      Click to add a description...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Assignees */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Assignees
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {card.assignees.map((a) => (
                  <div
                    key={a.discord_id}
                    className="flex items-center gap-1.5 bg-[#252538] px-2 py-1 text-xs group rounded"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#2a2a3d] flex items-center justify-center overflow-hidden flex-shrink-0">
                      <span className="text-[8px] font-bold text-gray-400">
                        {a.discord_id.slice(-2).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-300 font-mono text-[10px]">
                      {a.discord_id}
                    </span>
                    <button
                      onClick={() => handleRemoveAssignee(a.discord_id)}
                      className="text-gray-600 hover:text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-all min-h-[40px] min-w-[24px] flex items-center justify-center"
                      aria-label="Remove assignee"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2l-6 6" />
                      </svg>
                    </button>
                  </div>
                ))}
                {showAddAssignee ? (
                  <div className="relative w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                      <input
                        ref={assigneeInputRef}
                        type="text"
                        value={assigneeQuery}
                        onChange={(e) => handleAssigneeSearch(e.target.value)}
                        placeholder="Search users..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setShowAddAssignee(false);
                            setAssigneeQuery("");
                            setAssigneeResults([]);
                          }
                        }}
                        className="px-2 py-1 border border-[#2a2a3d] bg-[#2a2a3d] text-gray-200 text-xs w-48 rounded focus:outline-none focus:border-[#E8944A] min-h-[40px]"
                      />
                      <button
                        onClick={() => {
                          setShowAddAssignee(false);
                          setAssigneeQuery("");
                          setAssigneeResults([]);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-300 font-bold min-h-[40px] px-1 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 3l6 6M9 3l-6 6" />
                        </svg>
                      </button>
                    </div>
                    {/* Dropdown results */}
                    {(assigneeResults.length > 0 || assigneeSearching) && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-[#252538] border border-[#2a2a3d] rounded shadow-xl z-10 max-h-48 overflow-y-auto">
                        {assigneeSearching && assigneeResults.length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            Searching...
                          </div>
                        )}
                        {assigneeResults.map((user) => {
                          const alreadyAssigned = card.assignees.some(
                            (a) => a.discord_id === user.discord_id
                          );
                          return (
                            <button
                              key={user.discord_id}
                              onClick={() => handleAddAssignee(user.discord_id)}
                              disabled={alreadyAssigned}
                              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors min-h-[40px] ${
                                alreadyAssigned
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-[#2f2f45]"
                              }`}
                            >
                              <div className="w-6 h-6 rounded-full bg-[#2a2a3d] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user.discord_avatar ? (
                                  <img
                                    src={getDiscordAvatarUrl(user.discord_id, user.discord_avatar) ?? ""}
                                    alt={user.discord_username}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400">
                                    {user.discord_username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-200 font-medium truncate">
                                {user.discord_username}
                              </span>
                              {alreadyAssigned && (
                                <span className="ml-auto text-[10px] text-gray-500">
                                  assigned
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddAssignee(true)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-[#252538] text-gray-400 hover:bg-[#2f2f45] transition-colors min-h-[40px] rounded"
                  >
                    + Assign
                  </button>
                )}
              </div>
            </div>

            {/* Checklists */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Checklists
                </label>
                <button
                  onClick={() => setShowAddChecklist(!showAddChecklist)}
                  className="text-[10px] font-bold text-[#E8944A] hover:text-[#d4833f] min-h-[40px] px-2 transition-colors"
                >
                  {showAddChecklist ? "Cancel" : "+ Add Checklist"}
                </button>
              </div>

              {showAddChecklist && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist title..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddChecklist();
                    }}
                    className="flex-1 px-3 py-2 border border-[#2a2a3d] bg-[#2a2a3d] text-gray-200 text-sm rounded focus:outline-none focus:border-[#E8944A] min-h-[40px]"
                  />
                  <button
                    onClick={handleAddChecklist}
                    disabled={!newChecklistTitle.trim()}
                    className="text-xs py-1 px-3 bg-[#E8944A] text-white font-bold rounded hover:bg-[#d4833f] disabled:opacity-50 transition-colors min-h-[40px]"
                  >
                    Add
                  </button>
                </div>
              )}

              {checklists.map((checklist) => {
                const progress = getChecklistProgress(checklist);
                return (
                  <div
                    key={checklist.id}
                    className="border border-[#2a2a3d] bg-[#252538] p-3 mb-2 rounded"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-200">
                        {checklist.title}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">
                        {progress}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#1e1e2e] rounded-full mb-2 overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          progress === 100
                            ? "bg-green-500"
                            : "bg-[#E8944A]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {/* Items */}
                    <div className="space-y-1">
                      {checklist.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            handleToggleChecklistItem(item.id, item.completed)
                          }
                          className={`flex items-center gap-2 w-full text-left text-sm py-1 px-1 hover:bg-[#2f2f45] transition-colors min-h-[40px] rounded ${
                            item.completed
                              ? "text-gray-600 line-through"
                              : "text-gray-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center text-[10px] rounded-sm ${
                              item.completed
                                ? "bg-[#E8944A] border-[#E8944A] text-white"
                                : "border-gray-600"
                            }`}
                          >
                            {item.completed && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 5l2.5 2.5L8 3" />
                              </svg>
                            )}
                          </span>
                          {item.content}
                        </button>
                      ))}
                    </div>
                    {/* Add Item */}
                    <div className="mt-2 flex gap-1">
                      <input
                        ref={(el) => {
                          itemInputRefs.current[checklist.id] = el;
                        }}
                        type="text"
                        value={newItemTexts[checklist.id] || ""}
                        onChange={(e) =>
                          setNewItemTexts((prev) => ({
                            ...prev,
                            [checklist.id]: e.target.value,
                          }))
                        }
                        placeholder="Add item..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleAddChecklistItem(checklist.id);
                        }}
                        className="flex-1 px-2 py-1 border border-[#2a2a3d] bg-[#2a2a3d] text-gray-200 text-xs rounded focus:outline-none focus:border-[#E8944A] min-h-[40px]"
                      />
                      <button
                        onClick={() => handleAddChecklistItem(checklist.id)}
                        disabled={!newItemTexts[checklist.id]?.trim()}
                        className="text-xs font-bold text-[#E8944A] hover:text-[#d4833f] disabled:opacity-30 min-h-[40px] px-2 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Attachments */}
            {card.attachments.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Attachments
                </label>
                <div className="space-y-1">
                  {card.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-[#252538] hover:bg-[#2f2f45] rounded text-sm text-gray-300 transition-colors min-h-[40px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-500">
                        <path d="M7.5 1.5l-4 4a2.83 2.83 0 004 4l4-4a1.89 1.89 0 00-2.67-2.67l-4 4a.94.94 0 001.34 1.34l3.33-3.34" />
                      </svg>
                      <span className="truncate">{att.file_name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Comments
              </label>
              <div className="space-y-2 mb-3">
                {card.comments.length === 0 ? (
                  <p className="text-xs text-gray-600 italic py-2">
                    No comments yet.
                  </p>
                ) : (
                  card.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border border-[#2a2a3d] bg-[#252538] p-3 rounded"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-gray-200">
                          {comment.discord_username || comment.author_discord_id}
                        </span>
                        {comment.role && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              roleBadgeColors[comment.role.toLowerCase()] ||
                              "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {comment.role}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-600 ml-auto">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-[#2a2a3d] bg-[#2a2a3d] text-gray-200 text-sm rounded focus:outline-none focus:border-[#E8944A] min-h-[40px]"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="text-xs py-1 px-4 bg-[#E8944A] text-white font-bold rounded hover:bg-[#d4833f] disabled:opacity-50 transition-colors min-h-[40px]"
                >
                  {submittingComment ? "..." : "Send"}
                </button>
              </form>
            </div>

            {/* Created date + Archive */}
            <div className="pt-4 border-t border-[#2a2a3d] flex items-center justify-between">
              <span className="text-[10px] text-gray-600">
                Created {new Date(card.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={handleArchive}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors min-h-[40px] px-2"
              >
                Archive Card
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
