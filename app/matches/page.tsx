"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import { MatchStatus, Match } from "@/types/match";
import { supabase } from "@/lib/supabase";

type Filter = MatchStatus;

type MatchWithSource = Match & {
  source?: "api" | "manual";
};

type ManualMatchForm = {
  status: MatchStatus;
  game_type: string;
  start_at: string;
  tournament_name: string;
  team_a_name: string;
  team_b_name: string;
  team_a_logo: string;
  team_b_logo: string;
  team_a_score: string;
  team_b_score: string;
  stream_url: string;
};

const emptyManualForm: ManualMatchForm = {
  status: "UPCOMING",
  game_type: "valorant",
  start_at: "",
  tournament_name: "",
  team_a_name: "",
  team_b_name: "",
  team_a_logo: "",
  team_b_logo: "",
  team_a_score: "0",
  team_b_score: "0",
  stream_url: "",
};

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function getNowDateTimeLocal() {
  return toDateTimeLocalValue(new Date());
}

function getYesterdayEndDateTimeLocal() {
  const yesterdayEnd = new Date();
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 0, 0);
  return toDateTimeLocalValue(yesterdayEnd);
}

function getStartAtLimit(status: MatchStatus) {
  if (status === "FINISHED") {
    return {
      max: getYesterdayEndDateTimeLocal(),
      min: undefined,
    };
  }

  if (status === "UPCOMING") {
    return {
      min: getNowDateTimeLocal(),
      max: undefined,
    };
  }

  return {
    min: undefined,
    max: undefined,
  };
}

function isStreamAllowed(status: MatchStatus) {
  return status === "LIVE";
}

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => {
  if (typeof window === "undefined") return "UPCOMING";

  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");

  if (tab === "live") return "LIVE";
  if (tab === "past") return "FINISHED";
  return "UPCOMING";
});
  const [onlySaudi, setOnlySaudi] = useState(() => {
    if (typeof window === "undefined") return false;

    const params = new URLSearchParams(window.location.search);
    return params.get("sa") === "1";
  });
  const [urlReady, setUrlReady] = useState(false);

  const [matches, setMatches] = useState<MatchWithSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserName, setAdminUserName] = useState("");

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualForm, setManualForm] =
    useState<ManualMatchForm>(emptyManualForm);

  const [savingManual, setSavingManual] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [confirmDeleteMatch, setConfirmDeleteMatch] =
    useState<MatchWithSource | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function loadMatches() {
    const tabMap: Record<MatchStatus, "live" | "upcoming" | "past"> = {
      LIVE: "live",
      UPCOMING: "upcoming",
      FINISHED: "past",
    };



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

    try {
      const res = await fetch(
        `/api/matches?tab=${tab}&sa=${onlySaudi ? "1" : "0"}&size=${requestedSize}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.error || "Failed to fetch matches";
        throw new Error(msg);
      }

      const list = Array.isArray(json?.matches) ? json.matches : [];
      setMatches(list);
    } catch (e) {
      console.error("Matches UI fetch error:", e);
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) return;

      const { data: memberData } = await supabase
        .from("Member")
        .select("userName")
        .eq("email", user.email)
        .maybeSingle();

      const userName =
        memberData?.userName ||
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        "";

      if (userName) {
        setAdminUserName(userName);

        const { data: adminData, error: adminError } = await supabase
          .from("Admin")
          .select("AuserName")
          .eq("AuserName", userName)
          .maybeSingle();

        if (!adminError && adminData) {
          setIsAdmin(true);
          return;
        }
      }

    }

    checkAdmin();
  }, []);
  useEffect(() => {
  const tab = searchParams.get("tab");
  const sa = searchParams.get("sa");

  if (tab === "live") {
    setFilter("LIVE");
  } else if (tab === "past") {
    setFilter("FINISHED");
  } else {
    setFilter("UPCOMING");
  }

  setOnlySaudi(sa === "1");
  setUrlReady(true);
}, [searchParams]);

  useEffect(() => {
    loadMatches();
  }, [filter, onlySaudi]);
>>>>>>> 6d47f6d (final project updates)

  async function uploadTeamLogo(file: File, team: "a" | "b") {
    const fileExt = file.name.split(".").pop();
    const fileName = `team-${team}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("team-logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(error);
      showToast(
        "error",
        team === "a"
          ? "فشل رفع شعار الفريق الأول"
          : "فشل رفع شعار الفريق الثاني"
      );
      return;
    }

    const { data } = supabase.storage.from("team-logos").getPublicUrl(fileName);

    setManualForm((prev) => ({
      ...prev,
      [team === "a" ? "team_a_logo" : "team_b_logo"]: data.publicUrl,
    }));

    showToast(
      "success",
      team === "a"
        ? "تم رفع شعار الفريق الأول"
        : "تم رفع شعار الفريق الثاني"
    );
  }

  async function handleAddManualMatch() {
    if (!isAdmin) return;

    if (
      !manualForm.tournament_name.trim() ||
      !manualForm.team_a_name.trim() ||
      !manualForm.team_b_name.trim()
    ) {
      showToast("error", "اكتب اسم البطولة واسم الفريقين");
      return;
    }

    if (!manualForm.start_at) {
      showToast("error", "اختر وقت المباراة");
      return;
    }

    const selectedDate = new Date(manualForm.start_at);
    const now = new Date();

    if (manualForm.status === "FINISHED") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      if (selectedDate >= todayStart) {
        showToast("error", "المباراة السابقة يجب أن تكون بتاريخ سابق");
        return;
      }
    }

    if (manualForm.status === "UPCOMING" && selectedDate < now) {
      showToast("error", "المباراة القادمة يجب أن تكون في وقت قادم");
      return;
    }

    try {
      setSavingManual(true);

      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserName,
          status: manualForm.status,
          game_type: manualForm.game_type,
          start_at: manualForm.start_at
            ? new Date(manualForm.start_at).toISOString()
            : null,
          tournament_name: manualForm.tournament_name,
          team_a_name: manualForm.team_a_name,
          team_b_name: manualForm.team_b_name,
          team_a_logo: manualForm.team_a_logo,
          team_b_logo: manualForm.team_b_logo,
          team_a_score:
            manualForm.status === "FINISHED" ? manualForm.team_a_score : "0",
          team_b_score:
            manualForm.status === "FINISHED" ? manualForm.team_b_score : "0",
          stream_url: isStreamAllowed(manualForm.status)
            ? manualForm.stream_url
            : "",
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "فشل إضافة المباراة");
      }

      setManualForm(emptyManualForm);
      setShowAddForm(false);
      setShowAdminPanel(false);
      await loadMatches();
      showToast("success", "تم حفظ المباراة بنجاح");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "حدث خطأ أثناء الإضافة"
      );
    } finally {
      setSavingManual(false);
    }
  }

  async function handleDeleteMatch(match: MatchWithSource) {
    if (!isAdmin) return;

    const source = match.source === "manual" ? "manual" : "api";

    try {
      setDeletingId(match.id);

      const res = await fetch(
        `/api/admin/matches/${match.id}?source=${source}&adminUserName=${encodeURIComponent(
          adminUserName
        )}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("DELETE MATCH ERROR:", {
          status: res.status,
          json,
          adminUserName,
          match,
        });

        showToast("error", json?.error || "فشل حذف المباراة");
        return;
      }

      setMatches((prev) => prev.filter((item) => item.id !== match.id));
      setConfirmDeleteMatch(null);
      showToast("success", "تم حذف المباراة بنجاح");
      await loadMatches();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "فشل حذف المباراة"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const tabs: { id: MatchStatus; label: string }[] = [
    { id: "FINISHED", label: "السابقة" },
    { id: "LIVE", label: "الآن" },
    { id: "UPCOMING", label: "القادمة" },
  ];

  const startAtLimit = getStartAtLimit(manualForm.status);

  return (
    <main className="min-h-screen bg-[#061125] text-white">
      <div className="mx-auto mt-10 max-w-[1100px] px-6">
        {toast && (
          <div
            className={`fixed right-6 top-24 z-[9999] rounded-2xl border px-5 py-3 text-sm font-bold shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "border-[#29FF64]/50 bg-[#071d12]/90 text-[#29FF64]"
                : "border-red-400/50 bg-red-950/90 text-red-200"
            }`}
          >
            {toast.message}
          </div>
        )}

        {confirmDeleteMatch && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <div className="w-[360px] rounded-[26px] border border-red-400/40 bg-[#12082A] p-6 text-center shadow-[0_0_35px_rgba(239,68,68,0.28)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-3xl font-black text-red-300">
                ×
              </div>

              <h3 className="mb-2 text-xl font-black text-white">
                حذف المباراة؟
              </h3>

              <p className="mb-6 text-sm leading-6 text-white/60">
                هل أنت متأكد من حذف هذه المباراة من الموقع؟
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setConfirmDeleteMatch(null)}
                  className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:bg-white/5"
                >
                  إلغاء
                </button>

                <button
                  onClick={() => handleDeleteMatch(confirmDeleteMatch)}
                  disabled={deletingId === confirmDeleteMatch.id}
                  className="rounded-full border border-red-300/40 bg-red-500/20 px-5 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/30 disabled:opacity-60"
                >
                  {deletingId === confirmDeleteMatch.id
                    ? "جاري الحذف..."
                    : "حذف"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {tabs.map((tab) => {
           const currentTab = searchParams.get("tab");

const active =
  (currentTab === "live" && tab.id === "LIVE") ||
  (currentTab === "past" && tab.id === "FINISHED") ||
  ((currentTab === "upcoming" || !currentTab) &&
    tab.id === "UPCOMING");

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="rounded-[30px] border-[1.4px] border-[#B37FEB] px-13 py-2 text-[16px] font-bold text-white transition-all duration-300 shadow-[0_2px_2px_#000,0_0_16px_rgba(146,84,222,0.32)] hover:scale-[1.02]"
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
                <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-[#B37FEB]/40 bg-[#12082A] p-4 text-right shadow-[0_0_20px_rgba(146,84,222,0.25)]">
                  <div className="mb-3 text-sm font-bold text-white">
                    إدارة المباريات
                  </div>

                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setShowAdminPanel(false);
                    }}
                    className="mb-3 w-full rounded-full border border-[#29FF64]/40 bg-[#29FF64]/10 px-4 py-2 text-sm font-bold text-[#29FF64] transition hover:scale-[1.02] hover:bg-[#29FF64]/20"
                  >
                    + إضافة مباراة
                  </button>

                  <button
                    onClick={loadMatches}
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

        {isAdmin && showAddForm && (
          <div className="mx-auto mb-8 max-w-[900px] rounded-[28px] border border-[#B37FEB]/40 bg-[#12082A]/80 p-5 text-right shadow-[0_0_25px_rgba(146,84,222,0.20)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition hover:bg-white/5"
              >
                إغلاق
              </button>

              <h2 className="text-lg font-bold text-white">إضافة مباراة</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/60">
                  حالة المباراة
                </label>
                <select
                  value={manualForm.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as MatchStatus;

                    setManualForm((prev) => ({
                      ...prev,
                      status: nextStatus,
                      start_at: "",
                      stream_url: nextStatus === "LIVE" ? prev.stream_url : "",
                      team_a_score:
                        nextStatus === "FINISHED" ? prev.team_a_score : "0",
                      team_b_score:
                        nextStatus === "FINISHED" ? prev.team_b_score : "0",
                    }));
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="LIVE">الآن</option>
                  <option value="UPCOMING">القادمة</option>
                  <option value="FINISHED">السابقة</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  نوع اللعبة
                </label>
                <select
                  value={manualForm.game_type}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      game_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="valorant">Valorant</option>
                  <option value="league-of-legends">League of Legends</option>
                  <option value="csgo">Counter-Strike</option>
                  <option value="pubg">PUBG</option>
                  <option value="fc24">FC 24</option>
                  <option value="call-of-duty">Call of Duty</option>
                  <option value="default">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  اسم البطولة
                </label>
                <input
                  value={manualForm.tournament_name}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      tournament_name: e.target.value,
                    }))
                  }
                  placeholder="مثال: Saudi Esports League"
                  className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  وقت المباراة
                </label>
                <input
                  type="datetime-local"
                  value={manualForm.start_at}
                  min={startAtLimit.min}
                  max={startAtLimit.max}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      start_at: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none"
                />

                {manualForm.status === "FINISHED" && (
                  <p className="mt-1 text-xs text-white/35">
                    يسمح فقط باختيار تاريخ سابق.
                  </p>
                )}

                {manualForm.status === "UPCOMING" && (
                  <p className="mt-1 text-xs text-white/35">
                    يسمح فقط باختيار وقت قادم.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  الفريق الأول
                </label>
                <input
                  value={manualForm.team_a_name}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      team_a_name: e.target.value,
                    }))
                  }
                  placeholder="Team A"
                  className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  الفريق الثاني
                </label>
                <input
                  value={manualForm.team_b_name}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      team_b_name: e.target.value,
                    }))
                  }
                  placeholder="Team B"
                  className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div className="mt-2">
                <label
                  htmlFor="team-a-upload"
                  className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#B37FEB]/40 bg-[#061125] px-4 py-3 text-sm text-white transition hover:bg-[#1B1338]"
                >
                  📁 اختر شعار الفريق الأول
                </label>

                <input
                  id="team-a-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await uploadTeamLogo(file, "a");
                  }}
                />

                {manualForm.team_a_logo && (
                  <img
                    src={manualForm.team_a_logo}
                    alt="team logo"
                    className="mt-3 h-16 w-16 rounded-xl border border-white/10 object-cover"
                  />
                )}
              </div>

              <div className="mt-2">
                <label
                  htmlFor="team-b-upload"
                  className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#B37FEB]/40 bg-[#061125] px-4 py-3 text-sm text-white transition hover:bg-[#1B1338]"
                >
                  📁 اختر شعار الفريق الثاني
                </label>

                <input
                  id="team-b-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await uploadTeamLogo(file, "b");
                  }}
                />

                {manualForm.team_b_logo && (
                  <img
                    src={manualForm.team_b_logo}
                    alt="team logo"
                    className="mt-3 h-16 w-16 rounded-xl border border-white/10 object-cover"
                  />
                )}
              </div>

              {manualForm.status === "FINISHED" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">
                      نتيجة الفريق الأول
                    </label>
                    <input
                      type="number"
                      value={manualForm.team_a_score}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          team_a_score: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">
                      نتيجة الفريق الثاني
                    </label>
                    <input
                      type="number"
                      value={manualForm.team_b_score}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          team_b_score: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </>
              )}

              {isStreamAllowed(manualForm.status) && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-white/60">
                    رابط البث
                  </label>
                  <input
                    value={manualForm.stream_url}
                    onChange={(e) =>
                      setManualForm((prev) => ({
                        ...prev,
                        stream_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-white/10 bg-[#061125] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-center">
              <button
                onClick={handleAddManualMatch}
                disabled={savingManual}
                className="rounded-full border border-[#29FF64]/50 bg-[#29FF64]/10 px-8 py-3 text-sm font-bold text-[#29FF64] transition hover:scale-[1.02] hover:bg-[#29FF64]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingManual ? "جاري الحفظ..." : "حفظ المباراة"}
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 text-center text-red-400">{errorMsg}</div>
        )}

        {loading ? (
          <main className="flex h-[60vh] items-center justify-center bg-[#061125] font-['Cairo'] text-white opacity-60">
            <p className="animate-pulse text-2xl">جاري تحميل المباريات ...</p>
          </main>
        ) : (
          <div className="grid grid-cols-1 place-items-center gap-8 pb-32 md:grid-cols-2">
            {matches.map((match) => (
              <div key={match.id} className="relative w-full">
                {isAdmin && (
                  <button
                    onClick={() => setConfirmDeleteMatch(match)}
                    disabled={deletingId === match.id}
                    className="absolute left-[18px] top-[18px] z-40 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-red-200/50 bg-gradient-to-br from-red-400 to-red-600 text-[22px] font-black text-white shadow-[0_0_16px_rgba(239,68,68,0.65)] transition-all duration-200 hover:scale-110 hover:rotate-90 disabled:opacity-60"
                    title="حذف المباراة"
                  >
                    {deletingId === match.id ? "…" : "×"}
                  </button>
                )}

                <MatchCard match={match} />
              </div>
            ))}
          </div>
        )}

        {!loading && !errorMsg && matches.length === 0 && (
          <div className="mt-10 text-center text-white/70">لا توجد مباريات</div>
        )}
      </div>
    </main>
  );
}