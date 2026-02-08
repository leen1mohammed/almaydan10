import { NextResponse } from "next/server";

const SAMPLE_MATCHES = [
  {
    id: "m1",
    game: "VALORANT",
    teamA: { name: "Team Falcons", logo: "/teams/falcons.png" },
    teamB: { name: "Twisted Minds", logo: "/teams/twistedminds.png" },
    startsAt: "2026-02-10T19:30:00+03:00",
    status: "upcoming",
  },
  {
    id: "m2",
    game: "CS2",
    teamA: { name: "R8 Esports", logo: "/teams/r8.png" },
    teamB: { name: "Geekay", logo: "/teams/geekay.png" },
    startsAt: "2026-02-08T21:00:00+03:00",
    status: "live",
  },
];

export async function GET() {
  return NextResponse.json({ items: SAMPLE_MATCHES });
}
