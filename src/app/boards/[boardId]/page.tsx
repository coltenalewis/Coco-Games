"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import CardDetailModal from "@/components/boards/CardDetailModal";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Assignee {
  discord_id: string;
  username: string;
  avatar: string | null;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: string;
  labels: Label[];
  assignees: Assignee[];
  due_date: string | null;
  checklistTotal: number;
  checklistDone: number;
  checklists: Checklist[];
  card_type: string;
}

interface BoardList {
  id: string;
  name: string;
  position: number;
  cards: Card[];
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  color: string;
  labels: Label[];
}

interface BoardData {
  board: Board;
  lists: BoardList[];
  canEdit: boolean;
}

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.boardId as string;

  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Add list state
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [addingList, setAddingList] = useState(false);

  // Add card state per list
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [submittingCard, setSubmittingCard] = useState(false);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      if (res.ok) {
        const json = await res.json();
        // API returns flat: { id, name, color, lists, cards, labels, assignees, canEdit }
        // Restructure: nest cards into their lists
        const rawLists = (json.lists || []) as { id: string; name: string; position: number }[];
        const rawCards = (json.cards || []) as { id: string; list_id: string; title: string; description: string | null; position: number; due_date: string | null; card_type: string; priority: string }[];
        const rawAssignees = (json.assignees || []) as { card_id: string; discord_id: string; username?: string; avatar?: string | null }[];
        const checklistProgress = (json.checklistProgress || {}) as Record<string, { total: number; done: number }>;
        const rawLabels = (json.labels || []) as Label[];
        const rawCardLabels = (json.cardLabels || []) as { card_id: string; label_id: string }[];

        // Build label lookup
        const labelMap = new Map(rawLabels.map((l) => [l.id, l]));

        const lists: BoardList[] = rawLists
          .sort((a, b) => a.position - b.position)
          .map((list) => ({
            ...list,
            cards: rawCards
              .filter((c) => c.list_id === list.id)
              .sort((a, b) => a.position - b.position)
              .map((card) => ({
                ...card,
                labels: rawCardLabels
                  .filter((cl) => cl.card_id === card.id)
                  .map((cl) => labelMap.get(cl.label_id))
                  .filter(Boolean) as Label[],
                assignees: rawAssignees
                  .filter((a) => a.card_id === card.id)
                  .map((a) => ({
                    discord_id: a.discord_id,
                    username: a.username || a.discord_id,
                    avatar: a.avatar ? `https://cdn.discordapp.com/avatars/${a.discord_id}/${a.avatar}.png?size=64` : null,
                  })),
                checklistTotal: checklistProgress[card.id]?.total || 0,
                checklistDone: checklistProgress[card.id]?.done || 0,
                checklists: [],
              })),
          }));

        setData({
          board: { id: json.id, name: json.name, description: json.description, color: json.color, labels: rawLabels },
          lists,
          canEdit: json.canEdit ?? true,
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !data) return;

    const { draggableId, source, destination } = result;

    // Optimistic update
    const newLists = data.lists.map((list) => ({
      ...list,
      cards: [...list.cards],
    }));

    const sourceList = newLists.find((l) => l.id === source.droppableId);
    const destList = newLists.find((l) => l.id === destination.droppableId);
    if (!sourceList || !destList) return;

    const [movedCard] = sourceList.cards.splice(source.index, 1);
    destList.cards.splice(destination.index, 0, movedCard);

    setData({ ...data, lists: newLists });

    try {
      await fetch(`/api/boards/${boardId}/cards/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: draggableId,
          targetListId: destination.droppableId,
          newPosition: destination.index,
        }),
      });
    } catch {
      fetchBoard();
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setAddingList(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          position: data?.lists.length || 0,
        }),
      });
      if (res.ok) {
        setNewListName("");
        setShowAddList(false);
        fetchBoard();
      }
    } catch {
      // ignore
    } finally {
      setAddingList(false);
    }
  };

  const handleAddCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;

    setSubmittingCard(true);
    try {
      const targetList = data?.lists.find((l) => l.id === listId);
      const res = await fetch(`/api/boards/${boardId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCardTitle,
          list_id: listId,
          position: targetList?.cards.length || 0,
        }),
      });
      if (res.ok) {
        setNewCardTitle("");
        setAddingCardListId(null);
        fetchBoard();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingCard(false);
    }
  };

  // Delete list handler
  const handleDeleteList = async (listId: string) => {
    if (!confirm("Delete this list and archive all its cards?")) return;
    await fetch(`/api/boards/${boardId}/lists`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId }),
    });
    fetchBoard();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="card p-6 animate-pulse h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-coco-coffee font-medium">Board not found.</p>
        <Link
          href="/boards"
          className="text-coco-accent text-sm mt-2 inline-block"
        >
          Back to Boards
        </Link>
      </div>
    );
  }

  const { board, lists } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-[#2a2a3d] bg-[#1a1a2e] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/boards"
            className="text-coco-accent hover:text-coco-ember text-sm font-bold min-h-[40px] flex items-center"
          >
            &larr;
          </Link>
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: board.color || "#E8944A" }}
          />
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-100">{board.name}</h1>
            {board.description && (
              <p className="text-xs text-gray-400">{board.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-4 h-full min-w-max">
            {lists
              .sort((a, b) => a.position - b.position)
              .map((list) => (
                <div
                  key={list.id}
                  className="w-72 sm:w-80 flex-shrink-0 flex flex-col bg-[#252538] border border-[#2a2a3d] rounded-sm max-h-[calc(100vh-160px)]"
                >
                  {/* List Header */}
                  <div className="px-3 py-2.5 border-b border-[#2a2a3d] flex-shrink-0 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        {list.name}
                      </h3>
                      <span className="text-[10px] text-gray-500">
                        {list.cards.length} card{list.cards.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10"
                      title="Delete list"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Cards */}
                  <Droppable droppableId={list.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${
                          snapshot.isDraggingOver ? "bg-[#2f2f45]" : ""
                        }`}
                      >
                        {list.cards
                          .sort((a, b) => a.position - b.position)
                          .map((card, index) => {
                            return (
                              <Draggable
                                key={card.id}
                                draggableId={card.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={`p-3 cursor-pointer bg-[#1e1e2e] border border-[#2a2a3d] hover:border-coco-accent/50 transition-all ${
                                      snapshot.isDragging
                                        ? "shadow-lg shadow-black/30 rotate-1 border-coco-accent"
                                        : ""
                                    }`}
                                  >
                                    {/* Labels */}
                                    {card.labels.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-1.5">
                                        {card.labels.map((label) => (
                                          <span
                                            key={label.id}
                                            className="w-6 h-1.5 rounded-full inline-block"
                                            style={{
                                              backgroundColor: label.color,
                                            }}
                                            title={label.name}
                                          />
                                        ))}
                                      </div>
                                    )}

                                    <p className="text-sm font-medium text-gray-200 leading-snug">
                                      {card.title}
                                    </p>

                                    {/* Meta Row */}
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      {/* Priority badge for high/urgent */}
                                      {(card.priority === "urgent" || card.priority === "high") && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase ${
                                          card.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                        }`}>
                                          {card.priority}
                                        </span>
                                      )}

                                      {card.due_date && (() => {
                                        const due = new Date(card.due_date);
                                        const now = new Date();
                                        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
                                        const isOverdue = daysLeft < 0;
                                        const isSoon = daysLeft >= 0 && daysLeft <= 3;
                                        return (
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1 ${
                                            isOverdue ? "bg-red-100 text-red-700" : isSoon ? "bg-yellow-100 text-yellow-700" : "bg-coco-warm text-coco-coffee/60"
                                          }`}>
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                          </span>
                                        );
                                      })()}

                                      {card.checklistTotal > 0 && (
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1 ${
                                            card.checklistDone === card.checklistTotal
                                              ? "bg-green-500/20 text-green-400"
                                              : "bg-[#2a2a3d] text-gray-400"
                                          }`}
                                        >
                                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                                          {card.checklistDone}/{card.checklistTotal}
                                        </span>
                                      )}

                                      {card.description && (
                                        <span title="Has description">
                                          <svg className="w-3.5 h-3.5 text-coco-coffee/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path d="M4 6h16M4 12h16M4 18h7" />
                                          </svg>
                                        </span>
                                      )}

                                      {card.card_type === "request" && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700">
                                          REQ
                                        </span>
                                      )}

                                      {/* Assignee Avatars */}
                                      {card.assignees.length > 0 && (
                                        <div className="flex -space-x-1 ml-auto">
                                          {card.assignees
                                            .slice(0, 3)
                                            .map((a) => (
                                              <div
                                                key={a.discord_id}
                                                className="w-5 h-5 rounded-full bg-coco-coffee/20 border border-white flex items-center justify-center overflow-hidden"
                                                title={a.username}
                                              >
                                                {a.avatar ? (
                                                  <img
                                                    src={a.avatar}
                                                    alt={a.username}
                                                    className="w-full h-full object-cover"
                                                  />
                                                ) : (
                                                  <span className="text-[8px] font-bold text-coco-coffee">
                                                    {a.username
                                                      .charAt(0)
                                                      .toUpperCase()}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          {card.assignees.length > 3 && (
                                            <div className="w-5 h-5 rounded-full bg-coco-dark/10 border border-white flex items-center justify-center">
                                              <span className="text-[8px] font-bold text-coco-coffee">
                                                +{card.assignees.length - 3}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Card */}
                  <div className="px-2 py-2 border-t border-[#2a2a3d] flex-shrink-0">
                    {addingCardListId === list.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddCard(list.id);
                        }}
                      >
                        <input
                          type="text"
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          placeholder="Card title..."
                          autoFocus
                          className="w-full px-3 py-2 border border-[#2a2a3d] bg-[#1e1e2e] text-gray-200 text-sm focus:outline-none focus:border-coco-accent transition-colors mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submittingCard || !newCardTitle.trim()}
                            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50 min-h-[40px]"
                          >
                            {submittingCard ? "Adding..." : "Add"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCardListId(null);
                              setNewCardTitle("");
                            }}
                            className="text-xs text-gray-500 hover:text-gray-300 font-bold min-h-[40px] px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingCardListId(list.id);
                          setNewCardTitle("");
                        }}
                        className="w-full text-left text-xs text-gray-500 hover:text-coco-accent font-bold py-1.5 px-2 transition-colors min-h-[40px]"
                      >
                        + Add Card
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {/* Add List */}
            <div className="w-72 sm:w-80 flex-shrink-0">
              {showAddList ? (
                <div className="card p-3">
                  <form onSubmit={handleAddList}>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name..."
                      autoFocus
                      className="w-full px-3 py-2 border border-[#2a2a3d] bg-[#1e1e2e] text-gray-200 text-sm focus:outline-none focus:border-coco-accent transition-colors mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingList || !newListName.trim()}
                        className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50 min-h-[40px]"
                      >
                        {addingList ? "Adding..." : "Add List"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddList(false);
                          setNewListName("");
                        }}
                        className="text-xs text-gray-500 hover:text-gray-300 font-bold min-h-[40px] px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddList(true)}
                  className="w-full p-3 text-left text-sm text-gray-500 hover:text-coco-accent font-bold transition-colors min-h-[40px] bg-[#252538] border border-[#2a2a3d] hover:border-coco-accent/30 rounded-sm"
                >
                  + Add List
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Card Detail Modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          boardId={boardId}
          onClose={() => setSelectedCardId(null)}
          onUpdate={() => fetchBoard()}
        />
      )}
    </div>
  );
}
