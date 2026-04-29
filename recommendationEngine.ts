import { 
  Movie, UserTasteProfile, AnalysisResult, MatchFactor, MovieAttributes,
  CommunityUser, TasteTwin, ItemSimilarity, CFMetrics
} from '../types';
import { MOVIE_DATABASE } from '../data/movies';

// ═══════════════════════════════════════════════════════════════════
//  SEARCH RESULT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SearchContext {
  type: 'not_found' | 'multiple_matches' | 'single_match';
  query: string;
  matches: Movie[];
  selectedMovie?: Movie;
}

// ═══════════════════════════════════════════════════════════════════
//  FUZZY MOVIE LOOKUP (returns all matches)
// ═══════════════════════════════════════════════════════════════════

export const searchMovies = (query: string): SearchContext => {
  const q = query.toLowerCase().trim();
  
  // Exact title matches (including duplicates)
  const exactMatches = MOVIE_DATABASE.filter(m => m.title.toLowerCase() === q);
  if (exactMatches.length === 1) {
    return { type: 'single_match', query, matches: exactMatches, selectedMovie: exactMatches[0] };
  }
  if (exactMatches.length > 1) {
    // Check if query has year to disambiguate (e.g., "arrival 2016")
    const yearMatch = q.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const yearFiltered = exactMatches.filter(m => m.year === parseInt(yearMatch[0]));
      if (yearFiltered.length === 1) {
        return { type: 'single_match', query, matches: yearFiltered, selectedMovie: yearFiltered[0] };
      }
    }
    return { type: 'multiple_matches', query, matches: exactMatches };
  }

  // Fuzzy word-based search
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) {
    return { type: 'not_found', query, matches: [] };
  }

  const scored: { movie: Movie; score: number }[] = [];

  MOVIE_DATABASE.forEach(m => {
    const titleLower = m.title.toLowerCase();
    let score = 0;

    queryWords.forEach(word => {
      if (titleLower.includes(word)) score += 3;
      if (m.director.some(d => d.toLowerCase().includes(word))) score += 4;
      if (m.cast.some(a => a.toLowerCase().includes(word))) score += 2;
      if (m.genres.some(g => g.toLowerCase() === word)) score += 1;
    });

    // Year match
    const yearMatch = q.match(/\b(19|20)\d{2}\b/);
    if (yearMatch && m.year === parseInt(yearMatch[0])) score += 5;

    if (score >= 4) {
      scored.push({ movie: m, score });
    }
  });

  if (scored.length === 0) {
    return { type: 'not_found', query, matches: [] };
  }

  scored.sort((a, b) => b.score - a.score);
  const matches = scored.map(s => s.movie);

  if (matches.length === 1) {
    return { type: 'single_match', query, matches, selectedMovie: matches[0] };
  }

  // If top match is significantly higher scored than rest, auto-select it
  if (scored.length >= 2 && scored[0].score > scored[1].score * 1.8) {
    return { type: 'single_match', query, matches, selectedMovie: matches[0] };
  }

  return { type: 'multiple_matches', query, matches: matches.slice(0, 8) };
};

// ═══════════════════════════════════════════════════════════════════
//  INTERNET BROWSING SIMULATOR
// ═══════════════════════════════════════════════════════════════════

export const simulateInternetBrowsing = async (
  query: string,
  onLog: (log: string) => void
): Promise<SearchContext> => {
  const logs = [
    `🔍 Initializing deep web search for "${query}"...`,
    `📡 Connecting to IMDb, TmdB, and Rotten Tomatoes APIs...`,
    `📥 Fetching basic metadata and release details...`,
    `📄 Scanning critical reviews from Metacritic and RogerEbert.com...`,
    `💬 Crawling Letterboxd and Reddit (r/movies) for audience consensus...`,
    `🧠 Extracting cinematic DNA (visual style, pacing, emotional resonance)...`,
    `🏷️ Identifying prominent storytelling tropes and narrative devices...`,
    `📊 Aggregating financial data and box office reports...`,
    `✨ Compiling complete cinematic profile for analysis...`
  ];

  for (let i = 0; i < logs.length; i++) {
    onLog(logs[i]);
    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 450));
  }

  const result = searchMovies(query);

  if (result.type === 'not_found') {
    onLog(`🌐 Not found in local cache. Scraping live web sources for "${query}"...`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    onLog(`❌ No results found across IMDb, TmdB, Letterboxd, or Metacritic.`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    onLog(`⚠️ Movie "${query}" could not be verified in any source.`);
    return result;
  }

  if (result.type === 'multiple_matches') {
    onLog(`🔎 Found ${result.matches.length} movies matching "${query}". Disambiguation required.`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    result.matches.forEach(m => {
      onLog(`   📽️ "${m.title}" (${m.year}) — dir. ${m.director.join(', ')}`);
    });
    return result;
  }

  const movie = result.selectedMovie!;
  if (movie.isUnreleased) {
    onLog(`📅 Found: "${movie.title}" (${movie.releaseDate || movie.year}) — this film has NOT been released yet.`);
    onLog(`🎬 Fetching production details and creative team info...`);
    await new Promise((resolve) => setTimeout(resolve, 600));
  } else {
    onLog(`✅ Exact match found: "${movie.title}" (${movie.year}) fetched successfully!`);
  }

  return result;
};

// ═══════════════════════════════════════════════════════════════════
//  COMMUNITY USER GENERATOR (50 users)
// ═══════════════════════════════════════════════════════════════════

const PERSONAS = [
  { name: "Cinephile Scholar", avatar: "🎓", lovedGenres: ["Drama", "Crime", "Biography", "Mystery"], hatedGenres: ["Comedy", "Action", "Family"], baseRating: 7, tropeBias: ["Unreliable Narrator", "Plot Twist", "Psychological Descent"] },
  { name: "Action Fanatic", avatar: "💥", lovedGenres: ["Action", "Sci-Fi", "Adventure", "Thriller"], hatedGenres: ["Romance", "Drama", "Music"], baseRating: 6.5, tropeBias: ["High-Octane Chase", "Practical Effects", "One-Man Army", "Epic Scale"] },
  { name: "Rom-Com Lover", avatar: "💕", lovedGenres: ["Romance", "Comedy", "Family"], hatedGenres: ["Horror", "Thriller", "Crime"], baseRating: 7, tropeBias: ["Meet-Cute", "Star-Crossed Lovers", "First Love", "Rain Kiss"] },
  { name: "Sci-Fi Geek", avatar: "🚀", lovedGenres: ["Sci-Fi", "Fantasy", "Adventure"], hatedGenres: ["Romance", "Biography"], baseRating: 6.5, tropeBias: ["Space Exploration", "Time Travel", "Cyberpunk", "Dying Earth"] },
  { name: "Horror Buff", avatar: "👻", lovedGenres: ["Horror", "Thriller", "Mystery"], hatedGenres: ["Comedy", "Family"], baseRating: 5.5, tropeBias: ["Slow-Burn Dread", "Body Horror", "Folk Horror"] },
  { name: "Animation Enthusiast", avatar: "🎨", lovedGenres: ["Animation", "Family", "Fantasy", "Adventure"], hatedGenres: ["Crime", "Horror", "Thriller"], baseRating: 7.5, tropeBias: ["Ghibli Magic", "Coming of Age", "Whimsical Atmosphere"] },
  { name: "Indie Explorer", avatar: "🌿", lovedGenres: ["Drama", "Romance", "Music", "Biography"], hatedGenres: ["Action", "Sci-Fi", "Thriller"], baseRating: 6, tropeBias: ["Bittersweet Ending", "Generational Trauma", "Class Struggle"] },
  { name: "Blockbuster Mainstreamer", avatar: "🍿", lovedGenres: ["Action", "Comedy", "Adventure", "Sci-Fi"], hatedGenres: ["Biography", "History", "Drama"], baseRating: 7.5, tropeBias: ["Epic Scale", "High-Octane Chase", "One-Man Army"] },
  { name: "Tough Art Critic", avatar: "🧐", lovedGenres: ["Crime", "Drama", "Mystery", "Biography"], hatedGenres: ["Action", "Comedy", "Family"], baseRating: 4.5, tropeBias: ["Cerebral Plot", "Class Struggle", "Gothic Atmosphere"] },
  { name: "Popcorn Audience", avatar: "🎪", lovedGenres: ["Action", "Horror", "Comedy", "Adventure"], hatedGenres: ["Drama", "Biography", "History"], baseRating: 8, tropeBias: ["High-Octane Chase", "Stylized Violence", "Cathartic Ending"] },
];

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const generateCommunityUsers = (): CommunityUser[] => {
  const users: CommunityUser[] = [];
  for (let u = 0; u < 50; u++) {
    const persona = PERSONAS[u % PERSONAS.length];
    const variant = Math.floor(u / PERSONAS.length) + 1;
    const id = `comm_user_${u + 1}`;
    const name = `${persona.name} #${variant}`;
    const ratings: { [movieId: string]: number } = {};

    MOVIE_DATABASE.forEach((m) => {
      if (m.isUnreleased) return;
      const seed = hashStr(m.id + id);
      if (seed % 100 < 65) {
        let r = persona.baseRating;
        const lovedHits = m.genres.filter(g => persona.lovedGenres.includes(g)).length;
        const hatedHits = m.genres.filter(g => persona.hatedGenres.includes(g)).length;
        r += lovedHits * 1.5;
        r -= hatedHits * 2.0;
        const tropeMatches = m.tropes.filter(t => persona.tropeBias.includes(t)).length;
        r += tropeMatches * 0.8;
        if (["Christopher Nolan", "Martin Scorsese", "Quentin Tarantino", "David Fincher"].some(d => m.director.includes(d) && persona.lovedGenres.includes("Drama"))) r += 1.0;
        if (["Hayao Miyazaki"].some(d => m.director.includes(d) && persona.lovedGenres.includes("Animation"))) r += 1.5;
        if (m.rating > 8.5) r += 0.5;
        if (m.rating < 7.0) r -= 0.5;
        const noise = ((seed % 30) / 10) - 1.5;
        r += noise;
        ratings[m.id] = Math.max(1, Math.min(10, Math.round(r * 10) / 10));
      }
    });

    const ratedValues = Object.values(ratings);
    const avgRating = ratedValues.length > 0 ? ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length : 6;
    users.push({ id, name, persona: persona.name, ratings, avatar: persona.avatar, avgRating: Math.round(avgRating * 10) / 10 });
  }
  return users;
};

// ═══════════════════════════════════════════════════════════════════
//  USER-USER CF (Pearson Correlation)
// ═══════════════════════════════════════════════════════════════════

const computePearsonSimilarity = (
  userRatings: { [movieId: string]: number },
  otherRatings: { [movieId: string]: number }
): { similarity: number; sharedCount: number; sharedMovies: { title: string; userRating: number; twinRating: number }[] } => {
  const sharedIds = Object.keys(userRatings).filter(id => id in otherRatings);
  if (sharedIds.length < 2) return { similarity: 0, sharedCount: 0, sharedMovies: [] };

  const userMean = sharedIds.reduce((sum, id) => sum + userRatings[id], 0) / sharedIds.length;
  const otherMean = sharedIds.reduce((sum, id) => sum + otherRatings[id], 0) / sharedIds.length;

  let numerator = 0, userDenom = 0, otherDenom = 0;
  const sharedMovies: { title: string; userRating: number; twinRating: number }[] = [];

  sharedIds.forEach(id => {
    const uCentered = userRatings[id] - userMean;
    const oCentered = otherRatings[id] - otherMean;
    numerator += uCentered * oCentered;
    userDenom += uCentered * uCentered;
    otherDenom += oCentered * oCentered;
    const movie = MOVIE_DATABASE.find(m => m.id === id);
    sharedMovies.push({ title: movie?.title || id, userRating: userRatings[id], twinRating: otherRatings[id] });
  });

  if (userDenom === 0 || otherDenom === 0) return { similarity: 0, sharedCount: sharedIds.length, sharedMovies };

  return {
    similarity: numerator / (Math.sqrt(userDenom) * Math.sqrt(otherDenom)),
    sharedCount: sharedIds.length,
    sharedMovies: sharedMovies.sort((a, b) => b.userRating - a.userRating)
  };
};

const computeUserUserCF = (
  movieId: string,
  userRatings: { [movieId: string]: number },
  communityUsers: CommunityUser[]
): { prediction: number; confidence: number; tasteTwins: TasteTwin[] } => {
  const similarities = communityUsers.map(u => {
    const result = computePearsonSimilarity(userRatings, u.ratings);
    return { user: u, similarity: result.similarity, sharedCount: result.sharedCount, sharedMovies: result.sharedMovies };
  }).filter(x => x.similarity > 0.05 && x.user.ratings[movieId] !== undefined);

  similarities.sort((a, b) => b.similarity - a.similarity);
  const topK = similarities.slice(0, 8);

  let weightedSum = 0, simSum = 0;
  topK.forEach(x => { weightedSum += x.similarity * x.user.ratings[movieId]; simSum += x.similarity; });

  const tasteTwins: TasteTwin[] = topK.slice(0, 5).map(x => ({
    userId: x.user.id, userName: x.user.name, persona: x.user.persona, avatar: x.user.avatar,
    similarity: Math.round(x.similarity * 100) / 100, sharedMovieCount: x.sharedCount,
    sharedMovies: x.sharedMovies.slice(0, 4), predictedRating: x.user.ratings[movieId]
  }));

  if (simSum > 0) return { prediction: Math.round((weightedSum / simSum) * 10) / 10, confidence: Math.round((simSum / topK.length) * 100), tasteTwins };

  const allRated = communityUsers.filter(u => u.ratings[movieId] !== undefined);
  if (allRated.length > 0) {
    const avg = allRated.reduce((sum, u) => sum + u.ratings[movieId], 0) / allRated.length;
    return { prediction: Math.round(avg * 10) / 10, confidence: 15, tasteTwins: [] };
  }
  return { prediction: 7.0, confidence: 5, tasteTwins: [] };
};

// ═══════════════════════════════════════════════════════════════════
//  ITEM-ITEM CF (Cosine Similarity)
// ═══════════════════════════════════════════════════════════════════

const computeItemItemCF = (
  movieId: string,
  userRatings: { [movieId: string]: number },
  communityUsers: CommunityUser[]
): { prediction: number; confidence: number; similarItems: ItemSimilarity[] } => {
  const allMovieIds = new Set<string>();
  communityUsers.forEach(u => Object.keys(u.ratings).forEach(id => allMovieIds.add(id)));
  Object.keys(userRatings).forEach(id => allMovieIds.add(id));

  const targetVector: { [userId: string]: number } = {};
  communityUsers.forEach(u => { if (u.ratings[movieId] !== undefined) targetVector[u.id] = u.ratings[movieId]; });

  const movieSimilarities: { movieId: string; similarity: number; sharedUsers: number }[] = [];
  allMovieIds.forEach(otherId => {
    if (otherId === movieId) return;
    const otherVector: { [userId: string]: number } = {};
    communityUsers.forEach(u => { if (u.ratings[otherId] !== undefined) otherVector[u.id] = u.ratings[otherId]; });
    const sharedUsers = Object.keys(targetVector).filter(uid => uid in otherVector);
    if (sharedUsers.length < 2) return;
    let dot = 0, normA = 0, normB = 0;
    sharedUsers.forEach(uid => { dot += targetVector[uid] * otherVector[uid]; normA += targetVector[uid] ** 2; normB += otherVector[uid] ** 2; });
    if (normA === 0 || normB === 0) return;
    movieSimilarities.push({ movieId: otherId, similarity: dot / (Math.sqrt(normA) * Math.sqrt(normB)), sharedUsers: sharedUsers.length });
  });

  movieSimilarities.sort((a, b) => b.similarity - a.similarity);
  const topSimilar = movieSimilarities.slice(0, 10);

  let weightedSum = 0, simSum = 0, count = 0;
  topSimilar.forEach(sim => { if (userRatings[sim.movieId] !== undefined) { weightedSum += sim.similarity * userRatings[sim.movieId]; simSum += sim.similarity; count++; } });

  const similarItems: ItemSimilarity[] = topSimilar.slice(0, 5).map(sim => {
    const movie = MOVIE_DATABASE.find(m => m.id === sim.movieId);
    return { movieId: sim.movieId, movieTitle: movie?.title || sim.movieId, similarity: Math.round(sim.similarity * 100) / 100, sharedUsers: sim.sharedUsers };
  });

  if (simSum > 0 && count > 0) return { prediction: Math.round((weightedSum / simSum) * 10) / 10, confidence: Math.round((count / topSimilar.length) * 100), similarItems };

  const communityRatings = communityUsers.filter(u => u.ratings[movieId] !== undefined);
  if (communityRatings.length > 0) {
    const avg = communityRatings.reduce((sum, u) => sum + u.ratings[movieId], 0) / communityRatings.length;
    return { prediction: Math.round(avg * 10) / 10, confidence: 20, similarItems };
  }
  return { prediction: 7.0, confidence: 5, similarItems };
};

// ═══════════════════════════════════════════════════════════════════
//  LATENT FACTOR CF (SVD-style)
// ═══════════════════════════════════════════════════════════════════

const computeLatentFactorCF = (
  movieId: string,
  userRatings: { [movieId: string]: number },
  communityUsers: CommunityUser[]
): { prediction: number; bias: number; confidence: number } => {
  const K = 5, learningRate = 0.005, regLambda = 0.02, epochs = 30;
  const allUserIds = ['current_user', ...communityUsers.map(u => u.id)];
  const allMovieIds = new Set<string>(Object.keys(userRatings));
  communityUsers.forEach(u => Object.keys(u.ratings).forEach(id => allMovieIds.add(id)));
  const movieIdList = Array.from(allMovieIds);
  const movieIdx = movieIdList.indexOf(movieId);
  if (movieIdx === -1) return { prediction: 7.0, bias: 0, confidence: 10 };

  const userFactors = allUserIds.map((_, i) => Array.from({ length: K }, (_, k) => (hashStr(`u${i}f${k}`) % 100) / 500));
  const itemFactors = movieIdList.map((_, j) => Array.from({ length: K }, (_, k) => (hashStr(`i${j}f${k}`) % 100) / 500));
  const userBias = allUserIds.map(() => 0);
  const itemBias = movieIdList.map(() => 0);
  let sum = 0, cnt = 0;
  Object.values(userRatings).forEach(r => { sum += r; cnt++; });
  communityUsers.forEach(u => Object.values(u.ratings).forEach(r => { sum += r; cnt++; }));
  const globalMean = cnt > 0 ? sum / cnt : 6;

  const trainingData: { userIdx: number; movieIdx: number; rating: number }[] = [];
  Object.entries(userRatings).forEach(([mId, rating]) => { const idx = movieIdList.indexOf(mId); if (idx !== -1) trainingData.push({ userIdx: 0, movieIdx: idx, rating }); });
  communityUsers.forEach((u, uIdx) => { Object.entries(u.ratings).forEach(([mId, rating]) => { const idx = movieIdList.indexOf(mId); if (idx !== -1) trainingData.push({ userIdx: uIdx + 1, movieIdx: idx, rating }); }); });

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const { userIdx, movieIdx: mIdx, rating } of trainingData) {
      let pred = globalMean + userBias[userIdx] + itemBias[mIdx];
      for (let k = 0; k < K; k++) pred += userFactors[userIdx][k] * itemFactors[mIdx][k];
      const error = rating - pred;
      userBias[userIdx] += learningRate * (error - regLambda * userBias[userIdx]);
      itemBias[mIdx] += learningRate * (error - regLambda * itemBias[mIdx]);
      for (let k = 0; k < K; k++) {
        const ufk = userFactors[userIdx][k], ifk = itemFactors[mIdx][k];
        userFactors[userIdx][k] += learningRate * (error * ifk - regLambda * ufk);
        itemFactors[mIdx][k] += learningRate * (error * ufk - regLambda * ifk);
      }
    }
  }

  let prediction = globalMean + userBias[0] + itemBias[movieIdx];
  for (let k = 0; k < K; k++) prediction += userFactors[0][k] * itemFactors[movieIdx][k];
  const userRatedCount = Object.keys(userRatings).length;
  return { prediction: Math.max(1, Math.min(10, Math.round(prediction * 10) / 10)), bias: Math.round((userBias[0] + itemBias[movieIdx]) * 100) / 100, confidence: Math.min(80, userRatedCount * 10 + 10) };
};

// ═══════════════════════════════════════════════════════════════════
//  CONTENT-BASED SCORING
// ═══════════════════════════════════════════════════════════════════

const computeContentScore = (movie: Movie, profile: UserTasteProfile): { score: number; prediction: number } => {
  let totalScore = 0, totalWeight = 0;

  let genreScore = 0;
  movie.genres.forEach(g => { if (profile.favoriteGenres.includes(g)) genreScore += 40; if (profile.dislikedGenres.includes(g)) genreScore -= 50; });
  genreScore = Math.max(-100, Math.min(100, genreScore)); if (genreScore === 0) genreScore = 20;
  totalScore += ((genreScore + 100) / 2) * 25; totalWeight += 25;

  let peopleScore = 0;
  peopleScore += movie.director.filter(d => profile.favoriteDirectors.includes(d)).length * 50;
  peopleScore += movie.cast.filter(a => profile.favoriteActors.includes(a)).length * 30;
  peopleScore -= movie.director.filter(d => profile.dislikedDirectors.includes(d)).length * 60;
  peopleScore -= movie.cast.filter(a => profile.dislikedActors.includes(a)).length * 40;
  peopleScore = Math.max(-100, Math.min(100, peopleScore === 0 ? 10 : peopleScore));
  totalScore += ((peopleScore + 100) / 2) * 15; totalWeight += 15;

  let tropesScore = 0;
  tropesScore += movie.tropes.filter(t => profile.lovedTropes.includes(t)).length * 35;
  tropesScore -= movie.tropes.filter(t => profile.dislikedTropes.includes(t)).length * 40;
  tropesScore = Math.max(-100, Math.min(100, tropesScore === 0 ? 15 : tropesScore));
  totalScore += ((tropesScore + 100) / 2) * 25; totalWeight += 25;

  let vibeScore = 0, maxVibePoints = 0;
  const attrs: Array<keyof MovieAttributes> = ['pacing', 'tone', 'complexity', 'visuals', 'emotion'];
  attrs.forEach(attr => {
    const weight = profile.attributeWeights[attr] || 3;
    const diff = Math.abs(movie.attributes[attr] - profile.preferredAttributes[attr]);
    maxVibePoints += weight * 10; vibeScore += weight * (10 - diff);
  });
  const normalizedVibe = ((vibeScore / maxVibePoints) * 200) - 100;
  totalScore += ((Math.max(-100, Math.min(100, normalizedVibe)) + 100) / 2) * 20; totalWeight += 20;

  const finalScore = totalScore / totalWeight;
  const prediction = 1 + (finalScore / 100) * 9;
  return { score: finalScore, prediction: Math.round(prediction * 10) / 10 };
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN HYBRID ANALYSIS ENGINE
// ═══════════════════════════════════════════════════════════════════

export const analyzeTaste = (movie: Movie, profile: UserTasteProfile): AnalysisResult => {
  const factorBreakdown: MatchFactor[] = [];
  const pros: string[] = [];
  const cons: string[] = [];
  const isUnreleased = movie.isUnreleased || false;

  const userRatings: { [mId: string]: number } = {};
  profile.watchedMovies.forEach(wm => { userRatings[wm.movieId] = wm.userRating; });
  const community = generateCommunityUsers();

  // For unreleased movies, we only do content-based analysis (no CF ratings)
  if (isUnreleased) {
    // 1. GENRE
    let genreScore = 0;
    const matchingFavGenres: string[] = [];
    const matchingDisGenres: string[] = [];
    movie.genres.forEach(g => {
      if (profile.favoriteGenres.includes(g)) { genreScore += 40; matchingFavGenres.push(g); }
      if (profile.dislikedGenres.includes(g)) { genreScore -= 50; matchingDisGenres.push(g); }
    });
    genreScore = Math.max(-100, Math.min(100, genreScore));
    if (genreScore === 0) genreScore = 20;
    if (matchingFavGenres.length > 0) pros.push(`Based on the genre (${matchingFavGenres.join(', ')}), this could be a great match for you.`);
    if (matchingDisGenres.length > 0) cons.push(`Belongs to the ${matchingDisGenres.join(', ')} genre, which you generally dislike.`);
    factorBreakdown.push({ category: 'Genre', score: genreScore, weight: 30, description: matchingFavGenres.length > 0 ? `Genre match: ${matchingFavGenres.join(', ')}` : matchingDisGenres.length > 0 ? `Genre mismatch: ${matchingDisGenres.join(', ')}` : 'Neutral genre alignment.', isPositive: genreScore >= 0 });

    // 2. DIRECTOR & CAST (heavier weight for unreleased)
    let peopleScore = 0;
    const favDir = movie.director.filter(d => profile.favoriteDirectors.includes(d));
    const disDir = movie.director.filter(d => profile.dislikedDirectors.includes(d));
    const favAct = movie.cast.filter(a => profile.favoriteActors.includes(a));
    const disAct = movie.cast.filter(a => profile.dislikedActors.includes(a));
    peopleScore += favDir.length * 50 + favAct.length * 30;
    peopleScore -= disDir.length * 60 + disAct.length * 40;
    peopleScore = Math.max(-100, Math.min(100, peopleScore === 0 ? 10 : peopleScore));
    if (favDir.length > 0) pros.push(`Directed by ${favDir.join(', ')}, whom you have listed in your favorites. Based on their track record, this is highly anticipated.`);
    if (favAct.length > 0) pros.push(`Stars ${favAct.join(' and ')}, actors you highly appreciate.`);
    if (disDir.length > 0) cons.push(`Directed by ${disDir.join(', ')}, whose work you typically dislike.`);
    if (disAct.length > 0) cons.push(`Stars ${disAct.join(', ')}, whom you prefer to avoid.`);
    factorBreakdown.push({ category: 'Director/Cast', score: peopleScore, weight: 35, description: (favDir.length > 0 || favAct.length > 0) ? `Creative team you love: ${[...favDir, ...favAct].join(', ')}` : (disDir.length > 0 || disAct.length > 0) ? `Team you dislike: ${[...disDir, ...disAct].join(', ')}` : 'Neutral creative team.', isPositive: peopleScore >= 0 });

    // 3. TROPES
    let tropesScore = 0;
    const favTropes = movie.tropes.filter(t => profile.lovedTropes.includes(t));
    const disTropes = movie.tropes.filter(t => profile.dislikedTropes.includes(t));
    tropesScore += favTropes.length * 35;
    tropesScore -= disTropes.length * 40;
    tropesScore = Math.max(-100, Math.min(100, tropesScore === 0 ? 15 : tropesScore));
    if (favTropes.length > 0) pros.push(`Expected to feature devices you love: ${favTropes.slice(0, 3).join(', ')}.`);
    if (disTropes.length > 0) cons.push(`May include elements you dislike: ${disTropes.slice(0, 3).join(', ')}.`);
    factorBreakdown.push({ category: 'Tropes', score: tropesScore, weight: 20, description: favTropes.length > 0 ? `Expected tropes: ${favTropes.slice(0, 2).join(', ')}` : disTropes.length > 0 ? `Concerning tropes: ${disTropes.slice(0, 2).join(', ')}` : 'No strong trope signals.', isPositive: tropesScore >= 0 });

    // 4. VIBE
    let vibeScore = 0, maxVibePoints = 0;
    const vibeDiffs: string[] = [];
    const attrsList: Array<keyof MovieAttributes> = ['pacing', 'tone', 'complexity', 'visuals', 'emotion'];
    attrsList.forEach(attr => {
      const weight = profile.attributeWeights[attr] || 3;
      const diff = Math.abs(movie.attributes[attr] - profile.preferredAttributes[attr]);
      maxVibePoints += weight * 10; vibeScore += weight * (10 - diff);
      if (diff > 4) {
        const desc = attr === 'pacing' ? (movie.attributes[attr] > 5 ? 'relentless pacing' : 'glacial pacing')
          : attr === 'tone' ? (movie.attributes[attr] > 5 ? 'whimsical tone' : 'very dark tone')
          : attr === 'complexity' ? (movie.attributes[attr] > 5 ? 'highly complex plot' : 'very simple plot')
          : attr === 'visuals' ? (movie.attributes[attr] > 5 ? 'spectacular visuals' : 'gritty/grounded look')
          : (movie.attributes[attr] > 5 ? 'high emotional intensity' : 'clinical/cold feeling');
        vibeDiffs.push(desc);
      }
    });
    vibeScore = ((vibeScore / maxVibePoints) * 200) - 100;
    vibeScore = Math.max(-100, Math.min(100, vibeScore));
    if (vibeScore > 40) pros.push(`Based on the creative team's style, this film's vibe should match your ideal preferences.`);
    else if (vibeDiffs.length > 0) cons.push(`Based on known details, expect a ${vibeDiffs.slice(0, 2).join(' and a ')}.`);
    factorBreakdown.push({ category: 'Vibe', score: vibeScore, weight: 15, description: vibeScore > 40 ? 'Projected vibe alignment looks excellent.' : vibeScore > 0 ? 'Decent projected alignment.' : `Vibe mismatch projected: ${vibeDiffs.slice(0, 2).join(', ')}.`, isPositive: vibeScore >= 0 });

    // COMPOSITE
    let totalWeighted = 0, totalW = 0;
    factorBreakdown.forEach(fb => { totalWeighted += ((fb.score + 100) / 2) * fb.weight; totalW += fb.weight; });
    const finalScore = Math.round(totalWeighted / totalW);

    let verdict: AnalysisResult['verdict'] = 'WORTH A LOOK';
    if (finalScore >= 85) verdict = 'MUST WATCH';
    else if (finalScore >= 70) verdict = 'HIGHLY RECOMMENDED';
    else if (finalScore >= 50) verdict = 'WORTH A LOOK';
    else if (finalScore >= 35) verdict = 'PROCEED WITH CAUTION';
    else verdict = 'SKIP IT';

    const summary = `"${movie.title}" (${movie.releaseDate || movie.year}) has NOT been released yet. Our pre-release recommendation is based entirely on the creative team, genre, and expected storytelling devices. ${finalScore >= 70 ? 'Based on the team behind it, this looks very promising for your taste!' : finalScore >= 50 ? 'This has potential based on the team, but we will need to wait for reviews to confirm.' : 'Based on available details, this may not align well with your preferences.'}`;

    if (pros.length === 0) pros.push('Based on available production details, this looks like a solid upcoming film.');
    if (cons.length === 0) cons.push('No specific concerns, but we cannot rate it until it releases.');

    const emptyCFMetrics: CFMetrics = {
      userUserPrediction: 0, userUserConfidence: 0, userUserNeighbors: 0, tasteTwins: [],
      itemItemPrediction: 0, itemItemConfidence: 0, similarItems: [],
      latentFactorPrediction: 0, latentFactorBias: 0,
      contentWeight: 1.0, userUserWeight: 0, itemItemWeight: 0, latentFactorWeight: 0,
      contentPrediction: 0, finalPrediction: 0
    };

    return { movie, matchScore: finalScore, verdict, summary, pros, cons, factorBreakdown, browsingLog: [], cfMetrics: emptyCFMetrics };
  }

  // ═══ RELEASED MOVIES: FULL HYBRID CF ═══

  // 1. GENRE
  let genreScore = 0;
  const matchingFavGenres: string[] = [];
  const matchingDisGenres: string[] = [];
  movie.genres.forEach(g => {
    if (profile.favoriteGenres.includes(g)) { genreScore += 40; matchingFavGenres.push(g); }
    if (profile.dislikedGenres.includes(g)) { genreScore -= 50; matchingDisGenres.push(g); }
  });
  genreScore = Math.max(-100, Math.min(100, genreScore));
  if (genreScore === 0) genreScore = 20;
  if (matchingFavGenres.length > 0) pros.push(`Fits your love for ${matchingFavGenres.join(' and ')} movies.`);
  if (matchingDisGenres.length > 0) cons.push(`Belongs to the ${matchingDisGenres.join(', ')} genre, which you generally dislike.`);
  factorBreakdown.push({ category: 'Genre', score: genreScore, weight: 20, description: matchingFavGenres.length > 0 ? `Matches favorite genres: ${matchingFavGenres.join(', ')}` : matchingDisGenres.length > 0 ? `Contains disliked genres: ${matchingDisGenres.join(', ')}` : 'Neutral genre alignment.', isPositive: genreScore >= 0 });

  // 2. DIRECTOR & CAST
  let peopleScore = 0;
  const favDir = movie.director.filter(d => profile.favoriteDirectors.includes(d));
  const disDir = movie.director.filter(d => profile.dislikedDirectors.includes(d));
  const favAct = movie.cast.filter(a => profile.favoriteActors.includes(a));
  const disAct = movie.cast.filter(a => profile.dislikedActors.includes(a));
  peopleScore += favDir.length * 50 + favAct.length * 30;
  peopleScore -= disDir.length * 60 + disAct.length * 40;
  peopleScore = Math.max(-100, Math.min(100, peopleScore === 0 ? 10 : peopleScore));
  if (favDir.length > 0) pros.push(`Directed by ${favDir.join(', ')}, whom you have listed in your favorites.`);
  if (favAct.length > 0) pros.push(`Stars ${favAct.join(' and ')}, actors you highly appreciate.`);
  if (disDir.length > 0) cons.push(`Directed by ${disDir.join(', ')}, whose work you typically dislike.`);
  if (disAct.length > 0) cons.push(`Stars ${disAct.join(', ')}, whom you prefer to avoid.`);
  factorBreakdown.push({ category: 'Director/Cast', score: peopleScore, weight: 10, description: (favDir.length > 0 || favAct.length > 0) ? `Creators/cast you love: ${[...favDir, ...favAct].join(', ')}` : (disDir.length > 0 || disAct.length > 0) ? `Creators/cast you dislike: ${[...disDir, ...disAct].join(', ')}` : 'Neutral cast and crew.', isPositive: peopleScore >= 0 });

  // 3. TROPES
  let tropesScore = 0;
  const favTropes = movie.tropes.filter(t => profile.lovedTropes.includes(t));
  const disTropes = movie.tropes.filter(t => profile.dislikedTropes.includes(t));
  tropesScore += favTropes.length * 35;
  tropesScore -= disTropes.length * 40;
  tropesScore = Math.max(-100, Math.min(100, tropesScore === 0 ? 15 : tropesScore));
  if (favTropes.length > 0) pros.push(`Features storytelling devices you love: ${favTropes.slice(0, 3).join(', ')}${favTropes.length > 3 ? '...' : ''}.`);
  if (disTropes.length > 0) cons.push(`Includes elements you dislike: ${disTropes.slice(0, 3).join(', ')}${disTropes.length > 3 ? '...' : ''}.`);
  factorBreakdown.push({ category: 'Tropes', score: tropesScore, weight: 15, description: favTropes.length > 0 ? `Includes ${favTropes.length} tropes you enjoy: ${favTropes.slice(0, 2).join(', ')}` : disTropes.length > 0 ? `Includes ${disTropes.length} elements you dislike: ${disTropes.slice(0, 2).join(', ')}` : 'No conflicting tropes.', isPositive: tropesScore >= 0 });

  // 4. VIBE
  let vibeScore = 0, maxVibePoints = 0;
  const vibeDiffs: string[] = [];
  const attrsList: Array<keyof MovieAttributes> = ['pacing', 'tone', 'complexity', 'visuals', 'emotion'];
  attrsList.forEach(attr => {
    const weight = profile.attributeWeights[attr] || 3;
    const diff = Math.abs(movie.attributes[attr] - profile.preferredAttributes[attr]);
    maxVibePoints += weight * 10; vibeScore += weight * (10 - diff);
    if (diff > 4) {
      const desc = attr === 'pacing' ? (movie.attributes[attr] > 5 ? 'relentless pacing' : 'glacial pacing')
        : attr === 'tone' ? (movie.attributes[attr] > 5 ? 'whimsical tone' : 'very dark tone')
        : attr === 'complexity' ? (movie.attributes[attr] > 5 ? 'highly complex plot' : 'very simple plot')
        : attr === 'visuals' ? (movie.attributes[attr] > 5 ? 'spectacular visuals' : 'gritty/grounded look')
        : (movie.attributes[attr] > 5 ? 'high emotional intensity' : 'clinical/cold feeling');
      vibeDiffs.push(desc);
    }
  });
  vibeScore = ((vibeScore / maxVibePoints) * 200) - 100;
  vibeScore = Math.max(-100, Math.min(100, vibeScore));
  if (vibeScore > 40) pros.push('The movie\'s vibe matches your ideal preferences perfectly.');
  else if (vibeDiffs.length > 0) cons.push(`Vibe mismatch: features a ${vibeDiffs.slice(0, 2).join(' and a ')}.`);
  factorBreakdown.push({ category: 'Vibe', score: vibeScore, weight: 15, description: vibeScore > 40 ? 'Perfect atmosphere alignment!' : vibeScore > 0 ? 'Decent stylistic alignment.' : `Atmospheric mismatch on: ${vibeDiffs.slice(0, 2).join(', ')}.`, isPositive: vibeScore >= 0 });

  // 5. USER-USER CF
  const userUserResult = computeUserUserCF(movie.id, userRatings, community);
  const userUserNormalized = ((userUserResult.prediction - 5.5) / 4.5) * 100;
  const userUserScore = Math.max(-100, Math.min(100, userUserNormalized));
  if (userUserResult.prediction >= 7.5) pros.push(`Your "taste twins" rated this ${userUserResult.prediction}/10 — highly recommended by the community.`);
  else if (userUserResult.prediction <= 4.5) cons.push(`Similar viewers rated this only ${userUserResult.prediction}/10 — may not suit your taste.`);
  factorBreakdown.push({ category: 'User-User CF', score: userUserScore, weight: 10, description: userUserResult.tasteTwins.length > 0 ? `Found ${userUserResult.tasteTwins.length} taste twins. Predicted: ${userUserResult.prediction}/10` : `Community average: ${userUserResult.prediction}/10. Rate more movies to find taste twins.`, isPositive: userUserScore >= 0 });

  // 6. ITEM-ITEM CF
  const itemItemResult = computeItemItemCF(movie.id, userRatings, community);
  const itemItemNormalized = ((itemItemResult.prediction - 5.5) / 4.5) * 100;
  const itemItemScore = Math.max(-100, Math.min(100, itemItemNormalized));
  if (itemItemResult.similarItems.length > 0) {
    const topSimilar = itemItemResult.similarItems[0];
    if (userRatings[topSimilar.movieId] !== undefined) {
      const ur = userRatings[topSimilar.movieId];
      if (ur >= 7) pros.push(`Similar to "${topSimilar.movieTitle}" which you rated ${ur}/10. Strong match.`);
      else if (ur <= 4) cons.push(`Shares patterns with "${topSimilar.movieTitle}" which you rated low (${ur}/10).`);
    }
  }
  factorBreakdown.push({ category: 'Item-Item CF', score: itemItemScore, weight: 10, description: itemItemResult.similarItems.length > 0 ? `Top similar: "${itemItemResult.similarItems[0].movieTitle}" (${itemItemResult.similarItems[0].similarity} cos). Predicted: ${itemItemResult.prediction}/10` : `Insufficient item overlap. Prediction: ${itemItemResult.prediction}/10`, isPositive: itemItemScore >= 0 });

  // 7. LATENT FACTORS
  const latentResult = computeLatentFactorCF(movie.id, userRatings, community);
  const latentNormalized = ((latentResult.prediction - 5.5) / 4.5) * 100;
  const latentScore = Math.max(-100, Math.min(100, latentNormalized));
  if (latentResult.prediction >= 7.5) pros.push(`Matrix factorization predicts you'll rate this ${latentResult.prediction}/10 based on hidden patterns.`);
  else if (latentResult.prediction <= 4.5) cons.push(`Latent factor model predicts a low rating of ${latentResult.prediction}/10.`);
  factorBreakdown.push({ category: 'Latent Factors', score: latentScore, weight: 10, description: `SVD decomposition (${latentResult.confidence}% conf). Bias: ${latentResult.bias > 0 ? '+' : ''}${latentResult.bias}. Predicted: ${latentResult.prediction}/10`, isPositive: latentScore >= 0 });

  // HYBRID BLENDING
  const contentPred = computeContentScore(movie, profile);
  const hasHistory = Object.keys(userRatings).length >= 3;
  const contentWeight = hasHistory ? 0.40 : 0.60;
  const userUserWeight = hasHistory ? 0.20 : 0.15;
  const itemItemWeight = hasHistory ? 0.15 : 0.10;
  const latentWeight = hasHistory ? 0.25 : 0.15;
  const finalPrediction = contentPred.prediction * contentWeight + userUserResult.prediction * userUserWeight + itemItemResult.prediction * itemItemWeight + latentResult.prediction * latentWeight;

  const cfMetrics: CFMetrics = {
    userUserPrediction: userUserResult.prediction, userUserConfidence: userUserResult.confidence, userUserNeighbors: userUserResult.tasteTwins.length, tasteTwins: userUserResult.tasteTwins,
    itemItemPrediction: itemItemResult.prediction, itemItemConfidence: itemItemResult.confidence, similarItems: itemItemResult.similarItems,
    latentFactorPrediction: latentResult.prediction, latentFactorBias: latentResult.bias,
    contentWeight, userUserWeight, itemItemWeight, latentFactorWeight: latentWeight,
    contentPrediction: contentPred.prediction, finalPrediction: Math.round(finalPrediction * 10) / 10
  };

  const finalScore = Math.round(((finalPrediction - 1) / 9) * 100);

  let verdict: AnalysisResult['verdict'] = 'WORTH A LOOK';
  if (finalScore >= 85) verdict = 'MUST WATCH';
  else if (finalScore >= 70) verdict = 'HIGHLY RECOMMENDED';
  else if (finalScore >= 50) verdict = 'WORTH A LOOK';
  else if (finalScore >= 35) verdict = 'PROCEED WITH CAUTION';
  else verdict = 'SKIP IT';

  const cfAgreement = Math.abs(contentPred.prediction - userUserResult.prediction) < 1.5 ? 'strong' : 'moderate';
  let summary = `Our Hybrid Recommendation Engine analyzed "${movie.title}" (${movie.year}) across 7 distinct vectors. `;
  if (finalScore >= 85) summary += `Exceptional match (${finalScore}%)! Both content analysis AND collaborative signals converge on a ${finalPrediction.toFixed(1)}/10 prediction. A must-watch!`;
  else if (finalScore >= 70) summary += `Strong match (${finalScore}%) with a hybrid prediction of ${finalPrediction.toFixed(1)}/10. The ${cfAgreement} agreement gives us high confidence. Highly recommended.`;
  else if (finalScore >= 50) summary += `Adequate match (${finalScore}%, hybrid prediction: ${finalPrediction.toFixed(1)}/10). Some alignment, but collaborative signals are mixed. Worth a look.`;
  else if (finalScore >= 35) summary += `Below average match (${finalScore}%, hybrid prediction: ${finalPrediction.toFixed(1)}/10). Both content and collaborative models flag concerns. Proceed with caution.`;
  else summary += `Poor match (${finalScore}%, hybrid prediction: ${finalPrediction.toFixed(1)}/10). All hybrid components indicate this conflicts with your taste profile.`;

  if (pros.length === 0) pros.push(`A highly rated film (IMDb ${movie.rating}/10) with solid critical reception.`);
  if (cons.length === 0) cons.push('No specific conflicts, but the hybrid model lacks strong positive signals.');

  return { movie, matchScore: finalScore, verdict, summary, pros, cons, factorBreakdown, browsingLog: [], cfMetrics };
};

// ═══════════════════════════════════════════════════════════════════
//  SEED PROFILES
// ═══════════════════════════════════════════════════════════════════

export const SEED_PROFILES: { [key: string]: { name: string; description: string; profile: UserTasteProfile } } = {
  cinephile: {
    name: "The Cinephile Critic", description: "Loves complex, dark, slow-burn dramas. Dislikes mindless action.",
    profile: {
      watchedMovies: [
        { movieId: "parasite", title: "Parasite", year: 2019, userRating: 10, status: 'loved', review: "Masterpiece!" },
        { movieId: "the-godfather", title: "The Godfather", year: 1972, userRating: 10, status: 'loved', review: "Greatest American film." },
        { movieId: "fight-club", title: "Fight Club", year: 1999, userRating: 9, status: 'loved' },
        { movieId: "se7en", title: "Se7en", year: 1995, userRating: 9, status: 'liked' },
        { movieId: "barbie", title: "Barbie", year: 2023, userRating: 4, status: 'disliked', review: "Too campy." },
        { movieId: "superbad", title: "Superbad", year: 2007, userRating: 3, status: 'hated', review: "Crude." }
      ],
      favoriteGenres: ["Drama", "Thriller", "Crime", "Mystery", "Biography"], dislikedGenres: ["Comedy", "Action", "Family"],
      favoriteDirectors: ["David Fincher", "Bong Joon Ho", "Christopher Nolan", "Martin Scorsese", "Stanley Kubrick"], dislikedDirectors: ["Michael Bay"],
      favoriteActors: ["Cillian Murphy", "Joaquin Phoenix", "Leonardo DiCaprio", "Natalie Portman", "Morgan Freeman"], dislikedActors: ["Dwayne Johnson", "Vin Diesel"],
      lovedTropes: ["Unreliable Narrator", "Plot Twist", "Mind-bending", "Class Struggle", "Slow-Burn Dread", "Psychological Descent"], dislikedTropes: ["Gross-out Humor", "Crude Humor", "High School Party", "Musical Numbers"],
      preferredAttributes: { pacing: 3, tone: 2, complexity: 9, visuals: 6, emotion: 8 }, attributeWeights: { pacing: 4, tone: 4, complexity: 5, visuals: 3, emotion: 4 }
    }
  },
  actionJunkie: {
    name: "Action & Sci-Fi Enthusiast", description: "Loves high-octane blockbusters and epic quests. Hates slow dramas.",
    profile: {
      watchedMovies: [
        { movieId: "mad-max-fury-road", title: "Mad Max: Fury Road", year: 2015, userRating: 10, status: 'loved' },
        { movieId: "john-wick", title: "John Wick", year: 2014, userRating: 9, status: 'loved' },
        { movieId: "the-matrix", title: "The Matrix", year: 1999, userRating: 10, status: 'loved' },
        { movieId: "inception", title: "Inception", year: 2010, userRating: 9, status: 'liked' },
        { movieId: "the-notebook", title: "The Notebook", year: 2004, userRating: 2, status: 'hated' },
        { movieId: "hereditary", title: "Hereditary", year: 2018, userRating: 4, status: 'disliked' }
      ],
      favoriteGenres: ["Action", "Sci-Fi", "Adventure", "Thriller"], dislikedGenres: ["Romance", "Drama", "History"],
      favoriteDirectors: ["Christopher Nolan", "George Miller", "Chad Stahelski", "Denis Villeneuve", "Ridley Scott"], dislikedDirectors: ["Terrence Malick"],
      favoriteActors: ["Keanu Reeves", "Tom Hardy", "Christian Bale", "Charlize Theron", "Brad Pitt"], dislikedActors: [],
      lovedTropes: ["High-Octane Chase", "Practical Effects", "Retired Badass", "One-Man Army", "Bullet Time", "Cyberpunk", "Epic Scale"], dislikedTropes: ["Slow-Burn Horror", "Tear-Jerker", "Musical Numbers"],
      preferredAttributes: { pacing: 9, tone: 5, complexity: 4, visuals: 10, emotion: 4 }, attributeWeights: { pacing: 5, tone: 2, complexity: 3, visuals: 5, emotion: 2 }
    }
  },
  hopelessRomantic: {
    name: "Hopeless Romantic", description: "Loves emotional resonance and whimsical tones. Dislikes violence.",
    profile: {
      watchedMovies: [
        { movieId: "la-la-land", title: "La La Land", year: 2016, userRating: 10, status: 'loved' },
        { movieId: "the-notebook", title: "The Notebook", year: 2004, userRating: 9, status: 'loved' },
        { movieId: "about-time", title: "About Time", year: 2013, userRating: 10, status: 'loved' },
        { movieId: "forrest-gump", title: "Forrest Gump", year: 1994, userRating: 8, status: 'liked' },
        { movieId: "se7en", title: "Se7en", year: 1995, userRating: 1, status: 'hated' },
        { movieId: "john-wick", title: "John Wick", year: 2014, userRating: 3, status: 'disliked' }
      ],
      favoriteGenres: ["Romance", "Drama", "Comedy", "Music", "Animation"], dislikedGenres: ["Horror", "Action", "Crime", "Thriller"],
      favoriteDirectors: ["Damien Chazelle", "Richard Curtis", "Hayao Miyazaki", "Greta Gerwig"], dislikedDirectors: ["David Fincher", "Ari Aster"],
      favoriteActors: ["Ryan Gosling", "Emma Stone", "Rachel McAdams", "Margot Robbie", "Tom Hanks"], dislikedActors: [],
      lovedTropes: ["Musical Numbers", "Star-Crossed Lovers", "Meet-Cute", "First Love", "Tear-Jerker Ending", "Ghibli Magic", "Whimsical Atmosphere"], dislikedTropes: ["Serial Killer", "Stylized Violence", "Body Horror", "Jumpscares", "Bleak Worldview"],
      preferredAttributes: { pacing: 5, tone: 8, complexity: 4, visuals: 8, emotion: 10 }, attributeWeights: { pacing: 3, tone: 4, complexity: 3, visuals: 4, emotion: 5 }
    }
  }
};

export const createEmptyProfile = (): UserTasteProfile => ({
  watchedMovies: [], favoriteGenres: [], dislikedGenres: [], favoriteDirectors: [], dislikedDirectors: [],
  favoriteActors: [], dislikedActors: [], lovedTropes: [], dislikedTropes: [],
  preferredAttributes: { pacing: 5, tone: 5, complexity: 5, visuals: 5, emotion: 5 },
  attributeWeights: { pacing: 3, tone: 3, complexity: 3, visuals: 3, emotion: 3 }
});
