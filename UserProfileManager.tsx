import React, { useState } from 'react';
import { UserTasteProfile, WatchedMovie } from '../types';
import { SEED_PROFILES, createEmptyProfile } from '../utils/recommendationEngine';
import { MOVIE_DATABASE, GENRES, COMMON_TROPES, POPULAR_PEOPLE } from '../data/movies';
import { 
  Sliders, Film, Heart, XCircle, Plus, Trash, BookOpen, 
  Sparkles, Smile, Frown, Users, Eye
} from 'lucide-react';

interface UserProfileManagerProps {
  profile: UserTasteProfile;
  onProfileChange: (newProfile: UserTasteProfile) => void;
}

export const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  profile,
  onProfileChange
}) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'genres' | 'creators' | 'history'>('attributes');
  const [newMovieId, setNewMovieId] = useState('');
  const [newMovieRating, setNewMovieRating] = useState(8);
  const [newMovieStatus, setNewMovieStatus] = useState<WatchedMovie['status']>('loved');
  const [newMovieReview, setNewMovieReview] = useState('');
  
  // State for manual entries
  const [customDirector, setCustomDirector] = useState('');
  const [customActor, setCustomActor] = useState('');

  const loadSeed = (key: string) => {
    onProfileChange(JSON.parse(JSON.stringify(SEED_PROFILES[key].profile)));
  };

  const handleAttributeChange = (attr: keyof typeof profile.preferredAttributes, value: number) => {
    const updated = { ...profile };
    updated.preferredAttributes[attr] = value;
    onProfileChange(updated);
  };

  const handleWeightChange = (attr: keyof typeof profile.attributeWeights, value: number) => {
    const updated = { ...profile };
    updated.attributeWeights[attr] = value;
    onProfileChange(updated);
  };

  const toggleArrayItem = (
    field: 'favoriteGenres' | 'dislikedGenres' | 'favoriteDirectors' | 'dislikedDirectors' | 'favoriteActors' | 'dislikedActors' | 'lovedTropes' | 'dislikedTropes',
    item: string,
    action: 'add' | 'remove'
  ) => {
    const updated = { ...profile };
    
    // Remove from opposite list if adding to one
    if (action === 'add') {
      if (field === 'favoriteGenres' && updated.dislikedGenres.includes(item)) {
        updated.dislikedGenres = updated.dislikedGenres.filter(x => x !== item);
      } else if (field === 'dislikedGenres' && updated.favoriteGenres.includes(item)) {
        updated.favoriteGenres = updated.favoriteGenres.filter(x => x !== item);
      } else if (field === 'favoriteDirectors' && updated.dislikedDirectors.includes(item)) {
        updated.dislikedDirectors = updated.dislikedDirectors.filter(x => x !== item);
      } else if (field === 'dislikedDirectors' && updated.favoriteDirectors.includes(item)) {
        updated.dislikedDirectors = updated.dislikedDirectors.filter(x => x !== item);
      } else if (field === 'favoriteActors' && updated.dislikedActors.includes(item)) {
        updated.dislikedActors = updated.dislikedActors.filter(x => x !== item);
      } else if (field === 'dislikedActors' && updated.favoriteActors.includes(item)) {
        updated.dislikedActors = updated.dislikedActors.filter(x => x !== item);
      } else if (field === 'lovedTropes' && updated.dislikedTropes.includes(item)) {
        updated.dislikedTropes = updated.dislikedTropes.filter(x => x !== item);
      } else if (field === 'dislikedTropes' && updated.lovedTropes.includes(item)) {
        updated.lovedTropes = updated.lovedTropes.filter(x => x !== item);
      }

      if (!updated[field].includes(item)) {
        updated[field].push(item);
      }
    } else {
      updated[field] = updated[field].filter(x => x !== item);
    }
    
    onProfileChange(updated);
  };

  const handleAddWatchedMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieId) return;

    const selectedMovie = MOVIE_DATABASE.find(m => m.id === newMovieId);
    if (!selectedMovie) return;

    // Check if already in history
    if (profile.watchedMovies.some(m => m.movieId === newMovieId)) {
      alert("Movie already exists in your history.");
      return;
    }

    const newWatched: WatchedMovie = {
      movieId: selectedMovie.id,
      title: selectedMovie.title,
      year: selectedMovie.year,
      userRating: newMovieRating,
      status: newMovieStatus,
      review: newMovieReview
    };

    const updated = { ...profile };
    updated.watchedMovies = [newWatched, ...profile.watchedMovies];

    // Proactively add genres/director to profile if loved
    if (newMovieStatus === 'loved') {
      selectedMovie.genres.forEach(g => {
        if (!updated.favoriteGenres.includes(g) && !updated.dislikedGenres.includes(g)) {
          updated.favoriteGenres.push(g);
        }
      });
      selectedMovie.director.forEach(d => {
        if (!updated.favoriteDirectors.includes(d) && !updated.dislikedDirectors.includes(d)) {
          updated.favoriteDirectors.push(d);
        }
      });
    }

    onProfileChange(updated);
    setNewMovieId('');
    setNewMovieReview('');
    setNewMovieRating(8);
    setNewMovieStatus('loved');
  };

  const handleRemoveWatchedMovie = (movieId: string) => {
    const updated = { ...profile };
    updated.watchedMovies = updated.watchedMovies.filter(m => m.movieId !== movieId);
    onProfileChange(updated);
  };

  const getAttributeLabels = (attr: string, value: number) => {
    if (attr === 'pacing') return value <= 3 ? 'Glacial' : value >= 8 ? 'Relentless' : 'Balanced';
    if (attr === 'tone') return value <= 3 ? 'Bleak / Gritty' : value >= 8 ? 'Light / Whimsical' : 'Balanced';
    if (attr === 'complexity') return value <= 3 ? 'Brain-Off / Pure Fun' : value >= 8 ? 'Mind-bending' : 'Thoughtful';
    if (attr === 'visuals') return value <= 3 ? 'Gritty / Grounded' : value >= 8 ? 'Spectacular Spectacle' : 'Solid';
    return value <= 3 ? 'Cold / Analytical' : value >= 8 ? 'Tear-Jerker' : 'Heartfelt';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header with Seed Profiles */}
      <div className="p-6 border-b border-gray-800 bg-gray-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Eye className="text-indigo-500 w-5 h-5" />
              Configure Your Taste Profile
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Customize your movie preferences. The AI recommendation engine uses this exact data to analyze if movies match your specific taste.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onProfileChange(createEmptyProfile())}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
            >
              Reset to Empty
            </button>
            {Object.keys(SEED_PROFILES).map((key) => (
              <button
                key={key}
                onClick={() => loadSeed(key)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/50 flex items-center gap-1 transition shadow-sm"
                title={SEED_PROFILES[key].description}
              >
                <Sparkles className="w-3 h-3" />
                Load "{SEED_PROFILES[key].name}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navbar */}
      <div className="flex border-b border-gray-800 bg-gray-900/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'attributes'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Cinematic Sliders
        </button>
        <button
          onClick={() => setActiveTab('genres')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'genres'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          <Film className="w-4 h-4" />
          Genres & Tropes
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'creators'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          <Users className="w-4 h-4" />
          Favorite Directors & Cast
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Watch History ({profile.watchedMovies.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* TAB 1: ATTRIBUTES */}
        {activeTab === 'attributes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-2">
                <Sliders className="w-5 h-5 text-indigo-500" />
                Vibe Settings
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Drag the sliders to set your "ideal" movie vibe. Adjust the "Importance" weights to tell the AI which categories are dealbreakers for you.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {([
                { id: 'pacing', label: 'Pacing', left: 'Slow-burn', right: 'Relentless' },
                { id: 'tone', label: 'Tone', left: 'Bleak / Dark', right: 'Lighthearted' },
                { id: 'complexity', label: 'Plot Complexity', left: 'Brain-Off', right: 'Mind-Bending' },
                { id: 'visuals', label: 'Visual Style', left: 'Grounded / Gritty', right: 'Epic Spectacle' },
                { id: 'emotion', label: 'Emotional Resonance', left: 'Cool / Detached', right: 'Tear-Jerker' }
              ] as const).map((attr) => (
                <div key={attr.id} className="p-5 bg-gray-800/40 border border-gray-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white text-md">{attr.label}</span>
                    <span className="text-xs px-2.5 py-1 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-800">
                      {getAttributeLabels(attr.id, profile.preferredAttributes[attr.id])} ({profile.preferredAttributes[attr.id]}/10)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={profile.preferredAttributes[attr.id]}
                      onChange={(e) => handleAttributeChange(attr.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>{attr.left}</span>
                      <span>{attr.right}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between gap-4">
                    <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      Importance Weight:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((w) => (
                        <button
                          key={w}
                          onClick={() => handleWeightChange(attr.id, w)}
                          className={`w-7 h-7 text-xs font-bold rounded-md flex items-center justify-center transition border ${
                            profile.attributeWeights[attr.id] >= w
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700/60'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GENRES & TROPES */}
        {activeTab === 'genres' && (
          <div className="space-y-8">
            {/* Genres Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-medium text-white">Movie Genres</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Tag genres you love (green <Heart className="inline w-3 h-3"/>) or genres you actively avoid (red <XCircle className="inline w-3 h-3"/>). Click once for Love, twice for Avoid, three times to reset.
              </p>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-800/20 border border-gray-800/60 rounded-xl">
                {GENRES.map((genre) => {
                  const isLoved = profile.favoriteGenres.includes(genre);
                  const isDisliked = profile.dislikedGenres.includes(genre);
                  
                  let badgeClass = "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700/60";
                  if (isLoved) badgeClass = "bg-green-950/50 text-green-400 border-green-500/40 font-semibold";
                  if (isDisliked) badgeClass = "bg-red-950/40 text-red-400 border-red-500/30 font-semibold";

                  const handleBadgeClick = () => {
                    if (!isLoved && !isDisliked) {
                      toggleArrayItem('favoriteGenres', genre, 'add');
                    } else if (isLoved) {
                      toggleArrayItem('dislikedGenres', genre, 'add');
                    } else {
                      toggleArrayItem('dislikedGenres', genre, 'remove');
                    }
                  };

                  return (
                    <button
                      key={genre}
                      onClick={handleBadgeClick}
                      className={`px-3 py-1.5 text-sm rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${badgeClass}`}
                    >
                      {isLoved && <Heart className="w-3.5 h-3.5 text-green-400 fill-green-400" />}
                      {isDisliked && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tropes Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-medium text-white">Storytelling Tropes & Narrative Devices</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                What elements make a movie click for you? Click once for loved tropes, click twice to list as a turn-off.
              </p>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-4 bg-gray-800/20 border border-gray-800/60 rounded-xl pr-2">
                {COMMON_TROPES.map((trope) => {
                  const isLoved = profile.lovedTropes.includes(trope);
                  const isDisliked = profile.dislikedTropes.includes(trope);
                  
                  let badgeClass = "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700/60";
                  if (isLoved) badgeClass = "bg-indigo-950/60 text-indigo-400 border-indigo-500/40 font-semibold";
                  if (isDisliked) badgeClass = "bg-amber-950/30 text-amber-500 border-amber-500/20 font-semibold";

                  const handleBadgeClick = () => {
                    if (!isLoved && !isDisliked) {
                      toggleArrayItem('lovedTropes', trope, 'add');
                    } else if (isLoved) {
                      toggleArrayItem('dislikedTropes', trope, 'add');
                    } else {
                      toggleArrayItem('dislikedTropes', trope, 'remove');
                    }
                  };

                  return (
                    <button
                      key={trope}
                      onClick={handleBadgeClick}
                      className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition cursor-pointer ${badgeClass}`}
                    >
                      {isLoved && <Smile className="w-3.5 h-3.5" />}
                      {isDisliked && <Frown className="w-3.5 h-3.5" />}
                      {trope}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREATORS & CAST */}
        {activeTab === 'creators' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Industry Talent (Directors & Actors)
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Tell the AI whose movies you'll watch blindly, and whose films you tend to skip. Search our quick tags or enter names manually.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* DIRECTORS */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/40 border border-gray-800 rounded-xl">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Favorite Directors
                  </h4>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-gray-950 rounded-lg mb-3 border border-gray-800">
                    {profile.favoriteDirectors.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No directors added. Select from tags below or type a name.</span>
                    ) : (
                      profile.favoriteDirectors.map(d => (
                        <span key={d} className="px-2 py-1 text-xs rounded bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 font-medium">
                          {d}
                          <button onClick={() => toggleArrayItem('favoriteDirectors', d, 'remove')} className="hover:text-white"><XCircle className="w-3 h-3"/></button>
                        </span>
                      ))
                    )}
                  </div>

                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Avoided Directors
                  </h4>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-gray-950 rounded-lg border border-gray-800">
                    {profile.dislikedDirectors.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No avoided directors added.</span>
                    ) : (
                      profile.dislikedDirectors.map(d => (
                        <span key={d} className="px-2 py-1 text-xs rounded bg-red-950/40 text-red-400 border border-red-500/20 flex items-center gap-1 font-medium">
                          {d}
                          <button onClick={() => toggleArrayItem('dislikedDirectors', d, 'remove')} className="hover:text-white"><XCircle className="w-3 h-3"/></button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDirector}
                    onChange={(e) => setCustomDirector(e.target.value)}
                    placeholder="Enter Director Name..."
                    className="flex-1 text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (customDirector.trim()) {
                        toggleArrayItem('favoriteDirectors', customDirector.trim(), 'add');
                        setCustomDirector('');
                      }
                    }}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                    title="Add to Favorites"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                  </button>
                  <button
                    onClick={() => {
                      if (customDirector.trim()) {
                        toggleArrayItem('dislikedDirectors', customDirector.trim(), 'add');
                        setCustomDirector('');
                      }
                    }}
                    className="p-2 bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-800 rounded-lg transition"
                    title="Add to Disliked"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 border border-gray-800/80 rounded-xl bg-gray-900/40">
                  <span className="text-xs font-bold text-gray-400 block mb-2 uppercase tracking-wider">Quick Tag Popular Directors:</span>
                  <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1">
                    {POPULAR_PEOPLE.directors.map(d => {
                      const isFav = profile.favoriteDirectors.includes(d);
                      const isDis = profile.dislikedDirectors.includes(d);
                      if (isFav || isDis) return null;
                      return (
                        <button
                          key={d}
                          onClick={() => toggleArrayItem('favoriteDirectors', d, 'add')}
                          className="px-2 py-1 text-xs rounded bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                        >
                          + {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTORS */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/40 border border-gray-800 rounded-xl">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Favorite Actors
                  </h4>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-gray-950 rounded-lg mb-3 border border-gray-800">
                    {profile.favoriteActors.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No actors added. Select from tags below or type a name.</span>
                    ) : (
                      profile.favoriteActors.map(a => (
                        <span key={a} className="px-2 py-1 text-xs rounded bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 font-medium">
                          {a}
                          <button onClick={() => toggleArrayItem('favoriteActors', a, 'remove')} className="hover:text-white"><XCircle className="w-3 h-3"/></button>
                        </span>
                      ))
                    )}
                  </div>

                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Avoided Actors
                  </h4>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-gray-950 rounded-lg border border-gray-800">
                    {profile.dislikedActors.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No avoided actors added.</span>
                    ) : (
                      profile.dislikedActors.map(a => (
                        <span key={a} className="px-2 py-1 text-xs rounded bg-red-950/40 text-red-400 border border-red-500/20 flex items-center gap-1 font-medium">
                          {a}
                          <button onClick={() => toggleArrayItem('dislikedActors', a, 'remove')} className="hover:text-white"><XCircle className="w-3 h-3"/></button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customActor}
                    onChange={(e) => setCustomActor(e.target.value)}
                    placeholder="Enter Actor Name..."
                    className="flex-1 text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (customActor.trim()) {
                        toggleArrayItem('favoriteActors', customActor.trim(), 'add');
                        setCustomActor('');
                      }
                    }}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                    title="Add to Favorites"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                  </button>
                  <button
                    onClick={() => {
                      if (customActor.trim()) {
                        toggleArrayItem('dislikedActors', customActor.trim(), 'add');
                        setCustomActor('');
                      }
                    }}
                    className="p-2 bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-800 rounded-lg transition"
                    title="Add to Disliked"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 border border-gray-800/80 rounded-xl bg-gray-900/40">
                  <span className="text-xs font-bold text-gray-400 block mb-2 uppercase tracking-wider">Quick Tag Popular Actors:</span>
                  <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1">
                    {POPULAR_PEOPLE.actors.map(a => {
                      const isFav = profile.favoriteActors.includes(a);
                      const isDis = profile.dislikedActors.includes(a);
                      if (isFav || isDis) return null;
                      return (
                        <button
                          key={a}
                          onClick={() => toggleArrayItem('favoriteActors', a, 'add')}
                          className="px-2 py-1 text-xs rounded bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                        >
                          + {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WATCH HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Your Viewing History
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Log films you have already watched. Rating movies as "Loved" or "Hated" teaches the engine exactly what cinematic formula works for you.
                </p>
              </div>
            </div>

            {/* Log Movie Form */}
            <form onSubmit={handleAddWatchedMovie} className="p-4 bg-gray-800/30 border border-gray-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Search Database & Select Movie</label>
                <select
                  value={newMovieId}
                  onChange={(e) => setNewMovieId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose a movie from database --</option>
                  {MOVIE_DATABASE.filter(m => !profile.watchedMovies.some(wm => wm.movieId === m.id))
                    .sort((a,b) => a.title.localeCompare(b.title))
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.year}) - {m.genres.slice(0,2).join('/')}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Your Rating</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newMovieRating}
                    onChange={(e) => setNewMovieRating(parseInt(e.target.value))}
                    className="w-16 bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white text-center focus:outline-none"
                  />
                  <select
                    value={newMovieStatus}
                    onChange={(e) => setNewMovieStatus(e.target.value as WatchedMovie['status'])}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="loved">❤️ Loved It</option>
                    <option value="liked">👍 Liked It</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="disliked">👎 Disliked It</option>
                    <option value="hated">🤮 Hated It</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Short review (optional)..."
                  value={newMovieReview}
                  onChange={(e) => setNewMovieReview(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMovieId}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg flex items-center gap-1 transition shadow-md border border-indigo-500/30 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Log Film
                </button>
              </div>
            </form>

            {/* Logged Movies Table */}
            <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/60">
                    <th className="px-4 py-3">Movie Title</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3">Your Verdict</th>
                    <th className="px-4 py-3">Your Quick Review</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {profile.watchedMovies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                        No movies logged in your history yet. Add some movies above to seed your recommendation engine!
                      </td>
                    </tr>
                  ) : (
                    profile.watchedMovies.map((wm) => {
                      let statusBadge = "bg-gray-800 text-gray-400 border-gray-700";
                      if (wm.status === 'loved') statusBadge = "bg-green-950/40 text-green-400 border-green-500/30";
                      if (wm.status === 'liked') statusBadge = "bg-emerald-950/20 text-emerald-400 border-emerald-800/30";
                      if (wm.status === 'neutral') statusBadge = "bg-gray-800 text-gray-300 border-gray-700";
                      if (wm.status === 'disliked') statusBadge = "bg-orange-950/30 text-orange-400 border-orange-500/20";
                      if (wm.status === 'hated') statusBadge = "bg-red-950/40 text-red-400 border-red-500/30";

                      return (
                        <tr key={wm.movieId} className="hover:bg-gray-900/40 transition">
                          <td className="px-4 py-3 font-semibold text-white">
                            {wm.title} <span className="text-xs text-gray-500 font-normal">({wm.year})</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded font-bold bg-indigo-950 text-indigo-400 text-xs border border-indigo-800">
                              {wm.userRating}/10
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 w-max ${statusBadge}`}>
                              {wm.status === 'loved' && '❤️'}
                              {wm.status === 'liked' && '👍'}
                              {wm.status === 'neutral' && '😐'}
                              {wm.status === 'disliked' && '👎'}
                              {wm.status === 'hated' && '🤮'}
                              {wm.status.charAt(0).toUpperCase() + wm.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 italic">
                            {wm.review ? `"${wm.review}"` : <span className="text-gray-600 font-light">-</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveWatchedMovie(wm.movieId)}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded-md transition"
                              title="Delete from history"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
