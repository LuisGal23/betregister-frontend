export interface TipsterAuthor {
  username: string;
  display_name: string;
  avatar_url: string;
  is_verified: boolean;
  badge: string;
  stats: {
    yield: string;
    win_rate: string;
    units: string;
    streak: string;
  };
}

export interface TipsterPost {
  id: string;
  user_id?: number;
  bet_id?: number | null;
  author: TipsterAuthor;
  created_at: string;
  sport: string;
  league?: string;
  event: string;
  home?: string;
  away?: string;
  home_logo?: string;
  away_logo?: string;
  market: string;
  pick: string;
  odds: string;
  units: number;
  rationale: string;
  reactions: {
    fire: number;
    like: number;
    copies: number;
  };
  status?: string;
  userReactedFire?: boolean;
  userReactedLike?: boolean;
}
