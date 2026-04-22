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

    const url =
      `https://api.pandascore.co/matches` +
      `?filter[status]=${status}` +
      `&sort=${sortValue}` +
      `&page[size]=${Math.min(Math.max(size, 1), 100)}`;

    // ===== PAST: التاريخ من الكاش دائمًا + السكور من API إذا توفر =====
    if (tab === "past") {
      const nowIso = new Date().toISOString();
      const pastLimitIso = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: cached, error } = await supabase
        .from("match_time_cache")
        .select("*")
        .lte("start_at", nowIso)
        
        .order("start_at", { ascending: false })
        .limit(50);

      if (error) {
        console.log("❌ CACHE FETCH ERROR:", error);
        return NextResponse.json({
          success: true,
          count: 0,
          matches: [],
        });
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
        },
        next: { revalidate: 30 },
      });

      const data: PandaMatch[] = res.ok ? await res.json() : [];

      const apiMap = new Map(
        (Array.isArray(data) ? data : []).map((match) => [String(match.id), match])
      );

      const matches = (cached || [])
  .filter((item) => {
    const apiMatch = apiMap.get(String(item.match_id));

    // إذا كانت المباراة موجودة في PandaScore نثق بحالتها الفعلية
    if (apiMatch) {
      return apiMatch.status === "finished";
    }

    // إذا لم تعد موجودة في API نسمح بعرضها من الكاش
    return true;
  })
  .map((item) => {
    const apiMatch = apiMap.get(String(item.match_id));

    // fallback: من الكاش بالكامل إذا ما وجدنا المباراة في API
    if (!apiMatch) {
      return {
        id: String(item.match_id),
        status: "FINISHED",
        game_type: item.game_type || "default",
        start_at: item.start_at,
        tournament: {
          id: undefined,
          name: "—",
          logo_url: undefined,
        },
        teams: [
          {
            id: undefined,
            name: item.team_a || "Team A",
            logo_url: "",
            score: typeof item.score_a === "number" ? item.score_a : 0,
          },
          {
            id: undefined,
            name: item.team_b || "Team B",
            logo_url: "",
            score: typeof item.score_b === "number" ? item.score_b : 0,
          },
        ] as [
          { id?: string; name: string; logo_url: string; score: number },
          { id?: string; name: string; logo_url: string; score: number }
        ],
        best_of: undefined,
        stream_url: item.replay_url || undefined,
        streams_list: [],
      };
    }

    const opponents = Array.isArray(apiMatch.opponents) ? apiMatch.opponents : [];
    const results = Array.isArray(apiMatch.results) ? apiMatch.results : [];

    const teams = opponents.slice(0, 2).map((entry, index) => {
      const opponentId = entry?.opponent?.id;

      const result =
        results.find((r) => r.team_id === opponentId) ||
        results[index] ||
        null;

      return {
        id: opponentId ? String(opponentId) : undefined,
        name:
          entry?.opponent?.name ||
          (index === 0 ? item.team_a : item.team_b) ||
          "Unknown Team",
        logo_url: entry?.opponent?.image_url || "",
        score:
          typeof result?.score === "number"
            ? result.score
            : index === 0
            ? typeof item.score_a === "number"
              ? item.score_a
              : -1
            : typeof item.score_b === "number"
            ? item.score_b
            : -1,
      };
    });

    while (teams.length < 2) {
      teams.push({
        id: undefined,
        name:
          teams.length === 0
            ? item.team_a || "Team A"
            : item.team_b || "Team B",
        logo_url: "",
        score:
          teams.length === 0
            ? typeof item.score_a === "number"
              ? item.score_a
              : 0
            : typeof item.score_b === "number"
            ? item.score_b
            : 0,
      });
    }

    const tournamentName =
      apiMatch.tournament?.name ||
      apiMatch.league?.name ||
      "Unknown Tournament";

    const tournamentLogo =
      apiMatch.tournament?.image_url ||
      apiMatch.league?.image_url ||
      undefined;

    const normalizedGameType = normalizeGameType(
      apiMatch.videogame?.slug || null,
      apiMatch.videogame?.name || null
    );

    return {
      id: String(apiMatch.id),
      status: "FINISHED",
      game_type: normalizedGameType,
    start_at: apiMatch.begin_at,
      tournament: {
        id: apiMatch.tournament?.id
          ? String(apiMatch.tournament.id)
          : apiMatch.league?.id
          ? String(apiMatch.league.id)
          : undefined,
        name: tournamentName,
        logo_url: tournamentLogo || undefined,
      },
      teams: [teams[0], teams[1]] as [
        { id?: string; name: string; logo_url: string; score: number },
        { id?: string; name: string; logo_url: string; score: number }
      ],
      best_of:
        typeof apiMatch.number_of_games === "number"
          ? apiMatch.number_of_games
          : undefined,
      stream_url:
        apiMatch.official_stream_url ||
        apiMatch.stream_url ||
        item.replay_url ||
        undefined,
      streams_list: Array.isArray(apiMatch.streams_list)
        ? apiMatch.streams_list
        : [],
    };
  });
      const finalMatches = onlySaudi
        ? matches.filter((match) =>
            match.teams.some((team) => isSaudiTeam(team.name))
          )
        : matches;
        const enrichedMatches = await Promise.all(
  finalMatches.map(async (match) => {
    try {
      const detailRes = await fetch(
        `https://api.pandascore.co/matches/${match.id}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!detailRes.ok) {
        return match;
      }

      const detail: PandaMatch = await detailRes.json();

      const detailResults = Array.isArray(detail.results) ? detail.results : [];

      const teamAScore =
        typeof detailResults[0]?.score === "number"
          ? detailResults[0].score
          : match.teams[0].score;

      const teamBScore =
        typeof detailResults[1]?.score === "number"
          ? detailResults[1].score
          : match.teams[1].score;

      return {
        ...match,
        teams: [
          {
            ...match.teams[0],
            score: teamAScore,
          },
          {
            ...match.teams[1],
            score: teamBScore,
          },
        ] as [
          { id?: string; name: string; logo_url: string; score: number },
          { id?: string; name: string; logo_url: string; score: number }
        ],
      };
    } catch {
      return match;
    }
  })
);

    return NextResponse.json({
  success: true,
  count: enrichedMatches.length,
  matches: enrichedMatches,
});
    }

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