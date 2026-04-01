"use client";

import Image from "next/image";
import Link from "next/link";
import { Match, Team } from "@/types/match";
import { GAME_ASSETS } from "@/lib/gameAssets";

export default function MatchCard({ match }: { match: Match }) {
  const [teamA, teamB] = match.teams;

  const gameAsset = GAME_ASSETS[match.game_type] ?? {
    title: match.game_type.toUpperCase(),
    header: "/games/default.png",
  };

  const date = new Date(match.start_at);

  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isUpcoming = match.status === "UPCOMING";

  return (
    <div
      className="
        relative h-[330px] w-[440px]
        overflow-hidden rounded-[30px]
        border border-purple-500/80
        bg-[#12082A]
        shadow-[0_0_20px_rgba(146,84,222,0.35)]
      "
    >
      <div className="relative h-[110px] w-full overflow-hidden rounded-t-[30px]">
        <Image
          src={gameAsset.header}
          alt={gameAsset.title}
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute bottom-3 left-4 text-sm font-bold text-white">
          {gameAsset.title}
        </div>
      </div>

      <div className="mt-2 px-6">
        <div className="h-[1px] w-full bg-white/10" />
      </div>

      <div className="flex flex-col items-center gap-5 px-6 pt-6">
        <div className="grid w-full grid-cols-3 items-center">
          <TeamBlock team={teamA} align="left" />

          <div className="flex flex-col items-center justify-center gap-2">
            {isLive && (
              <Link
                href={`/matches/${match.id}/live`}
                className="
                  flex h-[42px] w-[100px] items-center justify-center
                  rounded-[8px] bg-purple-600
                  text-sm font-bold text-white
                  transition hover:bg-purple-500
                "
              >
                تابع
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
                    rounded-[8px] bg-purple-600
                    text-sm font-bold text-white
                    transition hover:bg-purple-500
                  "
                >
                  شاهد التسجيل
                </Link>

                <div className="text-lg font-bold text-white">
                  {teamA.score} - {teamB.score}
                </div>
              </>
            )}

            {isUpcoming && <div className="text-sm text-white/50">قادم</div>}
          </div>

          <TeamBlock team={teamB} align="right" />
        </div>

        <div className="text-[15px] text-white opacity-80">
          {formattedDate} • {formattedTime}
        </div>
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
  const logo = team.logo_url || "/teams/default.png";

  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        align === "left" ? "justify-self-start" : "justify-self-end"
      }`}
    >
      <Image
        src={logo}
        alt={team.name}
        width={48}
        height={48}
        unoptimized
      />
      <div className="w-[110px] text-center text-sm text-white opacity-90">
        {team.name}
      </div>
    </div>
  );
}
