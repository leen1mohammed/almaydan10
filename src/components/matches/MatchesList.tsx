"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Match = {
  id: string;
  game: string;
  teamA: { name: string; logo?: string };
  teamB: { name: string; logo?: string };
  startsAt: string;
  status: "upcoming" | "live" | "finished";
};

function formatRiyadhDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ar-SA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

export default function MatchesList() {
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="opacity-80">جاري تحميل المباريات…</div>;
  if (!items.length) return <div className="opacity-80">لا توجد مباريات حالياً.</div>;

  return (
    <div className="space-y-3">
      {items.map((m) => {
        const dt = formatRiyadhDate(m.startsAt);
        return (
          <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs opacity-80">{m.game}</div>
              <div
                className={[
                  "text-xs px-2 py-1 rounded-full border",
                  m.status === "live"
                    ? "border-green-500/40 bg-green-500/10"
                    : m.status === "finished"
                    ? "border-white/15 bg-white/5"
                    : "border-purple-500/40 bg-purple-500/10",
                ].join(" ")}
              >
                {m.status === "live" ? "مباشر" : m.status === "finished" ? "انتهت" : "قادمة"}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center gap-3">
                {m.teamA.logo ? (
                  <Image src={m.teamA.logo} alt={m.teamA.name} width={28} height={28} className="rounded" />
                ) : (
                  <div className="h-7 w-7 rounded bg-white/10" />
                )}
                <div className="font-medium">{m.teamA.name}</div>
              </div>

              <div className="text-sm opacity-80">VS</div>

              <div className="flex items-center justify-end gap-3">
                <div className="font-medium">{m.teamB.name}</div>
                {m.teamB.logo ? (
                  <Image src={m.teamB.logo} alt={m.teamB.name} width={28} height={28} className="rounded" />
                ) : (
                  <div className="h-7 w-7 rounded bg-white/10" />
                )}
              </div>
            </div>

            <div className="mt-3 text-xs opacity-80">
              {dt.date} — {dt.time}
            </div>
          </div>
        );
      })}
    </div>
  );
}
