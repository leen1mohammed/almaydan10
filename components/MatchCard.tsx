
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Match, Team } from "@/types/match";
import { GAME_ASSETS } from "@/lib/gameAssets";
function playSound(src: string, volume = 0.35) {
  if (typeof window === "undefined") return;

  const audio = new Audio(src);
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
function formatArabicDate(date: Date) {
  return date.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
}
function formatArabicTime(date: Date) {
  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });
}
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function toSaudiDate(dateString: string) {
  return new Date(
    new Date(dateString).toLocaleString("en-US", {
      timeZone: "Asia/Riyadh",
    })
  );
}
function getDayDiff(target: Date, base: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const targetDay = startOfDay(target).getTime();
  const baseDay = startOfDay(base).getTime();
  return Math.round((targetDay - baseDay) / oneDay);
}
function getMatchDateLabel(match: Match) {
  if (match.status === "LIVE") return "مباشر الآن";
  if (!match.start_at) {
    return match.status === "FINISHED" ? "مباراة سابقة" : "";
  }
  const date = toSaudiDate(match.start_at);
  if (Number.isNaN(date.getTime())) {
    return match.status === "FINISHED" ? "مباراة سابقة" : "";
  }
  const now = toSaudiDate(new Date().toISOString());
  const timeLabel = formatArabicTime(date);
  const fullDateLabel = `${formatArabicDate(date)} • ${timeLabel}`;
  const dayDiff = getDayDiff(date, now);
  if (match.status === "UPCOMING") {
    if (dayDiff === 0) return `اليوم  |   ${timeLabel}`;
    if (dayDiff === 1) return `غدًا  |   ${timeLabel}`;
    if (dayDiff > 1 && dayDiff <= 7) return `بعد ${dayDiff} أيام | ${timeLabel}`;
    return fullDateLabel;
  }
  if (match.status === "FINISHED") {
    if (dayDiff === 0) return `أُقيمت اليوم  |   ${timeLabel}`;
    if (dayDiff === -1) return `أُقيمت أمس  |   ${timeLabel}`;
    const dayName = date.toLocaleDateString("ar-SA", {
      weekday: "long",
      timeZone: "Asia/Riyadh",
    });
    return `أُقيمت ${dayName} ${formatArabicDate(date)} | ${timeLabel}`;
  }
  return fullDateLabel;
}
function scoreLabel(score?: number) {
  return typeof score === "number" && score >= 0 ? String(score) : "—";
  
}
export default function MatchCard({ match }: { match: Match }) {
  const [teamA, teamB] = match.teams;
  const [votes, setVotes] = useState<{ A: number; B: number }>({ A: 0, B: 0 });
  const [selected, setSelected] = useState<"A" | "B" | null>(null);
  const gameAsset = GAME_ASSETS[match.game_type] ?? GAME_ASSETS["default"];
  const matchDateLabel = getMatchDateLabel(match);
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isUpcoming = match.status === "UPCOMING";
  const hasVotes = votes.A + votes.B > 0;
  function handleVote(team: "A" | "B") {
  if (!isUpcoming) return;

  // تشغيل الصوت فقط أول مرة
  if (!selected) {
    playSound("/sounds/click.mp3", 0.35);
  }

  setSelected(team);

  setVotes((prev) => {
    if (team === "A") return { A: prev.A + 1, B: prev.B };
    return { A: prev.A, B: prev.B + 1 };
  });
}
  function getPercentage(team: "A" | "B") {
    const total = votes.A + votes.B;
    if (total === 0) return 0;
    return Math.round((votes[team] / total) * 100);
  }
  return (
    <div
      className="
        group relative h-[340px] w-[420px]
        overflow-hidden rounded-[28px]
        border border-[#B37FEB]/75
        bg-[#12082A]
        shadow-[0_0_20px_rgba(146,84,222,0.32)]
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:border-[#d9a7ff]
        hover:shadow-[0_0_34px_rgba(146,84,222,0.52)]
      "
    >
      {/* لمبات خفيفة */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <span className="absolute left-[18%] top-3 h-1 w-1 animate-pulse rounded-full bg-[#29FF64]/70 shadow-[0_0_10px_#29FF64]" />
        <span className="absolute left-[48%] top-5 h-1 w-1 animate-pulse rounded-full bg-white/70 shadow-[0_0_8px_white]" />
        <span className="absolute right-[18%] top-4 h-1 w-1 animate-pulse rounded-full bg-[#B37FEB]/80 shadow-[0_0_10px_#B37FEB]" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(41,255,100,0.10),transparent_34%)]" />
      </div>
      <div className="relative h-[104px] w-full overflow-hidden rounded-t-[28px]">
        <Image
          src={gameAsset.header}
          alt={gameAsset.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12082A] via-black/45 to-black/10" />
        <div className="absolute bottom-3 left-4 text-[12px] font-black uppercase tracking-wide text-white drop-shadow">
          {gameAsset.title}
        </div>
        {isLive && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-[0_0_16px_rgba(239,68,68,0.45)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            مباشر
          </div>
        )}
        {isFinished && (
          <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            انتهت
          </div>
        )}
        {isUpcoming && (
          <div className="absolute right-3 top-3 rounded-full border border-[#B37FEB]/40 bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-[0_0_14px_rgba(179,127,235,0.45)]">
            قادمة
          </div>
        )}
      </div>
      <div className="px-6 pt-3">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
      <div className="flex h-[184px] flex-col justify-between px-5 pt-4">
        <div className="grid w-full grid-cols-[1fr_122px_1fr] items-center">
          <div className="flex flex-col items-center">
            <div
              onClick={() => handleVote("A")}
              className={isUpcoming ? "cursor-pointer" : ""}
            >
              <TeamBlock
                team={teamA}
                align="left"
                clickable={isUpcoming}
                selected={selected === "A"}
              />
            </div>
            {isUpcoming && (
              <VotePercent percent={getPercentage("A")} visible={hasVotes} />
            )}
          </div>
          <div className="flex min-h-[118px] flex-col items-center justify-center gap-2">
            {isUpcoming && (
              <>
                <div className="rounded-full bg-white/5 px-3 py-1 text-center text-[11px] font-bold text-white/75">
                  توقع الفائز
                </div>
                <div className="text-xs font-black tracking-[0.28em] text-white/55">
                  VS
                </div>
                <p className="max-w-[115px] text-center text-[10px] leading-5 text-white/45">
                  اضغط على الفريق لاختيار توقعك
                </p>
              </>
            )}
            {isLive && (
              <>
                <Link
                  href={`/matches/${match.id}/live`}
                  className="
                    flex h-[40px] w-[112px] items-center justify-center
                    rounded-full bg-purple-600
                    text-sm font-black text-white
                    shadow-[0_0_18px_rgba(147,51,234,0.45)]
                    transition hover:scale-[1.04] hover:bg-purple-500
                  "
                >
                  شاهد البث
                </Link>
              
              </>
            )}
            {isFinished && (
              <div className="flex flex-col items-center gap-3 pt-4">
                <div className="rounded-full border border-[#29FF64]/45 bg-[#071d22]/85 px-5 py-2 text-lg font-black text-[#29FF64] shadow-[0_0_18px_rgba(41,255,100,0.22),inset_0_0_12px_rgba(41,255,100,0.08)] transition-all duration-300 group-hover:scale-[1.03] group-hover:border-[#29FF64]/70">
  {scoreLabel(teamA.score)} - {scoreLabel(teamB.score)}
</div>
                <Link
                  href={{
                    pathname: `/matches/${match.id}/past`,
                    query: { data: JSON.stringify(match) },
                  }}
                  className="
                    mt-1 flex h-[32px] w-[108px] items-center justify-center
                    rounded-full bg-purple-600/90
                    text-xs font-bold text-white
                    shadow-[0_0_14px_rgba(147,51,234,0.28)]
                    transition hover:scale-[1.04] hover:bg-purple-500
                  "
                >
                  شاهد التسجيل
                </Link>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div
              onClick={() => handleVote("B")}
              className={isUpcoming ? "cursor-pointer" : ""}
            >
              <TeamBlock
                team={teamB}
                align="right"
                clickable={isUpcoming}
                selected={selected === "B"}
              />
            </div>
            {isUpcoming && (
              <VotePercent percent={getPercentage("B")} visible={hasVotes} />
            )}
          </div>
        </div>
        {matchDateLabel && (
          <div
            className={`mx-auto max-w-[360px] text-center text-[13px] font-bold ${
              isLive
                ? "text-red-300"
                : isFinished
                ? "text-white/72"
                : "text-white/80"
            }`}
          >
            {matchDateLabel}
          </div>
        )}
      </div>
    </div>
  );
}
function VotePercent({
  percent,
  visible,
}: {
  percent: number;
  visible: boolean;
}) {
  return (
    <div className="mt-2 flex w-[70px] flex-col items-center gap-1">
      <div className="text-xs font-bold text-white/75">
        {visible ? `${percent}%` : "—"}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#29FF64] transition-all duration-300"
          style={{ width: visible ? `${percent}%` : "0%" }}
        />
      </div>
    </div>
  );
}
function TeamBlock({
  team,
  align,
  clickable = false,
  selected = false,
}: {
  team: Team;
  align: "left" | "right";
  clickable?: boolean;
  selected?: boolean;
}) {
  const hasLogo =
    !!team.logo_url &&
    team.logo_url.trim() !== "" &&
    team.logo_url !== "/teams/default.png";
  return (
    <div
      className={`flex h-[106px] w-[106px] flex-col items-center justify-start gap-2 rounded-[20px] px-2 py-2 transition-all duration-300 ${
        align === "left" ? "justify-self-start" : "justify-self-end"
      } ${
        clickable
          ? "cursor-pointer hover:scale-[1.06] hover:bg-white/5 hover:shadow-[0_0_18px_rgba(41,255,100,0.36)]"
          : ""
      } ${selected ? "bg-[#29FF64]/8 ring-1 ring-[#29FF64]/70" : ""}`}
    >
      <div className="relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div className="absolute inset-0 rounded-full bg-white/5 blur-md" />
        {hasLogo ? (
          <Image
            src={team.logo_url}
            alt={team.name}
            width={50}
            height={50}
            className="relative h-[42px] w-[42px] object-contain"
            unoptimized
          />
        ) : (
          <span className="relative text-sm font-black text-white">
            {team.name?.slice(0, 2).toUpperCase() || "TM"}
          </span>
        )}
      </div>
      <div className="line-clamp-2 w-[100px] text-center text-[12px] font-semibold leading-5 text-white/90">
        {team.name}
      </div>
    </div>
  );
}