import { NextResponse } from "next/server";

const API_KEY = process.env.PANDASCORE_API_KEY;

type PandaOpponent = {
  opponent?: {
    id?: number;
    name?: string;
    image_url?: string | null;
  };
};

type PandaResult = {
  team_id?: number;
  score?: number;
};

type PandaStream = {
  raw_url?: string | null;
  embed_url?: string | null;
  language?: string | null;
  main?: boolean | null;
  official?: boolean | null;
};

type PandaMatch = {
  id: number;
  status?: string | null;
  begin_at?: string | null;
  stream_url?: string | null;
  league?: {
    id?: number;
    name?: string | null;
    image_url?: string | null;
  } | null;
  tournament?: {
    id?: number;
    name?: string | null;
  } | null;
  videogame?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  opponents?: PandaOpponent[];
  results?: PandaResult[];
  streams_list?: PandaStream[] | null;
};

function normalizeStatus(status?: string | null) {
  if (status === "running") return "LIVE";
  if (status === "finished") return "FINISHED";
  return "UPCOMING";
}

function normalizeGameType(slug?: string | null, name?: string | null) {
  const value = (slug || name || "").toLowerCase();

  if (value.includes("valorant")) return "valorant";
  if (
    value.includes("league-of-legends") ||
    value.includes("league of legends") ||
    value === "lol"
  ) {
    return "league-of-legends";
  }
  if (value.includes("fc24") || value.includes("ea sports fc")) return "fc24";
  if (
    value.includes("counter-strike") ||
    value.includes("cs-go") ||
    value.includes("cs2") ||
    value.includes("counter")
  ) {
    return "csgo";
  }
  if (value.includes("pubg")) return "pubg";
  return "warzone";
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "PANDASCORE_API_KEY غير موجود." },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    const res = await fetch(`https://api.pandascore.co/matches/${id}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("PandaScore single match error:", txt);

      return NextResponse.json(
        { error: "تعذر جلب بيانات المباراة." },
        { status: 500 }
      );
    }

    const raw: PandaMatch = await res.json();

    const opponents = Array.isArray(raw.opponents) ? raw.opponents : [];
    const results = Array.isArray(raw.results) ? raw.results : [];
    const streams = Array.isArray(raw.streams_list) ? raw.streams_list : [];

    const teams = opponents.slice(0, 2).map((o, i) => {
      const id = o?.opponent?.id;
      const result = results.find((r) => r.team_id === id);

      return {
        id: String(id || i),
        name: o?.opponent?.name || "TBD",
        logo_url: o?.opponent?.image_url || "",
        score: typeof result?.score === "number" ? result.score : 0,
      };
    });

    while (teams.length < 2) {
      teams.push({
        id: `fallback-${teams.length}`,
        name: "TBD",
        logo_url: "",
        score: 0,
      });
    }

    const normalized = {
      id: String(raw.id),
      status: normalizeStatus(raw.status),
      game_type: normalizeGameType(raw.videogame?.slug, raw.videogame?.name),
      start_at: raw.begin_at || new Date().toISOString(),
      tournament: {
        id: String(raw.tournament?.id || raw.league?.id || raw.id),
        name: raw.tournament?.name || raw.league?.name || "Tournament",
        logo_url: raw.league?.image_url || undefined,
      },
      teams: [teams[0], teams[1]],
      stream_url: raw.stream_url || undefined,
      streams_list: streams.map((s) => ({
        raw_url: s.raw_url || undefined,
        embed_url: s.embed_url || undefined,
        language: s.language || undefined,
        main: Boolean(s.main),
        official: Boolean(s.official),
      })),
    };

    return NextResponse.json({ match: normalized });
  } catch (error) {
    console.error("single match route error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المباراة." },
      { status: 500 }
    );
  }
}
