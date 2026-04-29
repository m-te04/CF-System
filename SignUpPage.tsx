import React, { useState } from 'react';
import { User, SignUpPreferences } from '../types';
import { signUp } from '../utils/auth';
import { MOVIE_DATABASE, GENRES } from '../data/movies';
import { Clapperboard, AlertCircle, ArrowLeft, ArrowRight, Check, Heart, XCircle, Sparkles } from 'lucide-react';

interface SignUpPageProps {
  onSignUp: (user: User) => void;
  onSwitchToLogin: () => void;
}

const STEPS = ['account', 'genres', 'movies', 'sliders', 'done'] as const;

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onSwitchToLogin }) => {
  const [step, setStep] = useState<number>(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Account info
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Genres
  const [favGenres, setFavGenres] = useState<string[]>([]);
  const [disGenres, setDisGenres] = useState<string[]>([]);

  // Watched movies
  const [watchedMovies, setWatchedMovies] = useState<{ movieId: string; title: string; year: number; rating: number; status: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated' }[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [movieRating, setMovieRating] = useState(8);
  const [movieStatus, setMovieStatus] = useState<'loved' | 'liked' | 'neutral' | 'disliked' | 'hated'>('liked');

  // Sliders
  const [pacing, setPacing] = useState(5);
  const [tone, setTone] = useState(5);
  const [complexity, setComplexity] = useState(5);
  const [visuals, setVisuals] = useState(5);
  const [emotion, setEmotion] = useState(5);

  const toggleGenre = (genre: string, list: 'fav' | 'dis') => {
    if (list === 'fav') {
      setFavGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
      setDisGenres(prev => prev.filter(g => g !== genre));
    } else {
      setDisGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
      setFavGenres(prev => prev.filter(g => g !== genre));
    }
  };

  const addWatchedMovie = () => {
    if (!selectedMovieId) return;
    const movie = MOVIE_DATABASE.find(m => m.id === selectedMovieId);
    if (!movie) return;
    if (watchedMovies.some(w => w.movieId === selectedMovieId)) return;
    setWatchedMovies(prev => [...prev, { movieId: movie.id, title: movie.title, year: movie.year, rating: movieRating, status: movieStatus }]);
    setSelectedMovieId('');
  };

  const removeWatchedMovie = (movieId: string) => {
    setWatchedMovies(prev => prev.filter(w => w.movieId !== movieId));
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 800));

    const prefs: SignUpPreferences | undefined = (favGenres.length > 0 || watchedMovies.length > 0)
      ? {
          favoriteGenres: favGenres,
          dislikedGenres: disGenres,
          watchedMovies,
          pacingPreference: pacing,
          tonePreference: tone,
          complexityPreference: complexity,
          visualsPreference: visuals,
          emotionPreference: emotion
        }
      : undefined;

    const result = signUp(username, email, password, displayName || username, prefs);
    if (result.success && result.user) {
      setStep(4);
      setTimeout(() => onSignUp(result.user!), 1500);
    } else {
      setError(result.error || 'Sign up failed');
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return username.trim().length >= 3 && email.includes('@') && password.length >= 4;
    return true;
  };

  const getLabel = (val: number, attr: string) => {
    if (attr === 'pacing') return val <= 3 ? 'Slow-burn' : val >= 7 ? 'Relentless' : 'Balanced';
    if (attr === 'tone') return val <= 3 ? 'Dark/Gritty' : val >= 7 ? 'Light/Whimsical' : 'Balanced';
    if (attr === 'complexity') return val <= 3 ? 'Brain-off Fun' : val >= 7 ? 'Mind-bending' : 'Thoughtful';
    if (attr === 'visuals') return val <= 3 ? 'Grounded' : val >= 7 ? 'Spectacular' : 'Solid';
    return val <= 3 ? 'Cold/Detached' : val >= 7 ? 'Tear-jerker' : 'Heartfelt';
  };

  const availableMovies = MOVIE_DATABASE.filter(m => !watchedMovies.some(w => w.movieId === m.id)).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl mx-4 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 mb-3">
            <Clapperboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create Your Account</h1>
          <p className="text-sm text-gray-400 mt-1">Step {Math.min(step + 1, 4)} of 4 — {['Account Info', 'Genre Preferences', 'Watch History', 'Vibe Settings', 'All Done!'][step]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.slice(0, 4).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-indigo-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* STEP 0: Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Display Name</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How should we call you?" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Username *</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username (min 3 chars)" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 4 characters" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition" />
              </div>
            </div>
          )}

          {/* STEP 1: Genres */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Click once to mark as <span className="text-green-400 font-semibold">favorite</span>, twice to mark as <span className="text-red-400 font-semibold">disliked</span>.</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => {
                  const isFav = favGenres.includes(g);
                  const isDis = disGenres.includes(g);
                  let cls = 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700';
                  if (isFav) cls = 'bg-green-950/50 border-green-500/40 text-green-400 font-bold';
                  if (isDis) cls = 'bg-red-950/40 border-red-500/30 text-red-400 font-bold';

                  const handleClick = () => {
                    if (!isFav && !isDis) toggleGenre(g, 'fav');
                    else if (isFav) toggleGenre(g, 'dis');
                    else toggleGenre(g, 'dis');
                  };

                  return (
                    <button key={g} onClick={handleClick} className={`px-3 py-2 text-sm rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${cls}`}>
                      {isFav && <Heart className="w-3.5 h-3.5 text-green-400 fill-current" />}
                      {isDis && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      {g}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">Selected {favGenres.length} favorites, {disGenres.length} disliked. You can skip this and build your profile later.</p>
            </div>
          )}

          {/* STEP 2: Watched Movies */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Add movies you've already watched to help the CF engine learn your taste.</p>
              <div className="flex gap-2">
                <select value={selectedMovieId} onChange={e => setSelectedMovieId(e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">Select a movie...</option>
                  {availableMovies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
                </select>
                <input type="number" min={1} max={10} value={movieRating} onChange={e => setMovieRating(parseInt(e.target.value) || 5)} className="w-16 bg-gray-950 border border-gray-800 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none" />
                <select value={movieStatus} onChange={e => setMovieStatus(e.target.value as any)} className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none">
                  <option value="loved">❤️ Loved</option>
                  <option value="liked">👍 Liked</option>
                  <option value="neutral">😐 OK</option>
                  <option value="disliked">👎 Disliked</option>
                  <option value="hated">🤮 Hated</option>
                </select>
                <button onClick={addWatchedMovie} disabled={!selectedMovieId} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm font-bold rounded-lg transition">+</button>
              </div>
              {watchedMovies.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {watchedMovies.map(w => (
                    <div key={w.movieId} className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                      <span className="text-sm text-white font-medium">{w.title} <span className="text-xs text-gray-500">({w.year})</span></span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-bold">{w.rating}/10</span>
                        <span className="text-xs">{w.status === 'loved' ? '❤️' : w.status === 'liked' ? '👍' : w.status === 'neutral' ? '😐' : w.status === 'disliked' ? '👎' : '🤮'}</span>
                        <button onClick={() => removeWatchedMovie(w.movieId)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Added {watchedMovies.length} movies. You can skip this and add movies later.</p>
            </div>
          )}

          {/* STEP 3: Sliders */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-400">Set your ideal movie vibe. This helps calibrate recommendations.</p>
              {([
                { label: 'Pacing', val: pacing, set: setPacing, left: 'Slow-burn', right: 'Relentless' },
                { label: 'Tone', val: tone, set: setTone, left: 'Dark/Gritty', right: 'Light/Whimsical' },
                { label: 'Plot Complexity', val: complexity, set: setComplexity, left: 'Brain-off Fun', right: 'Mind-bending' },
                { label: 'Visual Style', val: visuals, set: setVisuals, left: 'Grounded', right: 'Spectacular' },
                { label: 'Emotional Resonance', val: emotion, set: setEmotion, left: 'Cold/Detached', right: 'Tear-jerker' },
              ] as const).map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-white">{s.label}</span>
                    <span className="text-indigo-400 font-bold">{getLabel(s.val, s.label.toLowerCase().split(' ')[0])} ({s.val}/10)</span>
                  </div>
                  <input type="range" min={1} max={10} value={s.val} onChange={e => s.set(parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>{s.left}</span><span>{s.right}</span></div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-950/40 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-black text-white">Account Created!</h2>
              <p className="text-sm text-gray-400 mt-1">Redirecting you to your dashboard...</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-semibold">Setting up your Hybrid CF engine...</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
              <button onClick={() => step === 0 ? onSwitchToLogin() : setStep(step - 1)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition">
                <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Back to Login' : 'Previous'}
              </button>
              {step < 3 ? (
                <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition">
                  {isLoading ? 'Creating...' : 'Create Account'} <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {step === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Already have an account? <button onClick={onSwitchToLogin} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Sign in</button></p>
          </div>
        )}
      </div>
    </div>
  );
};
