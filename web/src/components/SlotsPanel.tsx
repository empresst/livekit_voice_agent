"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { date: string; time: string; isBooked: boolean };

function dayLabel(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function SlotsPanel({ active }: { active: boolean }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch("/api/slots");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!stop) {
          setSlots(data.slots);
          setError(false);
        }
      } catch {
        if (!stop) setError(true);
      }
    };
    load();
    if (!active) return () => { stop = true; };
    const id = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [active]);

  const days = useMemo(() => Array.from(new Set(slots.map((s) => s.date))), [slots]);
  const selected = day && days.includes(day) ? day : days[0];
  const daySlots = slots.filter((s) => s.date === selected);

  return (
    <section className="w-full max-w-md mt-8 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-lg font-semibold">Campus Counseling Appointment Desk</h2>
      <p className="text-xs text-amber-300 mt-1 mb-3">
        This is a scheduling assistant, not a real counseling service.
        Please don&apos;t share real personal details.
      </p>

      {error && <p className="text-sm text-gray-400">Schedule unavailable right now.</p>}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${
              d === selected ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {dayLabel(d)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {daySlots.map((s) => (
          <button
            key={s.time}
            disabled={s.isBooked}
            onClick={() =>
              setHint(`Try saying: "Book the ${s.time} slot on ${dayLabel(s.date)}"`)
            }
            className={`py-2 rounded-lg text-sm ${
              s.isBooked
                ? "bg-gray-800 text-gray-600 line-through cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {s.time}
            {s.isBooked && <span className="block text-[10px] no-underline">Booked</span>}
          </button>
        ))}
      </div>

      {hint && <p className="text-sm text-blue-300 mt-3">{hint}</p>}
    </section>
  );
}