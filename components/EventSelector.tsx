import React, { useEffect, useState } from "react";
import type { PrimrEvent } from "../types/primr-event";

interface Event {
  _id: string;
  name: string;
}

interface EventSelectorProps {
  selectedEvent: PrimrEvent | null;
  onSelect: (event: PrimrEvent | null) => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ selectedEvent, onSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newEventName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEventName }),
      });
      if (!res.ok) throw new Error("Failed to create event.");
      const event = await res.json();
      setEvents((prev) => [...prev, event]);
      onSelect(event);
      setNewEventName("");
    } catch (error) {
      console.error('Failed to create event:', error);
      setError("Could not create event.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center gap-3">
      <label htmlFor="event-select" className="font-medium text-gray-700 shrink-0 flex items-center gap-1">
        <svg className="w-5 h-5 text-[var(--brand-blue)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
        </svg>
        Event
      </label>
      <select
        id="event-select"
        className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] transition w-full md:w-auto"
        value={selectedEvent?._id || ""}
        onChange={e => {
          const event = events.find(ev => ev._id === e.target.value) || null;
          onSelect(event);
        }}
      >
        <option value="">-- Select an event --</option>
        {events.map(ev => (
          <option key={ev._id} value={ev._id}>{ev.name}</option>
        ))}
      </select>
      <form onSubmit={handleCreateEvent} className="flex gap-2 w-full md:w-auto">
        <input
          type="text"
          placeholder="New event name"
          value={newEventName}
          onChange={e => setNewEventName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] transition w-full md:w-40"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-[var(--brand-blue)] text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          disabled={loading || !newEventName.trim()}
        >
          Create
        </button>
      </form>
      {error && <div className="text-red-600 text-sm mt-2 md:ml-2">{error}</div>}
    </div>
  );
};

export default EventSelector;