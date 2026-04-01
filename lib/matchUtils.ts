// lib/matchUtils.ts
import { Match } from "@/types/match";
/** Unified: return first valid HTTP/HTTPS stream link */
export function extractStreamUrl(match: Match | null): string | null {
  if (!match) return null;
  const urls = [
    ...(match.streams_list ?? []).flatMap((s) => [s.raw_url, s.embed_url]),
    match.stream_url,
  ].filter(Boolean) as string[];
  return urls.find((u) => /^https?:\/\//.test(u)) ?? null;
}
/** Game slug → readable English title */
export function gameLabel(game: string) {
  switch (game) {
    case "valorant":
      return "Valorant";
    case "league-of-legends":
      return "League of Legends";
    case "fc24":
      return "FC 24";
    case "csgo":
      return "Counter‑Strike 2";
    case "pubg":
      return "PUBG";
    default:
      return "Call of Duty";
  }
}
/** Localize tournament name fragments */
export function formatTournament(name?: string) {
  if (!name) return "";
  return name
    .replace(/Group Stage/gi, "مرحلة المجموعات")
    .replace(/Group/gi, "المجموعة")
    .replace(/Playoffs/gi, "الأدوار النهائية");
}