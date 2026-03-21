"use client";

import { useState, useEffect, useCallback } from "react";

interface CalendarEvent {
  id: string;
  calendar: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  color: string;
  recurring: string | null;
  amount: number | null;
  created_by: string;
}

const CALENDAR_META: Record<string, { label: string; color: string; bgColor: string }> = {
  development: { label: "Development", color: "text-violet-700", bgColor: "bg-violet-100 border-violet-300" },
  executive: { label: "Executive", color: "text-green-700", bgColor: "bg-green-100 border-green-300" },
  staff: { label: "Staff", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300" },
};

const EVENT_TYPES = [
  { value: "event", label: "Event", color: "#E8944A" },
  { value: "deadline", label: "Deadline", color: "#ef4444" },
  { value: "meeting", label: "Meeting", color: "#3b82f6" },
  { value: "reminder", label: "Reminder", color: "#f59e0b" },
  { value: "subscription", label: "Subscription", color: "#8b5cf6" },
  { value: "release", label: "Release", color: "#22c55e" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const inputCls = "w-full px-3 py-2.5 border-2 border-coco-dark/10 bg-white text-sm focus:outline-none focus:border-coco-accent transition-colors";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<string[]>([]);
  const [activeCalendars, setActiveCalendars] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    calendar: "",
    title: "",
    description: "",
    event_type: "event",
    start_date: "",
    end_date: "",
    all_day: true,
    color: "#E8944A",
    recurring: "none",
    amount: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${monthKey}`);
      const data = await res.json();
      setEvents(data.events || []);
      if (data.calendars) {
        setCalendars(data.calendars);
        if (activeCalendars.size === 0) {
          setActiveCalendars(new Set(data.calendars));
        }
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const toggleCalendar = (cal: string) => {
    const next = new Set(activeCalendars);
    if (next.has(cal)) next.delete(cal); else next.add(cal);
    setActiveCalendars(next);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean; dateStr: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, current: false, dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      cells.push({ day: d, current: false, dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const getEventsForDate = (dateStr: string) =>
    events.filter((e) => {
      if (!activeCalendars.has(e.calendar)) return false;
      const eDate = e.start_date.split("T")[0];
      return eDate === dateStr;
    });

  const openNewEvent = (dateStr: string) => {
    setSelectedEvent(null);
    setForm({
      calendar: calendars[0] || "staff",
      title: "",
      description: "",
      event_type: "event",
      start_date: `${dateStr}T09:00`,
      end_date: "",
      all_day: true,
      color: "#E8944A",
      recurring: "none",
      amount: "",
    });
    setSelectedDate(dateStr);
    setShowForm(true);
  };

  const openEditEvent = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setForm({
      calendar: evt.calendar,
      title: evt.title,
      description: evt.description || "",
      event_type: evt.event_type,
      start_date: evt.start_date.slice(0, 16),
      end_date: evt.end_date?.slice(0, 16) || "",
      all_day: evt.all_day,
      color: evt.color,
      recurring: evt.recurring || "none",
      amount: evt.amount?.toString() || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.start_date) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: form.amount ? parseFloat(form.amount) : null,
        end_date: form.end_date || null,
      };

      if (selectedEvent) {
        await fetch("/api/calendar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedEvent.id, ...payload }),
        });
      } else {
        await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      fetchEvents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch("/api/calendar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setShowForm(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">Team</span>
          <h1 className="text-2xl sm:text-3xl font-black text-coco-dark mt-1">Calendar</h1>
        </div>
        <button onClick={() => openNewEvent(today)} className="btn-primary text-xs !px-4 !py-2 min-h-[40px]">
          + New Event
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="card p-3 sm:p-4 space-y-3">
            <p className="text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider">Calendars</p>
            {calendars.map((cal) => {
              const meta = CALENDAR_META[cal];
              return (
                <label key={cal} className="flex items-center gap-2 cursor-pointer min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={activeCalendars.has(cal)}
                    onChange={() => toggleCalendar(cal)}
                    className="w-4 h-4 accent-coco-accent"
                  />
                  <span className={`text-xs sm:text-sm font-bold ${meta?.color || "text-coco-dark"}`}>
                    {meta?.label || cal}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Upcoming events */}
          <div className="card p-3 sm:p-4 mt-4">
            <p className="text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-2">Upcoming</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events
                .filter((e) => activeCalendars.has(e.calendar) && new Date(e.start_date) >= new Date())
                .slice(0, 8)
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => openEditEvent(e)}
                    className="w-full text-left p-2 hover:bg-coco-warm/50 transition-colors rounded-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                      <span className="text-xs font-medium text-coco-dark truncate">{e.title}</span>
                    </div>
                    <p className="text-[10px] text-coco-coffee/50 ml-4">
                      {new Date(e.start_date).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              {events.filter((e) => activeCalendars.has(e.calendar) && new Date(e.start_date) >= new Date()).length === 0 && (
                <p className="text-[10px] text-coco-coffee/30">No upcoming events</p>
              )}
            </div>
          </div>
        </aside>

        {/* Calendar Grid */}
        <main className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b-2 border-coco-dark/10">
              <button onClick={prevMonth} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-coco-warm/50 transition-colors text-coco-dark font-bold">&lt;</button>
              <div className="text-center">
                <h2 className="text-sm sm:text-lg font-black text-coco-dark">{MONTHS[month]} {year}</h2>
                <button onClick={goToday} className="text-[10px] text-coco-accent hover:text-coco-ember font-bold uppercase tracking-wider">Today</button>
              </div>
              <button onClick={nextMonth} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-coco-warm/50 transition-colors text-coco-dark font-bold">&gt;</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-coco-dark/5">
              {DAYS.map((d) => (
                <div key={d} className="text-center py-2 text-[10px] sm:text-xs font-bold text-coco-coffee/50 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div className="p-12 text-center text-coco-coffee/30 text-sm">Loading...</div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const dayEvents = getEventsForDate(cell.dateStr);
                  const isToday = cell.dateStr === today;
                  return (
                    <div
                      key={i}
                      onClick={() => cell.current && openNewEvent(cell.dateStr)}
                      className={`min-h-[60px] sm:min-h-[90px] border-b border-r border-coco-dark/5 p-1 sm:p-1.5 cursor-pointer hover:bg-coco-warm/30 transition-colors ${
                        !cell.current ? "bg-coco-dark/[0.02]" : ""
                      } ${isToday ? "bg-coco-accent/5" : ""}`}
                    >
                      <p className={`text-[10px] sm:text-xs font-bold mb-0.5 ${
                        isToday
                          ? "text-coco-accent"
                          : cell.current
                          ? "text-coco-dark"
                          : "text-coco-coffee/30"
                      }`}>
                        {cell.day}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <button
                            key={evt.id}
                            onClick={(e) => { e.stopPropagation(); openEditEvent(evt); }}
                            className="w-full text-left text-[8px] sm:text-[10px] font-medium px-1 py-0.5 rounded-sm truncate hover:opacity-80 transition-opacity"
                            style={{ background: evt.color + "20", color: evt.color, borderLeft: `2px solid ${evt.color}` }}
                          >
                            {evt.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[8px] text-coco-coffee/40 px-1">+{dayEvents.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white border-2 border-coco-dark/10 shadow-coco-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-coco-dark">
              {selectedEvent ? "Edit Event" : "New Event"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event name..." className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Calendar</label>
                <select value={form.calendar} onChange={(e) => setForm({ ...form, calendar: e.target.value })} className={inputCls}>
                  {calendars.map((c) => (
                    <option key={c} value={c}>{CALENDAR_META[c]?.label || c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Type</label>
                <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value, color: EVENT_TYPES.find((t) => t.value === e.target.value)?.color || form.color })} className={inputCls}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Start</label>
                <input type={form.all_day ? "date" : "datetime-local"} value={form.all_day ? form.start_date.split("T")[0] : form.start_date} onChange={(e) => setForm({ ...form, start_date: form.all_day ? `${e.target.value}T00:00` : e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">End (optional)</label>
                <input type={form.all_day ? "date" : "datetime-local"} value={form.end_date ? (form.all_day ? form.end_date.split("T")[0] : form.end_date) : ""} onChange={(e) => setForm({ ...form, end_date: form.all_day ? `${e.target.value}T23:59` : e.target.value })} className={inputCls} />
              </div>
              <div className="flex items-center gap-2 min-h-[40px]">
                <input type="checkbox" checked={form.all_day} onChange={(e) => setForm({ ...form, all_day: e.target.checked })} className="w-4 h-4 accent-coco-accent" id="allDay" />
                <label htmlFor="allDay" className="text-xs font-bold text-coco-coffee">All day</label>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Recurring</label>
                <select value={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.value })} className={inputCls}>
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {(form.event_type === "subscription" || form.event_type === "reminder") && (
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Amount ($)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inputCls} />
                </div>
              )}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Color</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 border-2 border-coco-dark/10 cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-coco-coffee uppercase tracking-wider mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Details..." className={`${inputCls} resize-y`} />
            </div>

            <div className="flex gap-2 justify-between pt-2">
              <div>
                {selectedEvent && (
                  <button onClick={() => handleDelete(selectedEvent.id)} className="text-xs px-3 py-2 font-bold text-red-500 hover:text-red-700 border-2 border-red-200 hover:border-red-400 transition-colors min-h-[40px]">
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 text-coco-coffee min-h-[40px]">Cancel</button>
                <button onClick={handleSubmit} disabled={saving || !form.title.trim()} className="btn-primary text-xs !px-4 !py-2 disabled:opacity-50 min-h-[40px]">
                  {saving ? "Saving..." : selectedEvent ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
