"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";

type MatchStatus = "UPCOMING" | "LIVE" | "FINISHED";

type MatchType = {
  id: string;
  status: MatchStatus;
  game_type: string;
  start_at: string;
  tournament: {
    id: string;
    name: string;
    logo_url?: string;
  };
  teams: [
    { id: string; name: string; logo_url?: string; score: number },
    { id: string; name: string; logo_url?: string; score: number }
  ];
  stream_url?: string;
  streams_list?: Array<{
    raw_url?: string;
    embed_url?: string;
    language?: string;
    main?: boolean;
    official?: boolean;
  }>;
};

type SummaryResponse = {
  summary?: string;
  source?: "openai" | "fallback" | string;
  note?: string;
  error?: string;
  debug?: unknown;
};

function gameLabel(game: string) {
  switch (game) {
    case "valorant":
      return "Valorant";
    case "league-of-legends":
      return "League of Legends";
    case "fc24":
      return "FC 24";
    case "csgo":
      return "Counter-Strike";
    case "pubg":
      return "PUBG";
    default:
      return "Call of Duty";
  }
}

function getReplayUrl(match: MatchType | null) {
  if (!match) return null;

  const urls = [
    ...(match.streams_list || []).flatMap((s) => [s.raw_url, s.embed_url]),
    match.stream_url,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
  }

  return null;
}

function getReplayLabel(url: string | null) {
  if (!url) return "";

  const lower = url.toLowerCase();

  const isDirectVideo =
    lower.includes("youtube.com/watch") ||
    lower.includes("youtu.be/") ||
    lower.includes("/videos/") ||
    lower.includes("twitch.tv/videos/") ||
    lower.includes("kick.com/video/") ||
    lower.includes("kick.com/videos/") ||
    lower.includes("clips.twitch.tv");

  return isDirectVideo ? "شاهد التسجيل" : "شاهد في منصة البث فقط";
}

function formatSummarySource(source: string) {
  if (source === "openai") return "OpenAI";
  if (source === "fallback") return "Fallback";
  return source || "غير معروف";
}

function formatTournament(name?: string) {
  if (!name) return "";

  return name
    .replace(/Group Stage/gi, "مرحلة المجموعات")
    .replace(/Group/gi, "المجموعة")
    .replace(/Playoffs/gi, "الأدوار النهائية");
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function NeonCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };

    const onLeave = () => {
      el.style.setProperty("--mouse-x", "50%");
      el.style.setProperty("--mouse-y", "50%");
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-[30px] border border-[#B37FEB]/40 bg-[rgba(18,8,42,0.82)] backdrop-blur-md transition-all duration-300",
        "hover:border-[#d8a9ff]/70",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(41,255,100,0.18), transparent 40%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(41,255,100,0.03))]" />

      {children}
    </div>
  );
}

function TeamLogo({
  name,
  logo,
}: {
  name: string;
  logo?: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#8d4dff]/20 blur-2xl transition duration-300 group-hover:scale-110" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition duration-300 group-hover:-translate-y-0.5">
          {logo ? (
            <Image
              src={logo}
              alt={name}
              width={54}
              height={54}
              className="h-12 w-12 object-contain"
              unoptimized
            />
          ) : (
            <span className="text-lg font-bold text-white">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <span className="max-w-[140px] text-center text-sm text-white/75">
        {name}
      </span>
    </div>
  );
}

function TypingSummary({
  text,
  speed = 8,
}: {
  text: string;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;

    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return (
    <div className="whitespace-pre-wrap text-[15px] leading-8 text-white/90">
      {displayed}
    </div>
  );
}

export default function WatchPage() {
  const params = useParams<{ id: string }>();

  const [match, setMatch] = useState<MatchType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summarySource, setSummarySource] = useState("");
  const [summaryNote, setSummaryNote] = useState("");

  const matchId = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (!matchId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetch(`/api/match/${matchId}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "تعذر تحميل المباراة");
        }

        if (!cancelled) {
          setMatch(data?.match || null);
        }
      } catch (err) {
        if (!cancelled) {
          setPageError(
            err instanceof Error ? err.message : "حدث خطأ غير متوقع"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const replayUrl = useMemo(() => getReplayUrl(match), [match]);
  const replayLabel = useMemo(() => getReplayLabel(replayUrl), [replayUrl]);

  async function handleSummarize() {
    if (!match) return;

    try {
      setSummaryLoading(true);
      setSummaryError("");
      setSummary("");
      setSummarySource("");
      setSummaryNote("");

      const [teamA, teamB] = match.teams;

      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamA: teamA.name,
          teamB: teamB.name,
          scoreA: teamA.score,
          scoreB: teamB.score,
          game: gameLabel(match.game_type),
          tournament: match.tournament.name,
          status: match.status,
          startAt: match.start_at,
        }),
      });

      const data: SummaryResponse | null = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "فشل إنشاء الملخص");
      }

      setSummary(data?.summary || "تعذر إنشاء الملخص حاليًا.");
      setSummarySource(data?.source || "");
      setSummaryNote(data?.note || "");
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "حدث خطأ أثناء التلخيص"
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  const gameName = match ? gameLabel(match.game_type) : "";
  const teamA = match?.teams?.[0];
  const teamB = match?.teams?.[1];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061125] text-white">
      <Navbar />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_75%,rgba(41,255,100,0.10),transparent_20%),radial-gradient(circle_at_88%_16%,rgba(179,127,235,0.12),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(41,255,100,0.06),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative z-20 mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 text-left">
          <Link
            href="/matches?tab=past"
            className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"
          >
            <span className="text-[#29FF64]">‹</span>
            جدول المباريات
          </Link>
        </div>

        <NeonCard className="p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-[28px]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#22084a_0%,#1a0a3b_45%,#13082d_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_88%,rgba(41,255,100,0.18),transparent_22%),radial-gradient(circle_at_90%_15%,rgba(185,124,255,0.18),transparent_28%)]" />

            <div className="relative aspect-video rounded-[28px] border border-[#c47dff]/55 overflow-hidden">
              {replayUrl && !loading && !pageError && (
                <div className="absolute top-4 right-4 z-20">
                  <a
                    href={replayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-full border border-[#29FF64]/40 bg-[#0b1a24]/80 px-4 py-2 text-sm font-bold text-[#29FF64] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#29FF64]/10 hover:shadow-[0_0_20px_rgba(41,255,100,0.35)]"
                  >
                    <span>▶</span>
                    <span>{replayLabel}</span>
                  </a>
                </div>
              )}

              {loading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-white/70">جاري تحميل بيانات المباراة...</p>
                </div>
              ) : pageError ? (
                <div className="flex h-full w-full items-center justify-center px-6 text-center">
                  <p className="text-red-300">{pageError}</p>
                </div>
              ) : replayUrl ? (
                <a
                  href={replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex h-full w-full items-center justify-center cursor-pointer"
                  aria-label={replayLabel}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_42%)]" />

                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/15">
                    <div className="absolute inset-0 rounded-full bg-white/5 blur-md opacity-60" />
                    <div className="relative mr-[-6px] h-0 w-0 border-y-[18px] border-y-transparent border-l-[28px] border-l-white" />
                  </div>

                  <div className="absolute bottom-6 right-6 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-lg font-semibold">
                    تسجيل
                  </div>

                  <div className="absolute bottom-6 left-6 rounded-full border border-[#B37FEB]/30 bg-[#12082A]/70 px-4 py-2 text-sm text-white/75">
                    {replayLabel === "شاهد التسجيل"
                      ? "اضغط في أي مكان لفتح التسجيل"
                      : "اضغط في أي مكان للانتقال إلى منصة البث"}
                  </div>
                </a>
              ) : (
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_42%)]" />

                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl">
                    <div className="absolute inset-0 rounded-full bg-white/5 blur-md opacity-60" />
                    <div className="relative mr-[-6px] h-0 w-0 border-y-[18px] border-y-transparent border-l-[28px] border-l-white" />
                  </div>

                  <div className="absolute bottom-6 right-6 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-lg font-semibold">
                    تسجيل
                  </div>

                  <div className="absolute bottom-6 left-6 rounded-full border border-[#B37FEB]/30 bg-[#12082A]/70 px-4 py-2 text-sm text-white/75">
                    لا يوجد تسجيل متاح لهذه المباراة
                  </div>
                </div>
              )}
            </div>
          </div>
        </NeonCard>

        {!loading && !pageError && match && (
          <>
            <div className="mt-8 flex items-center justify-center gap-5 sm:gap-10">
              <TeamLogo name={teamA?.name || "Team A"} logo={teamA?.logo_url} />

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs tracking-[0.4em] text-white/40">VS</span>
                <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-[#29FF64] to-transparent" />
              </div>

              <TeamLogo name={teamB?.name || "Team B"} logo={teamB?.logo_url} />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-xl font-semibold leading-9 text-white sm:text-2xl">
                مباراة {teamA?.name} ضد {teamB?.name} في {gameName}
              </h1>

              <p className="mt-2 text-sm text-white/55">
                {match.status === "FINISHED"
                  ? "مباراة سابقة"
                  : match.status === "LIVE"
                  ? "مباشر الآن"
                  : "قادمة"}
                {match.tournament?.name
                  ? ` • ${formatTournament(match.tournament.name)}`
                  : ""}
              </p>

              {match.status === "FINISHED" && (
                <div className="mt-4 inline-flex items-center gap-4 rounded-full border border-[#29FF64]/20 bg-[#0b1a24]/70 px-5 py-2 text-lg font-extrabold text-[#29FF64]">
                  <span>{teamA?.score}</span>
                  <span className="text-white/40">-</span>
                  <span>{teamB?.score}</span>
                </div>
              )}
            </div>

            <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-[#29FF64] to-transparent opacity-80" />

            <NeonCard className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="mx-auto max-w-4xl">
                <div className="mb-6 text-right">
                  <h2 className="text-2xl font-bold text-white">
                    إليك ملخص المباراة
                  </h2>
                  <p className="mt-2 text-sm text-white/55">
                    تحليل سريع احترافي للمباراة باستخدام الذكاء الاصطناعي
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-[rgba(5,11,28,0.38)] p-5 sm:p-6">
                  {!summary && !summaryLoading && !summaryError && (
                    <div className="text-center text-white/50">
                      اضغط الزر بالأسفل ليتم توليد التلخيص
                    </div>
                  )}

                  {summaryLoading && (
                    <div className="space-y-4">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-[92%] animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-[86%] animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-[70%] animate-pulse rounded bg-white/10" />
                    </div>
                  )}

                  {summaryError && (
                    <p className="text-center text-red-300">{summaryError}</p>
                  )}

                  {!!summary && !summaryLoading && (
                    <>
                      <TypingSummary text={summary} speed={8} />

                      

                      {summaryNote && (
                        <p className="mt-2 text-center text-sm text-yellow-200/80">
                          {summaryNote}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleSummarize}
                    disabled={summaryLoading}
                    className={cn(
                      "group relative overflow-hidden rounded-full border border-[#cb90ff]/60 px-10 py-4 text-lg font-semibold transition-all duration-300",
                      "bg-[linear-gradient(180deg,rgba(117,45,210,0.45),rgba(51,17,103,0.92))]",
                      "shadow-[0_10px_30px_rgba(125,38,205,0.20)]",
                      "hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[#e1b9ff] hover:shadow-[0_12px_36px_rgba(125,38,205,0.26)]",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)] opacity-80" />
                    <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(41,255,100,0.12),transparent_38%)]" />
                    <span className="relative z-10">
                      {summaryLoading ? "جاري التلخيص..." : "لخّص المباراة"}
                    </span>
                  </button>
                </div>
              </div>
            </NeonCard>
          </>
        )}
      </div>
    </main>
  );
}