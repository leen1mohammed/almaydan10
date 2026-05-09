import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const API_KEY = process.env.PANDASCORE_API_KEY;

type PandaOpponent = {
  opponent?: {
    id?: number;
    name?: string;
    image_url?: string | null;
  };
  type?: string;
};

type PandaResult = {
  team_id?: number;
  score?: number;
};

type PandaMatch = {
  id: number;
  name?: string | null;
  status?: string | null;
  begin_at?: string | null;
  league?: {
    id?: number;
    name?: string | null;
    image_url?: string | null;
  } | null;
  tournament?: {
    id?: number;
    name?: string | null;
    image_url?: string | null;
  } | null;
  videogame?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  opponents?: PandaOpponent[];
  results?: PandaResult[];
  streams_list?: Array<{
    raw_url?: string;
    embed_url?: string;
    language?: string;
    main?: boolean;
    official?: boolean;
  }> | null;
  official_stream_url?: string | null;
  stream_url?: string | null;
  number_of_games?: number | null;
};

function normalizeGameType(slug?: string | null, name?: string | null) {
  const value = (slug || name || "").toLowerCase().trim();

  if (
    value.includes("counter-strike") ||
    value.includes("cs-go") ||
    value.includes("cs2") ||
    value === "csgo"
  ) {
    return "csgo";
  }

  if (value.includes("valorant")) return "valorant";

  if (
    value.includes("league of legends") ||
    value === "lol" ||
    value === "league-of-legends"
  ) {
    return "league-of-legends";
  }

  if (value.includes("dota") || value === "dota2" || value === "dota-2") {
    return "dota2";
  }

  if (value.includes("pubg")) return "pubg";
  if (value.includes("overwatch")) return "overwatch";

  if (
    value.includes("rocket league") ||
    value === "rocketleague" ||
    value === "rocket-league"
  ) {
    return "rocketleague";
  }

  if (value.includes("call of duty") && value.includes("warzone")) {
    return "warzone";
  }

  if (value.includes("call of duty")) return "call-of-duty";

  if (
    value.includes("fc 24") ||
    value.includes("ea sports fc 24") ||
    value === "fc24" ||
    value === "ea-sports-fc-24" ||
    value === "fifa"
  ) {
    return "fc24";
  }

  if (value === "kog") return "kog";
  if (value === "starcraft-2" || value.includes("starcraft")) return "starcraft-2";

  return "default";
}

function normalizeStatus(tab: string) {
  if (tab === "live") return "running";
  if (tab === "past") return "finished";
  return "not_started";
}

function toCardStatus(status?: string | null) {
  if (status === "running") return "LIVE";
  if (status === "finished") return "FINISHED";
  return "UPCOMING";
}

function isSaudiTeam(name?: string) {
  if (!name) return false;

  const value = name.toLowerCase();
  const saudiKeywords = [
    "falcons",
    "team falcons",
    "twisted minds",
    "roc esports",
    "01 esports",
    "vision esports",
    "drag esports",
    "triple esports",
    "powr",
    "powr esports",
    "rule one",
    "r8 esports",
    "geekay",
    "geekay esports",
    "saudi",
    "ksa",
    "الرياض",
    "السعودية",
    "الصقور",
  ];

  return saudiKeywords.some((keyword) => value.includes(keyword));
}

function isWithinDateWindow(dateString: string, tab: string) {
  if (tab === "past") return true;

  if (!dateString) return false;

  const matchDate = new Date(dateString);
  if (Number.isNaN(matchDate.getTime())) return false;

  const now = new Date();

  if (tab === "upcoming") {
    const futureLimit = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return matchDate >= now && matchDate <= futureLimit;
  }

  if (tab === "live") return true;

  return true;
}

export async function GET(request: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "PANDASCORE_API_KEY غير موجود في .env.local" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "upcoming";
    const onlySaudi = searchParams.get("sa") === "1";
    const size = Number(searchParams.get("size") || "100");

    const status = normalizeStatus(tab);
    const sortValue = tab === "past" ? "-begin_at" : "begin_at";

    const nowIso = new Date().toISOString();
const pastLimitIso = new Date(
  Date.now() - 30 * 24 * 60 * 60 * 1000
).toISOString();

const url =
  tab === "past"
    ? `https://api.pandascore.co/matches` +
      `?filter[status]=finished` +
      `&range[begin_at]=${pastLimitIso},${nowIso}` +
      `&sort=-begin_at` +
      `&page[size]=${Math.min(Math.max(size, 1), 100)}`
    : `https://api.pandascore.co/matches` +
      `?filter[status]=${status}` +
      `&sort=${sortValue}` +
      `&page[size]=${Math.min(Math.max(size, 1), 100)}`;

    
    

    // ===== UPCOMING / LIVE =====
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const raw = await res.text();
      console.error("PandaScore error:", raw);

      return NextResponse.json(
        { error: "فشل جلب المباريات من PandaScore" },
        { status: 500 }
      );
    }

    const data: PandaMatch[] = await res.json();

    let matches = (Array.isArray(data) ? data : []).map((match) => {
      const opponents = Array.isArray(match.opponents) ? match.opponents : [];
      const results = Array.isArray(match.results) ? match.results : [];

      const teams = opponents.slice(0, 2).map((entry, index) => {
        const opponentId = entry?.opponent?.id;

        const result =
          results.find((r) => r.team_id === opponentId) ||
          results[index] ||
          null;

        return {
          id: opponentId ? String(opponentId) : undefined,
          name: entry?.opponent?.name || "Unknown Team",
          logo_url: entry?.opponent?.image_url || "",
          score: typeof result?.score === "number" ? result.score : 0,
        };
      });

      while (teams.length < 2) {
        teams.push({
          id: undefined,
          name: "TBD",
          logo_url: "",
          score: 0,
        });
      }

      const tournamentName =
        match.tournament?.name || match.league?.name || "Unknown Tournament";

      const tournamentLogo =
        match.tournament?.image_url || match.league?.image_url || undefined;

      const normalizedGameType = normalizeGameType(
        match.videogame?.slug || null,
        match.videogame?.name || null
      );

      const startAt = match.begin_at || "";

      return {
        id: String(match.id),
        status: toCardStatus(match.status),
        game_type: normalizedGameType,
        start_at: startAt,
        tournament: {
          id: match.tournament?.id
            ? String(match.tournament.id)
            : match.league?.id
            ? String(match.league.id)
            : undefined,
          name: tournamentName,
          logo_url: tournamentLogo || undefined,
        },
        teams: [teams[0], teams[1]] as [
          { id?: string; name: string; logo_url: string; score: number },
          { id?: string; name: string; logo_url: string; score: number }
        ],
        best_of:
          typeof match.number_of_games === "number"
            ? match.number_of_games
            : undefined,
        stream_url:
          match.official_stream_url || match.stream_url || undefined,
        streams_list: Array.isArray(match.streams_list)
          ? match.streams_list
          : [],
      };
    });
    if (tab === "past") {
  const idsWithoutDate = matches
    .filter((m) => !m.start_at)
    .map((m) => String(m.id));

  if (idsWithoutDate.length > 0) {
    const { data: cached, error } = await supabase
      .from("match_time_cache")
      .select("match_id, start_at");

    if (!error && cached) {
      matches = matches.map((m) => {
        if (m.start_at) return m;

        const found = cached.find(
          (c) => String(c.match_id) === String(m.id)
        );

        return found?.start_at
          ? { ...m, start_at: found.start_at }
          : m;
      });
    }
  }

}

    matches = matches.filter((match) => isWithinDateWindow(match.start_at, tab));

    if (onlySaudi) {
      matches = matches.filter((match) =>
        match.teams.some((team) => isSaudiTeam(team.name))
      );
    }

    if (tab === "upcoming") {
      matches = matches.filter((match) => match.status === "UPCOMING");
    }

    if (tab === "live") {
      matches = matches.filter((match) => match.status === "LIVE");
    }

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("matches route error:", error);

    return NextResponse.json(
      { error: "تعذر جلب المباريات" },
      { status: 500 }
    );
  }
}