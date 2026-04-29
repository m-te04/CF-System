import { User, SignUpPreferences, UserTasteProfile, WatchedMovie } from '../types';
import { MOVIE_DATABASE } from '../data/movies';

const USERS_KEY = 'cinetaste_users';
const SESSION_KEY = 'cinetaste_session';

const AVATARS = ['🎬', '🎥', '🍿', '🎞️', '🎭', '🎪', '🌟', '⭐', '🎯', '🎨', '🎵', '🎸', '🎹', '🎻', '🎺', '🥁'];

function getStoredUsers(): { [id: string]: User & { password: string; profile: UserTasteProfile } } {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveStoredUsers(users: { [id: string]: User & { password: string; profile: UserTasteProfile } }) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function buildProfileFromPreferences(prefs: SignUpPreferences): UserTasteProfile {
  const watchedMovies: WatchedMovie[] = prefs.watchedMovies.map(wm => ({
    movieId: wm.movieId,
    title: wm.title,
    year: wm.year,
    userRating: wm.rating,
    status: wm.status
  }));

  const favoriteGenres = [...prefs.favoriteGenres];
  const dislikedGenres = [...prefs.dislikedGenres];

  // Auto-learn from watched movies
  prefs.watchedMovies.forEach(wm => {
    if (wm.status === 'loved' || wm.status === 'liked') {
      const movie = MOVIE_DATABASE.find(m => m.id === wm.movieId);
      if (movie) {
        movie.genres.forEach(g => {
          if (!favoriteGenres.includes(g) && !dislikedGenres.includes(g)) {
            favoriteGenres.push(g);
          }
        });
      }
    } else if (wm.status === 'disliked' || wm.status === 'hated') {
      const movie = MOVIE_DATABASE.find(m => m.id === wm.movieId);
      if (movie) {
        movie.genres.forEach(g => {
          if (!dislikedGenres.includes(g) && !favoriteGenres.includes(g)) {
            dislikedGenres.push(g);
          }
        });
      }
    }
  });

  return {
    watchedMovies,
    favoriteGenres,
    dislikedGenres,
    favoriteDirectors: [],
    dislikedDirectors: [],
    favoriteActors: [],
    dislikedActors: [],
    lovedTropes: [],
    dislikedTropes: [],
    preferredAttributes: {
      pacing: prefs.pacingPreference,
      tone: prefs.tonePreference,
      complexity: prefs.complexityPreference,
      visuals: prefs.visualsPreference,
      emotion: prefs.emotionPreference
    },
    attributeWeights: { pacing: 3, tone: 3, complexity: 3, visuals: 3, emotion: 3 }
  };
}

function createEmptyProfile(): UserTasteProfile {
  return {
    watchedMovies: [],
    favoriteGenres: [],
    dislikedGenres: [],
    favoriteDirectors: [],
    dislikedDirectors: [],
    favoriteActors: [],
    dislikedActors: [],
    lovedTropes: [],
    dislikedTropes: [],
    preferredAttributes: { pacing: 5, tone: 5, complexity: 5, visuals: 5, emotion: 5 },
    attributeWeights: { pacing: 3, tone: 3, complexity: 3, visuals: 3, emotion: 3 }
  };
}

export function signUp(
  username: string,
  email: string,
  password: string,
  displayName: string,
  preferences?: SignUpPreferences
): { success: boolean; user?: User; error?: string } {
  const users = getStoredUsers();

  if (Object.values(users).some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'Username already taken' };
  }
  if (Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered' };
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const profile = preferences
    ? buildProfileFromPreferences(preferences)
    : createEmptyProfile();
  const profileCompleted = !!preferences && (
    preferences.favoriteGenres.length > 0 || preferences.watchedMovies.length > 0
  );

  const user: User & { password: string; profile: UserTasteProfile } = {
    id,
    username,
    email,
    password,
    displayName,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    createdAt: Date.now(),
    profileCompleted,
    profile
  };

  users[id] = user;
  saveStoredUsers(users);

  localStorage.setItem(SESSION_KEY, id);

  const { password: _, profile: __, ...safeUser } = user;
  return { success: true, user: safeUser as User };
}

export function signIn(
  usernameOrEmail: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  const users = getStoredUsers();
  const found = Object.values(users).find(
    u => u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
         u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );

  if (!found) return { success: false, error: 'User not found' };
  if (found.password !== password) return { success: false, error: 'Incorrect password' };

  localStorage.setItem(SESSION_KEY, found.id);

  const { password: _, profile: __, ...safeUser } = found;
  return { success: true, user: safeUser as User };
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return null;
  const users = getStoredUsers();
  const found = users[sessionId];
  if (!found) { localStorage.removeItem(SESSION_KEY); return null; }
  const { password: _, profile: __, ...safeUser } = found;
  return safeUser as User;
}

export function getUserProfile(userId: string): UserTasteProfile | null {
  const users = getStoredUsers();
  return users[userId]?.profile || null;
}

export function saveUserProfile(userId: string, profile: UserTasteProfile) {
  const users = getStoredUsers();
  if (users[userId]) {
    users[userId].profile = profile;
    users[userId].profileCompleted = true;
    saveStoredUsers(users);
  }
}

export function markProfileCompleted(userId: string) {
  const users = getStoredUsers();
  if (users[userId]) {
    users[userId].profileCompleted = true;
    saveStoredUsers(users);
  }
}

export function getAllUsers(): User[] {
  const users = getStoredUsers();
  return Object.values(users).map(({ password: _, profile: __, ...u }) => u as User);
}
