export type MatchStatus = "UPCOMING" | "LIVE" | "FINISHED";

export type GameType =
  | "valorant"
  | "league-of-legends"
  | "lol"
  | "fc24"
  | "csgo"
  | "pubg"
  | "warzone"
  | "dota2"
  | "dota-2"
  | "overwatch"
  | "rocketleague"
  | "kog"
  | "starcraft-2"
  | "call-of-duty"
  | "call-of-duty-warzone"
  | "ea-sports-fc-24"
  | "fifa"
  | "default";

export interface Team {
  id?: string;
  name: string;
  logo_url: string;
  score: number;
  is_winner?: boolean;
}

export interface Tournament {
  id?: string;
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
  game_type: GameType | string;
  start_at: string;
  tournament: Tournament;
  teams: [Team, Team];
  best_of?: number;
  stream_url?: string;
  streams_list?: MatchStream[];
}