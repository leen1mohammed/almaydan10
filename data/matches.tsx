import { Match } from "@/types/match";

export const ALL_MATCHES: Match[] = [
  {
    id: "1",
    status: "LIVE",
    game_type: "valorant",
    start_at: "2025-11-19T21:00:00",
    tournament: { id: "t1", name: "الدوري السعودي | SAUDI ELEAGUE" },
    teams: [
      {
        id: "a",
        name: "Twisted Minds",
        logo_url: "https://placehold.co/100",
        score: 11,
      },
      {
        id: "b",
        name: "Falcons",
        logo_url: "https://placehold.co/100",
        score: 13,
      },
    ],
  },
  {
    id: "2",
    status: "UPCOMING",
    game_type: "warzone",
    start_at: "2025-11-25T21:00:00",
    tournament: { id: "t2", name: "كأس العالم للرياضات الإلكترونية" },
    teams: [
      {
        id: "c",
        name: "Geekay",
        logo_url: "https://placehold.co/100",
        score: 0,
      },
      {
        id: "d",
        name: "R8 Esports",
        logo_url: "https://placehold.co/100",
        score: 0,
      },
    ],
  },
  {
  id: "3",
  status: "FINISHED",
  game_type: "csgo",
  start_at: "2025-11-10T21:00:00",
  tournament: { id: "t3", name: "بطولة تجريبية" },
  teams: [
    { id: "e", name: "Team A", logo_url: "https://placehold.co/100", score: 1 },
    { id: "f", name: "Team B", logo_url: "https://placehold.co/100", score: 0 },
  ],
},

];
