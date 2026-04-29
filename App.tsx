import { useState, useEffect } from 'react';
import { UserTasteProfile, User } from './types';
import { createEmptyProfile } from './utils/recommendationEngine';
import { getCurrentUser, getUserProfile, saveUserProfile, signOut } from './utils/auth';
import { UserProfileManager } from './components/UserProfileManager';
import { MovieAnalyzer } from './components/MovieAnalyzer';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { 
  Clapperboard, Sliders, Eye, Search, Heart, 
  Sparkles, Film, BarChart, LogOut
} from 'lucide-react';

type AuthPage = 'login' | 'signup';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [profile, setProfile] = useState<UserTasteProfile>(createEmptyProfile());
  const [activeTab, setActiveTab] = useState<'analyze' | 'profile'>('analyze');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setUser(u);
      const p = getUserProfile(u.id);
      if (p) setProfile(p);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    const p = getUserProfile(u.id);
    if (p) setProfile(p);
    else setProfile(createEmptyProfile());
  };

  const handleProfileChange = (p: UserTasteProfile) => {
    setProfile(p);
    if (user) saveUserProfile(user.id, p);
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setProfile(createEmptyProfile());
    setAuthPage('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="text-gray-400 text-lg font-bold">Loading CineTaste...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authPage === 'signup') {
      return <SignUpPage onSignUp={handleLogin} onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onLogin={handleLogin} onSwitchToSignUp={() => setAuthPage('signup')} />;
  }

  // Calculate quick stats for the dashboard header
  const totalWatched = profile.watchedMovies.length;
  const topGenres = profile.favoriteGenres.slice(0, 3).join(', ') || 'None listed';
  const lovedTropesCount = profile.lovedTropes.length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans select-none selection:bg-indigo-500/30">
      {/* GLOWING BACKGROUND ORBS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-900 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg border border-indigo-500/30">
              <Clapperboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                CineTaste
              </h1>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide block mt-0.5">Internet Crawler & Taste Recommendation Engine</span>
            </div>
          </div>

          {/* Nav + User */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl">
              <button onClick={() => setActiveTab('analyze')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'analyze' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'}`}>
                <Search className="w-4 h-4" /><span>Movie Analyzer</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'}`}>
                <Eye className="w-4 h-4" /><span>Taste Profile</span>
              </button>
            </nav>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
              <span className="text-lg">{user.avatar}</span>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white leading-none">{user.displayName || user.username}</div>
                <div className="text-[9px] text-gray-500">@{user.username}</div>
              </div>
              <button onClick={handleSignOut} className="ml-1 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD HERO QUICK STATS */}
      <div className="bg-gray-900/40 border-b border-gray-900 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5 p-3 bg-gray-950/40 border border-gray-900 rounded-xl">
            <Film className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">Watched & Rated</span>
              <span className="text-white font-black text-sm">{totalWatched} Movies</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-gray-950/40 border border-gray-900 rounded-xl">
            <Heart className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">Favorite Genres</span>
              <span className="text-white font-black text-sm truncate max-w-[140px]" title={topGenres}>{topGenres}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-gray-950/40 border border-gray-900 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">Loved Tropes</span>
              <span className="text-white font-black text-sm">{lovedTropesCount} Active Devices</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-gray-950/40 border border-gray-900 rounded-xl">
            <BarChart className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">Pacing & Vibe Style</span>
              <span className="text-white font-black text-sm">
                P:{profile.preferredAttributes.pacing}/10 • C:{profile.preferredAttributes.complexity}/10
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {activeTab === 'analyze' ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Search className="text-indigo-400 w-6 h-6" />
                Browse & Analyze
              </h2>
              <p className="text-sm text-gray-400">
                Input any movie title. Our AI will crawl the internet for its synopsis, critic scores, themes, and pacing, and cross-reference them against your Taste Profile settings.
              </p>
            </div>
            <MovieAnalyzer profile={profile} onProfileChange={handleProfileChange} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Sliders className="text-indigo-400 w-6 h-6" />
                Taste Profile Settings
              </h2>
              <p className="text-sm text-gray-400">
                Calibrate your ideal cinematic settings. Log watched movies to build a history, or drag the sliders to lock in your preferred pacing and visual tone.
              </p>
            </div>
            <UserProfileManager profile={profile} onProfileChange={handleProfileChange} />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-950 border-t border-gray-900 py-6 mt-12 text-center text-xs text-gray-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} CineTaste. Running local scraper & matching vectors. All movie data synthesized for profile analytics.</p>
        </div>
      </footer>
    </div>
  );
}
