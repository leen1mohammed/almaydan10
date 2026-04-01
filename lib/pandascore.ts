
/**
 * PANDASCORE UTILITY LAYER
 * Handles all PandaScore API interactions and data transformation
 */

import { Match, GameType, MatchStatus } from "@/types/match";

const BASE_URL = "https://api.pandascore.co";
const API_KEY = process.env.PANDASCORE_API_KEY;

// PandaScore data format types
interface PandaScoreOpponent {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
}

interface PandaScoreMatch {
  id: number;
  begin_at: string | null;
  scheduled_at: string;
  status: "not_started" | "running" | "finished" | "canceled";
  opponents: Array<{ opponent: PandaScoreOpponent }>;
  results: Array<{ score: number }>;
  videogame: { slug: string };
  league: { name: string };
  tournament: { id: number; name: string };
  streams_list: Array<{ raw_url: string }>;
  number_of_games?: number;
}

// Mapping functions - convert PandaScore format to our format
function mapMatchStatus(psStatus: string): MatchStatus {
  switch (psStatus.toLowerCase()) {
    case "running": return "LIVE";
    case "finished": return "FINISHED";
   
    default: return "UPCOMING";
  }
}

function mapGameType(slug: string | undefined): GameType {
  if (!slug) return "valorant";
  const s = slug.toLowerCase();
  if (s.includes("valorant")) return "valorant";
  if (s.includes("csgo") || s.includes("counter-strike")) return "csgo";
  if (s.includes("league") || s.includes("lol")) return "league-of-legends";
  if (s.includes("fc24") || s.includes("fifa")) return "fc24";
  if (s.includes("pubg")) return "pubg";
  if (s.includes("warzone") || s.includes("call-of-duty")) return "warzone";
  return "valorant";
}

// Transform a single PandaScore match to our app format
export function transformPandaScoreMatch(ps: PandaScoreMatch): Match {
  const opponents = ps.opponents || [];
  const teamA = opponents[0]?.opponent || { id: 0, name: "TBD", image_url: null };
  const teamB = opponents[1]?.opponent || { id: 0, name: "TBD", image_url: null };

  const results = ps.results || [];
  const scoreA = results[0]?.score ?? 0;
  const scoreB = results[1]?.score ?? 0;

  const leagueName = ps.league?.name || "";
  const tournamentName = ps.tournament?.name || "";
  const fullName = leagueName && tournamentName ? `${leagueName} | ${tournamentName}` : (tournamentName || "Tournament");

  return {
    id: String(ps.id),
    status: mapMatchStatus(ps.status),
    game_type: mapGameType(ps.videogame?.slug),
    start_at: ps.begin_at || ps.scheduled_at,
    tournament: {
      id: String(ps.tournament?.id || ""),
      name: fullName,
    },
    teams: [
      {
        id: String(teamA.id),
        name: teamA.name,
        logo_url: teamA.image_url || "https://placehold.co/100",
        score: scoreA,
      },
      {
        id: String(teamB.id),
        name: teamB.name,
        logo_url: teamB.image_url || "https://placehold.co/100",
        score: scoreB,
      },
    ] as [any, any],
    stream_url: ps.streams_list?.[0]?.raw_url,
  };
}

// Fetch from PandaScore API
export async function fetchMatchesFromPandaScore(
  tab: "upcoming" | "past" | "live" = "upcoming",
  pageSize: number = 30
): Promise<Match[]> {
  if (!API_KEY) {
    throw new Error("PANDASCORE_API_KEY is not set");
  }

  let endpoint = `${BASE_URL}/matches`;
  if (tab === "past") endpoint += `/past?sort=-begin_at&page[size]=${pageSize}`;
  else if (tab === "live") endpoint += `/running?page[size]=${pageSize}`;
  else endpoint += `/upcoming?sort=begin_at&page[size]=${pageSize}`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PandaScore error: ${res.status}`);
  }

  const data = await res.json() as PandaScoreMatch[];
  return data.map(transformPandaScoreMatch);
}

// Saudi team filter
const SAUDI_TEAMS = ["Team Falcons", "Twisted Minds", "Geekay", "R8 Esports", "Rule One"];

export function filterBySaudiTeams(matches: Match[]): Match[] {
  return matches.filter((match) =>
    match.teams.some((team) =>
      SAUDI_TEAMS.some((sTeam) => team.name.includes(sTeam))
    )
  );
}