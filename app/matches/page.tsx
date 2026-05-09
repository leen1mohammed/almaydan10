"use client";

import { useEffect, useState } from "react";

import MatchCard from "@/components/MatchCard";
import { MatchStatus, Match } from "@/types/match";
import { supabase } from "@/lib/supabase";

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

  // تحديد الأدمن
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataSource, setDataSource] = useState("PandaScore");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("USER:", user);

      if (!user) return;

      const username =
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        "";

      console.log("USERNAME:", username);

      if (user.email === "janonah1166@gmail.com") {
        setIsAdmin(true);
      }
    }

    checkAdmin();
  }, []);

// Fetch matches based on selected filter (LIVE, UPCOMING, FINISHED)
  useEffect(() => {
    // Map internal match status to API query values
    const tabMap: Record<MatchStatus, "live" | "upcoming" | "past"> = {
      LIVE: "live",
      UPCOMING: "upcoming",
      FINISHED: "past",
    };

  // Determine current tab based on selected filter
  const tab = tabMap[filter];
  const requestedSize = filter === "FINISHED" ? 20 : 30;

  // Update URL parameters to reflect current filter (for navigation/state)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      url.searchParams.set("sa", onlySaudi ? "1" : "0");
      window.history.replaceState({}, "", url.toString());
    }

    setLoading(true);
    setErrorMsg(null);
    
    // Send request to backend API to fetch matches
    fetch(
      `/api/matches?tab=${tab}&sa=${onlySaudi ? "1" : "0"}&size=${requestedSize}`
    )
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
        setMatches(list);
      })
      .catch((e) => {
        console.error("Matches UI fetch error:", e);
        setErrorMsg(e instanceof Error ? e.message : "Unknown error");
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, [filter, onlySaudi]);  // Re-run when filter or Saudi toggle changes

  const tabs: { id: MatchStatus; label: string }[] = [
    { id: "FINISHED", label: "السابقة" },
    { id: "LIVE", label: "الآن" },
    { id: "UPCOMING", label: "القادمة" },
  ];

  return (
    <main className="min-h-screen bg-[#061125] text-white">
      <div className="mx-auto mt-10 max-w-[1100px] px-6">
        {/* التبويبات */}
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {tabs.map((tab) => {
            const active = filter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="rounded-[30px] border-[1.4px] border-[#B37FEB] px-13 py-2 text-[16px] font-bold text-white transition-all 
                duration-300 shadow-[0_2px_2px_#000,0_0_16px_rgba(146,84,222,0.32)] hover:scale-[1.02]"
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

        {/* أدوات التحكم */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowAdminPanel((v) => !v)}
                className="rounded-full border border-[#B37FEB] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5"
              >
                ⚙️ إدارة المباريات
              </button>

              {showAdminPanel && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#B37FEB]/40 bg-[#12082A] p-4 text-right shadow-[0_0_20px_rgba(146,84,222,0.25)] z-50">
                  <div className="mb-3 text-sm font-bold text-white">
                    إدارة المباريات
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 text-xs text-white/55">
                      مصدر البيانات
                    </div>

                    <select
                      value={dataSource}
                      onChange={(e) => setDataSource(e.target.value)}
                      className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="PandaScore">PandaScore</option>
                    </select>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full rounded-full border border-[#29FF64]/40 bg-[#12082A] px-4 py-2 text-sm font-bold text-[#29FF64] transition hover:scale-[1.02] hover:bg-white/5"
                  >
                    🔄 تحديث
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setOnlySaudi((v) => !v)}
            className="rounded-full border border-[#B37FEB] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5"
          >
            🔎 {onlySaudi ? "إزالة الفلتر" : "ابحث عن فرق سعودية "}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 text-center text-red-400">{errorMsg}</div>
        )}

        {loading ? (
          <main className="h-[60vh] bg-[#061125] flex items-center justify-center text-white opacity-60 font-['Cairo']">
            <p className="animate-pulse text-2xl">جاري تحميل المباريات ...</p>
          </main>        ) : (
          <div className="grid grid-cols-1 place-items-center gap-8 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {!loading && !errorMsg && matches.length === 0 && (
          <div className="mt-10 text-center text-white/70">
            لا توجد مباريات
          </div>
        )}
      </div>
    </main>
  );
}