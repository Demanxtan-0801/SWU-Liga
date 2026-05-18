export interface Season {
  id: string
  name: string
  year: number
  is_active: boolean
  created_at: string
}

export interface Player {
  id: string
  name: string
  created_at: string
}

export interface Tournament {
  id: string
  season_id: string
  name: string
  date: string
  created_at: string
}

export interface TournamentResult {
  id: string
  tournament_id: string
  player_id: string
  position: number
  points_earned: number
  created_at: string
}

export interface HallOfFameEntry {
  id: string
  player_id: string
  season_id: string
  photo_url: string | null
  player?: Player
  season?: Season
}

export interface LeaderboardEntry {
  season_id: string
  season_name: string
  player_id: string
  player_name: string
  tournaments_played: number
  total_points: number
  wins: number
  position: number
}
