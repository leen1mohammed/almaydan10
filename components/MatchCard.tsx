"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Match, Team } from "@/types/match";
import { GAME_ASSETS } from "@/lib/gameAssets";

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
  if (match.status === "LIVE") {
    return "مباشر الآن";
  }

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
    if (dayDiff === 0) return `اليوم • ${timeLabel}`;
    if (dayDiff === 1) return `غدًا • ${timeLabel}`;
    if (dayDiff > 1 && dayDiff <= 7) return `بعد ${dayDiff} أيام • ${timeLabel}`;
    return fullDateLabel;
  }

  if (match.status === "FINISHED") {
  if (dayDiff === 0) return `أُقيمت اليوم • ${timeLabel}`;
  if (dayDiff === -1) return `أُقيمت أمس • ${timeLabel}`;
  return `أُقيمت في ${fullDateLabel}`;

  }

 return `${formatArabicDate(date)} - ${timeLabel}`;
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

    setSelected(team);

    setVotes((prev) => {
      if (team === "A") return { A: prev.A + 1, B: prev.B };
      return { A: prev.A, B: prev.B + 1 };
    });
  }

  function getPercentage(team: "A" | "B") {
    const hasVotes = votes.A + votes.B > 0;
    const total = votes.A + votes.B;
    if (total === 0) return 0;
    return Math.round((votes[team] / total) * 100);
  }

  return (
    <div
      className="
        group relative h-[330px] w-[440px]
        overflow-hidden rounded-[30px]
        border border-purple-500/80
        bg-[#12082A]
        shadow-[0_0_20px_rgba(146,84,222,0.35)]
        transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(146,84,222,0.45)]
      "
    >
      <div className="relative h-[110px] w-full overflow-hidden rounded-t-[30px]">
        <Image
          src={gameAsset.header}
          alt={gameAsset.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute bottom-3 left-4 text-sm font-bold text-white">
          {gameAsset.title}
        </div>

        {isLive && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md">
            <span className="animate-pulse">●</span>
            مباشر
          </div>
        )}

        {isFinished && (
          <div className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            انتهت
          </div>
        )}

        {isUpcoming && (
          <div className="absolute right-3 top-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">
            قادمة
          </div>
        )}
      </div>

      <div className="mt-2 px-6">
        <div className="h-[1px] w-full bg-white/10" />
      </div>

      <div className="flex flex-col items-center gap-5 px-6 pt-6">
        <div className="grid w-full grid-cols-3 items-center">
          <div className="flex flex-col items-center">
  <div onClick={() => handleVote("A")} className={isUpcoming ? "cursor-pointer" : ""}>
    <TeamBlock
      team={teamA}
      align="left"
      clickable={isUpcoming}
      selected={selected === "A"}
    />
  </div>

  {isUpcoming && (
    <div className="mt-1 text-xs font-semibold text-white/70">
      {hasVotes ? `${getPercentage("A")}%` : "—"}
    </div>
  )}
</div>
          <div className="flex flex-col items-center justify-center gap-2">
            {isLive && (
              <Link
                href={`/matches/${match.id}/live`}
                className="
                  flex h-[42px] w-[100px] items-center justify-center
                  rounded-[10px] bg-purple-600
                  text-sm font-bold text-white
                  transition hover:bg-purple-500 hover:scale-[1.03]
                "
              >
                شاهد البث
              </Link>
            )}

            {isFinished && (
              <>
                <Link
                  href={{
                    pathname: `/matches/${match.id}/past`,
                    query: { data: JSON.stringify(match) },
                  }}
                  className="
                    flex h-[42px] w-[120px] items-center justify-center
                    rounded-[10px] bg-purple-600
                    text-sm font-bold text-white
                    transition hover:bg-purple-500 hover:scale-[1.03]
                  "
                >
                  شاهد التسجيل
                </Link>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-lg font-bold text-white">
                  {teamA.score} - {teamB.score}
                </div>
              </>
            )}

            {isUpcoming && (
              <>
                <div className="text-xs text-white/60">
  توقع الفريق الفائز
</div>

                <div className="text-xs font-semibold tracking-[0.25em] text-white/55">
                  VS
                </div>
    
              </>
            )}
          </div>

          <div className="flex flex-col items-center">
  <div onClick={() => handleVote("B")} className={isUpcoming ? "cursor-pointer" : ""}>
    <TeamBlock
      team={teamB}
      align="right"
      clickable={isUpcoming}
      selected={selected === "B"}
    />
  </div>

  {isUpcoming && (
    <div className="mt-1 text-xs font-semibold text-white/70">
      {hasVotes ? `${getPercentage("B")}%` : "—"}
    </div>
  )}
</div>
        </div>

        {matchDateLabel && (
          <div
            className={`text-center text-[15px] ${
              isLive ? "font-bold text-red-400" : "text-white opacity-80"
            }`}
          >
            {matchDateLabel}
          </div>
        )}
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
      className={`flex flex-col items-center gap-2 rounded-[18px] px-2 py-2 transition-all duration-300 ${
        align === "left" ? "justify-self-start" : "justify-self-end"
      } ${
        clickable
  ? "cursor-pointer hover:bg-white/5 hover:scale-[1.05] hover:shadow-[0_0_15px_rgba(41,255,100,0.5)]"
  : ""
      } ${
        selected ? "bg-white/8 ring-1 ring-[#29FF64]/60" : ""
      }`}
    >
      <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
        {hasLogo ? (
          <Image
            src={team.logo_url}
            alt={team.name}
            width={48}
            height={48}
            className="h-[42px] w-[42px] object-contain"
            unoptimized
          />
        ) : (
          <span className="text-sm font-bold text-white">
            {team.name?.slice(0, 2).toUpperCase() || "TM"}
          </span>
        )}
      </div>

      <div className="w-[110px] text-center text-sm text-white opacity-90">
        {team.name}
      </div>
    </div>
  );
}