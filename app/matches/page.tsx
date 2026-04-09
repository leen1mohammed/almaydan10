"use client";

import { useEffect, useState } from "react";

import MatchCard from "@/components/MatchCard";
import { MatchStatus, Match } from "@/types/match";

type Filter = MatchStatus;

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>(() => {
    if (typeof window === "undefined") return "LIVE";

    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");

    if (tab === "past") return "FINISHED";
    if (tab === "live") return "LIVE";
    if (tab === "upcoming") return "UPCOMING";

    return "LIVE";
  });

  const [onlySaudi, setOnlySaudi] = useState(() => {
    if (typeof window === "undefined") return false;

    const params = new URLSearchParams(window.location.search);
    return params.get("sa") === "1";
  });

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

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      url.searchParams.set("sa", onlySaudi ? "1" : "0");
      window.history.replaceState({}, "", url.toString());
    }

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

  const tabs: { id: MatchStatus; label: string }[] = [
    { id: "FINISHED", label: "السابقة" },
    { id: "LIVE", label: "الآن" },
    { id: "UPCOMING", label: "القادمة" },
  ];

  return (
    <main className="min-h-screen bg-[#061125] text-white">
      <div className="mx-auto mt-10 max-w-[1100px] px-6">
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {tabs.map((tab) => {
            const active = filter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="rounded-[30px] border-[1.4px] border-[#B37FEB] px-8 py-3 text-[16px] font-bold text-white transition-all duration-300 shadow-[0_2px_2px_#000,0_0_16px_rgba(146,84,222,0.32)] hover:scale-[1.02]"
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
            className="rounded-full border border-[#B37FEB] px-4 py-1.5 text-[12px] font-bold text-white transition-all duration-300 shadow-[0_2px_2px_#000,0_0_12px_rgba(146,84,222,0.25)] hover:scale-[1.02]"
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
          <div className="grid grid-cols-1 place-items-center gap-8 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[330px] w-[440px] animate-pulse overflow-hidden rounded-[30px] border border-purple-500/30 bg-[#12082A]"
              >
                <div className="h-[110px] w-full bg-white/5" />
                <div className="px-6 pt-6">
                  <div className="mb-6 h-4 w-24 rounded bg-white/10" />
                  <div className="mb-4 grid grid-cols-3 items-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-white/10" />
                      <div className="h-4 w-20 rounded bg-white/10" />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-24 rounded bg-white/10" />
                      <div className="h-4 w-16 rounded bg-white/10" />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-white/10" />
                      <div className="h-4 w-20 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="mx-auto mt-6 h-4 w-40 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 place-items-center gap-8 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {!loading && !errorMsg && matches.length === 0 && (
          <div className="mt-10 rounded-[24px] border border-white/10 bg-white/5 px-6 py-8 text-center text-white/70">
            {filter === "LIVE"
              ? onlySaudi
                ? "لا توجد مباريات مباشرة لفرق السعودية حاليًا."
                : "لا توجد مباريات مباشرة حاليًا."
              : filter === "FINISHED"
              ? onlySaudi
                ? "لا توجد مباريات سابقة لفرق السعودية حاليًا."
                : "لا توجد مباريات سابقة حاليًا."
              : onlySaudi
              ? "لا توجد مباريات قادمة لفرق السعودية حاليًا."
              : "لا توجد مباريات قادمة حاليًا."}
          </div>
        )}
      </div>
    </main>
  );
}