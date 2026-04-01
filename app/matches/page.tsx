"use client";

import { useEffect, useState } from "react";

import MatchCard from "@/components/MatchCard";
import { MatchStatus, Match } from "@/types/match";

type Filter = MatchStatus;

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>("LIVE");
  const [onlySaudi, setOnlySaudi] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const tabMap: Record<MatchStatus, "live" | "upcoming" | "past"> = {
      LIVE: "live",
      UPCOMING: "upcoming",
      FINISHED: "past",
    };

    const tab = tabMap[filter];

    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/matches?tab=${tab}&sa=${onlySaudi ? "1" : "0"}&size=30`)
      .then(async (r) => {
        const json = await r.json().catch(() => null);

        if (!r.ok) {
          const msg = json?.error || "Failed to fetch matches";
          throw new Error(msg);
        }

        return json;
      })
      .then((json) => {
        const list = Array.isArray(json?.matches) ? json.matches : [];
        console.log("MATCHES RAW:", list);
        console.log(
          "MATCH STATUSES:",
          list.map((m: Match) => ({
            id: m.id,
            status: m.status,
            teams: m.teams?.map((t) => t.name).join(" vs "),
          }))
        );
        setMatches(list);
      })
      .catch((e) => {
        console.error("Matches UI fetch error:", e);
        setErrorMsg(e instanceof Error ? e.message : "Unknown error");
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, [filter, onlySaudi]);

  return (
    <main className="min-h-screen bg-[#061125] text-white">
      

      <div className="mx-auto mt-10 max-w-[1100px] px-6">
        <div className="mb-6 flex justify-center gap-4">
          {[
            { id: "FINISHED", label: "السابقة" },
            { id: "LIVE", label: "الآن" },
            { id: "UPCOMING", label: "القادمة" },
          ].map((tab) => {
            const active = filter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as MatchStatus)}
                className="rounded-[30px] border-[1.4px] border-[#B37FEB] px-8 py-3 text-[16px] font-bold text-white transition-all duration-300 shadow-[0_2px_2px_#000,0_0_16px_rgba(146,84,222,0.32)]"
                style={{
                  background: active
                    ? "linear-gradient(319deg, rgba(255,255,255,0.80) 11.46%, rgba(255,255,255,0.80) 34.44%, rgba(255,255,255,0.00) 66.52%, rgba(255,255,255,0.80) 94.3%, rgba(255,255,255,0.80) 94.31%), #12082A"
                    : "#12082A",
                  backgroundBlendMode: "soft-light, normal",
                  opacity: active ? 0.95 : 0.6,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mb-10 flex justify-center">
          <button
            onClick={() => setOnlySaudi((v) => !v)}
            className="rounded-full border border-[#B37FEB] px-4 py-1.5 text-[12px] font-bold text-white transition-all duration-300 shadow-[0_2px_2px_#000,0_0_12px_rgba(146,84,222,0.25)]"
            style={{
              background: onlySaudi
                ? "linear-gradient(319deg, rgba(255,255,255,0.80) 11.46%, rgba(255,255,255,0.80) 34.44%, rgba(255,255,255,0.00) 66.52%, rgba(255,255,255,0.80) 94.3%, rgba(255,255,255,0.80) 94.31%), #12082A"
                : "#12082A",
              backgroundBlendMode: "soft-light, normal",
              opacity: onlySaudi ? 0.95 : 0.6,
            }}
          >
            فرق سعودية
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 text-center text-red-400">{errorMsg}</div>
        )}

        {loading ? (
          <div className="text-center opacity-70">جاري تحميل المباريات...</div>
        ) : (
          <div className="grid grid-cols-1 place-items-center gap-8 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {!loading && !errorMsg && matches.length === 0 && (
          <div className="mt-10 text-center opacity-60">
            {filter === "LIVE"
              ? onlySaudi
                ? "لا توجد مباريات مباشرة لفرق السعودية حاليًا."
                : "لا توجد مباريات مباشرة حاليًا."
              : onlySaudi
              ? "لا توجد مباريات لفرق السعودية حاليًا."
              : "لا توجد مباريات مطابقة حاليًا."}
          </div>
        )}
      </div>
    </main>
  );
}
