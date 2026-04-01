export type MatchStatus = "UPCOMING" | "LIVE" | "FINISHED";

export type GameType =
  | "valorant"
  | "league-of-legends"
  | "fc24"
  | "csgo"
  | "pubg"
  | "warzone";

export interface Team {
  id: string;
  name: string;
  logo_url: string;
  score: number;
  is_winner?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  logo_url?: string;
}

export interface MatchStream {
  raw_url?: string;
  embed_url?: string;
  language?: string;
  main?: boolean;
  official?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  game_type: GameType;
  start_at: string;
  tournament: Tournament;
  teams: [Team, Team];
  best_of?: number;
  stream_url?: string;
  streams_list?: MatchStream[];
}