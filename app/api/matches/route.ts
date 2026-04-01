import { NextResponse } from "next/server";

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
    name?: string | null;
  } | null;
  videogame?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  opponents?: PandaOpponent[];
  results?: PandaResult[];
};

function normalizeGameType(slug?: string | null, name?: string | null) {
  const value = (slug || name || "").toLowerCase();

  if (value.includes("counter-strike") || value.includes("cs-go") || value.includes("cs2")) {
    return "csgo";
  }
  if (value.includes("valorant")) {
    return "valorant";
  }
  if (value.includes("league of legends") || value === "lol") {
    return "lol";
  }
  if (value.includes("dota")) {
    return "dota2";
  }
  if (value.includes("pubg")) {
    return "pubg";
  }
  if (value.includes("overwatch")) {
    return "overwatch";
  }
  if (value.includes("rocket league")) {
    return "rocketleague";
  }

  return (slug || "other").toLowerCase();
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
    const status = normalizeStatus(tab);
    const sortValue = tab === "past" ? "-begin_at" : "begin_at";

    const url =
      `https://api.pandascore.co/matches` +
      `?filter[status]=${status}` +
      `&sort=${sortValue}` +
      `&page[size]=20`;

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

    const matches = (Array.isArray(data) ? data : []).map((match) => {
      const opponents = Array.isArray(match.opponents) ? match.opponents : [];
      const results = Array.isArray(match.results) ? match.results : [];

      const teams = opponents.slice(0, 2).map((entry) => {
        const opponentId = entry?.opponent?.id;
        const result = results.find((r) => r.team_id === opponentId);

        return {
          name: entry?.opponent?.name || "Unknown Team",
          logo_url: entry?.opponent?.image_url || "/teams/default.png",
          score: typeof result?.score === "number" ? result.score : 0,
        };
      });

      while (teams.length < 2) {
        teams.push({
          name: "TBD",
          logo_url: "/teams/default.png",
          score: 0,
        });
      }

      return {
        id: match.id,
        name: match.name || "Match",
        game_type: normalizeGameType(
          match.videogame?.slug || null,
          match.videogame?.name || null
        ),
        teams,
        start_at: match.begin_at || new Date().toISOString(),
        status: toCardStatus(match.status),
        league: match.league?.name || "Unknown League",
      };
    });

    return NextResponse.json({
      success: true,
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