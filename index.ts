// ═══════════════════════════════════════════════════════════════════
//  AUTH SYSTEM TYPES
// ═══════════════════════════════════════════════════════════════════

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  createdAt: number;
  profileCompleted: boolean;
}

export interface SignUpPreferences {
  favoriteGenres: string[];
  dislikedGenres: string[];
  watchedMovies: { movieId: string; title: string; year: number; rating: number; status: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated' }[];
  pacingPreference: number;
  tonePreference: number;
  complexityPreference: number;
  visualsPreference: number;
  emotionPreference: number;
}

// ═══════════════════════════════════════════════════════════════════
//  MOVIE & RECOMMENDATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface MovieAttributes {
  pacing: number;      // 1: Glacial, 5: Balanced, 10: Relentless
  tone: number;        // 1: Bleak/Dark, 5: Balanced, 10: Light/Whimsical
  complexity: number;  // 1: Straightforward, 5: Thoughtful, 10: Mind-bending
  visuals: number;     // 1: Gritty/Grounded, 5: Solid, 10: Spectacular/Stylized
  emotion: number;     // 1: Cold/Clinical, 5: Balanced, 10: Tear-jerker
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  director: string[];
  cast: string[];
  genres: string[];
  poster: string;
  rating: number;
  runtime: number;
  description: string;
  awards?: string;
  tropes: string[];
  attributes: MovieAttributes;
  boxOffice?: string;
  rottenTomatoes?: number;
  metacritic?: number;
  mpaaRating?: string;
  isUnreleased?: boolean;
  releaseDate?: string;
}

export interface WatchedMovie {
  movieId: string;
  title: string;
  year: number;
  userRating: number;
  status: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated';
  review?: string;
}

export interface UserTasteProfile {
  watchedMovies: WatchedMovie[];
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteDirectors: string[];
  dislikedDirectors: string[];
  favoriteActors: string[];
  dislikedActors: string[];
  lovedTropes: string[];
  dislikedTropes: string[];
  preferredAttributes: MovieAttributes;
  attributeWeights: {
    pacing: number;
    tone: number;
    complexity: number;
    visuals: number;
    emotion: number;
  };
  customNotes?: string;
}

// ─── HYBRID CF SYSTEM TYPES ───────────────────────────────────────

export interface CommunityUser {
  id: string;
  name: string;
  persona: string;
  ratings: { [movieId: string]: number };
  avatar: string;
  avgRating: number;
}

export interface TasteTwin {
  userId: string;
  userName: string;
  persona: string;
  avatar: string;
  similarity: number;
  sharedMovieCount: number;
  sharedMovies: { title: string; userRating: number; twinRating: number }[];
  predictedRating: number;
}

export interface ItemSimilarity {
  movieId: string;
  movieTitle: string;
  similarity: number;
  sharedUsers: number;
}

export interface CFMetrics {
  // User-User CF
  userUserPrediction: number;
  userUserConfidence: number;
  userUserNeighbors: number;
  tasteTwins: TasteTwin[];

  // Item-Item CF
  itemItemPrediction: number;
  itemItemConfidence: number;
  similarItems: ItemSimilarity[];

  // Latent Factor (SVD-style)
  latentFactorPrediction: number;
  latentFactorBias: number;

  // Hybrid blend weights
  contentWeight: number;
  userUserWeight: number;
  itemItemWeight: number;
  latentFactorWeight: number;

  // Raw predictions before blending
  contentPrediction: number;
  finalPrediction: number;
}

export interface MatchFactor {
  category: 'Genre' | 'Director/Cast' | 'Tropes' | 'Vibe' | 'User-User CF' | 'Item-Item CF' | 'Latent Factors';
  score: number;
  weight: number;
  description: string;
  isPositive: boolean;
}

export interface AnalysisResult {
  movie: Movie;
  matchScore: number;
  verdict: 'MUST WATCH' | 'HIGHLY RECOMMENDED' | 'WORTH A LOOK' | 'PROCEED WITH CAUTION' | 'SKIP IT';
  summary: string;
  pros: string[];
  cons: string[];
  factorBreakdown: MatchFactor[];
  browsingLog: string[];
  cfMetrics: CFMetrics;
}
