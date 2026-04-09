"use client";

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

function getDayDiff(target: Date, base: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const targetDay = startOfDay(target).getTime();
  const baseDay = startOfDay(base).getTime();
  return Math.round((targetDay - baseDay) / oneDay);
}

function getMatchDateLabel(match: Match) {
  const date = new Date(match.start_at);
if (!match.start_at || Number.isNaN(date.getTime())) {
  return "";
}

  const now = new Date();
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
    if (dayDiff === 0) return `اليوم • ${timeLabel}`;
    if (dayDiff === -1) return `أمس • ${timeLabel}`;
    if (dayDiff < -1 && dayDiff >= -7) {
      return `منذ ${Math.abs(dayDiff)} أيام • ${timeLabel}`;
    }
    return fullDateLabel;
  }

  return fullDateLabel;
}

export default function MatchCard({ match }: { match: Match }) {
  const [teamA, teamB] = match.teams;

  const gameAsset = GAME_ASSETS[match.game_type] ?? GAME_ASSETS["default"];
  const matchDateLabel = getMatchDateLabel(match);

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isUpcoming = match.status === "UPCOMING";

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
          <TeamBlock team={teamA} align="left" />

          <div className="flex flex-col items-center justify-center gap-2">
            {isLive && (
              <>
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

                
              </>
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
                <div className="rounded-full border border-purple-400/30 bg-white/5 px-4 py-1 text-sm text-white/80">
                  قريبًا
                </div>
                <div className="text-xs text-white/45">بانتظار البداية</div>
              </>
            )}
          </div>

          <TeamBlock team={teamB} align="right" />
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
}: {
  team: Team;
  align: "left" | "right";
}) {
  const hasLogo =
    !!team.logo_url &&
    team.logo_url.trim() !== "" &&
    team.logo_url !== "/teams/default.png";

  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        align === "left" ? "justify-self-start" : "justify-self-end"
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