import React, { useState, useEffect, useRef } from 'react';
import { UserTasteProfile, AnalysisResult, WatchedMovie, Movie } from '../types';
import { simulateInternetBrowsing, analyzeTaste } from '../utils/recommendationEngine';
import { Search, Terminal, CheckCircle, XCircle, Award, Clapperboard, Calendar, Clock, AlertTriangle, Check, RefreshCw, BarChart2, Star, Users, Layers, Cpu, Sparkles, TrendingUp, Link, Save } from 'lucide-react';

interface Props { profile: UserTasteProfile; onProfileChange: (p: UserTasteProfile) => void; }

export const MovieAnalyzer: React.FC<Props> = ({ profile, onProfileChange }) => {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [choices, setChoices] = useState<Movie[] | null>(null);
  const [rating, setRating] = useState(8);
  const [status, setStatus] = useState<WatchedMovie['status']>('liked');
  const [review, setReview] = useState('');
  const [saved, setSaved] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { terminalRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const doSearch = async (title: string) => {
    setSearching(true); setResult(null); setNotFound(null); setChoices(null); setLogs([]); setSaved(false);
    try {
      const ctx = await simulateInternetBrowsing(title, l => setLogs(p => [...p, l]));
      if (ctx.type === 'not_found') { setNotFound(title); setSearching(false); return; }
      if (ctx.type === 'multiple_matches') { setChoices(ctx.matches); setSearching(false); return; }
      const movie = ctx.selectedMovie!;
      const a = analyzeTaste(movie, profile);
      const isUnreleased = movie.isUnreleased;
      setLogs(p => [...p,
        ...(isUnreleased ? [
          `🎬 Analyzing pre-release creative team & genre alignment...`,
          `🧠 Computing Genre Fit based on expected themes...`,
          `👤 Checking Director/Cast track record against your favorites...`,
          `🎭 Projecting expected storytelling tropes...`,
          `🌊 Estimating vibe based on creative team's previous work...`,
          `📅 Pre-release recommendation compiled!`
        ] : [
          `🤖 Analyzing film against your unique taste profile...`,
          `🧠 Computing Genre Fit...`,
          `👤 Executing User-User Collaborative Filtering (Pearson correlation)...`,
          `🔗 Running Item-Item Collaborative Filtering (Cosine similarity)...`,
          `🧩 Computing Latent Factor decomposition (SVD-style)...`,
          `⚖️ Blending 4 models into Hybrid Recommendation...`,
          `✨ Final Hybrid prediction: ${a.cfMetrics.finalPrediction}/10 — Analysis complete!`
        ])
      ]);
      await new Promise(r => setTimeout(r, 600));
      setResult(a); setSearching(false);
    } catch (e) { console.error(e); setLogs(p => [...p, '❌ Error occurred.']); setSearching(false); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) doSearch(query.trim()); };

  const selectMovie = (movie: Movie) => { setChoices(null); doSearch(movie.title); };

  const handleSave = () => {
    if (!result) return;
    const m = result.movie;
    const idx = profile.watchedMovies.findIndex(w => w.movieId === m.id);
    const nw: WatchedMovie = { movieId: m.id, title: m.title, year: m.year, userRating: rating, status, review: review || undefined };
    const up = { ...profile };
    if (idx >= 0) { up.watchedMovies = [...profile.watchedMovies]; up.watchedMovies[idx] = nw; }
    else { up.watchedMovies = [nw, ...profile.watchedMovies]; }
    if (status === 'loved' || status === 'liked') {
      m.genres.forEach(g => { if (!up.favoriteGenres.includes(g) && !up.dislikedGenres.includes(g)) up.favoriteGenres.push(g); });
      m.director.forEach(d => { if (!up.favoriteDirectors.includes(d) && !up.dislikedDirectors.includes(d)) up.favoriteDirectors.push(d); });
      m.tropes.slice(0, 2).forEach(t => { if (!up.lovedTropes.includes(t) && !up.dislikedTropes.includes(t)) up.lovedTropes.push(t); });
    } else if (status === 'hated' || status === 'disliked') {
      m.genres.forEach(g => { if (!up.dislikedGenres.includes(g) && !up.favoriteGenres.includes(g)) up.dislikedGenres.push(g); });
    }
    onProfileChange(up); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const isSaved = result ? profile.watchedMovies.some(w => w.movieId === result.movie.id) : false;

  const vStyle = result ? ({
    'MUST WATCH': { bg: 'bg-green-950/60 border-green-500/60', text: 'text-green-400' },
    'HIGHLY RECOMMENDED': { bg: 'bg-indigo-950/50 border-indigo-500/40', text: 'text-indigo-400' },
    'WORTH A LOOK': { bg: 'bg-blue-950/30 border-blue-500/30', text: 'text-blue-400' },
    'PROCEED WITH CAUTION': { bg: 'bg-amber-950/30 border-amber-500/30', text: 'text-amber-500' },
    'SKIP IT': { bg: 'bg-red-950/50 border-red-500/40', text: 'text-red-400' },
  }[result.verdict] || { bg: '', text: '' }) : { bg: '', text: '' };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400 border-green-500' : s >= 60 ? 'text-indigo-400 border-indigo-500' : s >= 40 ? 'text-blue-400 border-blue-400' : s >= 25 ? 'text-amber-400 border-amber-400' : 'text-red-400 border-red-500';

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-lg font-medium text-white mb-2">What movie would you like to explore?</label>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} disabled={searching} placeholder='Enter movie title (e.g., Interstellar, "Blade Runner 2049", Arrival 2016)...' className="w-full pl-12 pr-32 py-3.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-md focus:outline-none focus:border-indigo-500 transition disabled:opacity-50" />
            <button type="submit" disabled={searching || !query.trim()} className="absolute right-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition shadow-md border border-indigo-500/30">
              {searching ? <><RefreshCw className="w-4 h-4 animate-spin" /> Browsing...</> : <><Search className="w-4 h-4" /> Analyze</>}
            </button>
          </div>
          {!searching && !result && !notFound && !choices && (
            <div className="pt-2">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Quick Search:</span>
              <div className="flex flex-wrap gap-2">
                {["Interstellar", "La La Land", "Parasite", "Arrival 2016", "Blade Runner 2049", "Moonlight", "The Lighthouse", "Past Lives"].map(t => (
                  <button key={t} type="button" onClick={() => { setQuery(t); setTimeout(() => doSearch(t), 50); }} className="px-2.5 py-1 text-xs font-semibold bg-gray-800/60 text-gray-400 rounded-md border border-gray-800 hover:border-gray-700 hover:text-gray-200 transition">{t}</button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Terminal */}
      {searching && (
        <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
          <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-indigo-400" /><span className="font-bold text-gray-300">Hybrid CF Engine v3.0</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/80 animate-pulse"></span><span className="text-[10px] text-gray-400 font-sans font-bold">ANALYZING</span></div>
          </div>
          <div className="p-4 h-80 overflow-y-auto space-y-2 font-mono text-green-400">
            {logs.map((l, i) => {
              let c = 'text-green-400';
              if (l.startsWith('🤖') || l.startsWith('🧠') || l.startsWith('🎬') || l.startsWith('🎭') || l.startsWith('🌊')) c = 'text-indigo-300';
              if (l.startsWith('📅') || l.startsWith('👤') || l.startsWith('🔗') || l.startsWith('🧩') || l.startsWith('⚖️')) c = 'text-cyan-300';
              if (l.startsWith('✅')) c = 'text-emerald-400 font-bold';
              if (l.startsWith('❌') || l.startsWith('⚠️')) c = 'text-red-400 font-bold';
              if (l.startsWith('✨')) c = 'text-yellow-300 font-bold text-sm';
              if (l.startsWith('🔎') || l.startsWith('📽️')) c = 'text-gray-300';
              return <div key={i} className={`flex gap-2 ${c}`}><span className="text-gray-600 select-none">[{new Date().toLocaleTimeString()}]</span><span>{l}</span></div>;
            })}
            <div ref={terminalRef} className="h-4"><span className="inline-block w-2 h-4 bg-green-400 animate-pulse"></span></div>
          </div>
        </div>
      )}

      {/* Multiple Matches Disambiguation */}
      {choices && !searching && (
        <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl animate-fadeIn">
          <h3 className="text-lg font-black text-amber-400 mb-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Multiple Movies Found</h3>
          <p className="text-sm text-gray-400 mb-4">We found {choices.length} movies matching "<span className="text-white font-semibold">{query}</span>". Please select the one you meant:</p>
          <div className="grid gap-3">
            {choices.map(m => (
              <button key={m.id} onClick={() => selectMovie(m)} className="flex items-center gap-4 bg-gray-950 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-4 transition text-left group">
                <div className="w-12 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-2xl shrink-0">{m.poster}</div>
                <div className="flex-1">
                  <div className="text-white font-bold group-hover:text-indigo-400 transition">{m.title} <span className="text-gray-500 font-normal">({m.year})</span></div>
                  <div className="text-xs text-gray-400 mt-0.5">Dir. {m.director.join(', ')} • {m.genres.join(', ')}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.cast.slice(0, 3).join(', ')} • {m.runtime}min • {m.mpaaRating}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm"><Star className="w-3.5 h-3.5 fill-current" />{m.rating}</div>
                  {m.isUnreleased && <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold mt-1 block">UNRELEASED</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not Found */}
      {notFound && !searching && !result && (
        <div className="animate-fadeIn">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-red-950/30 border-b border-red-500/20 px-6 py-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center shrink-0"><XCircle className="w-8 h-8 text-red-400" /></div>
              <div>
                <h3 className="text-xl font-black text-red-400">Movie Not Found</h3>
                <p className="text-sm text-gray-400 mt-0.5">We couldn't locate "<span className="text-white font-semibold">{notFound}</span>" in our database.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-gray-950 rounded-xl p-4 border border-gray-800">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Why couldn't this movie be found?</h4>
                  <ul className="text-xs text-gray-400 space-y-1.5">
                    <li>• The title may be <span className="text-amber-400 font-semibold">misspelled</span> (e.g., "Spider-Man" vs "Spiderman").</li>
                    <li>• It may be a <span className="text-amber-400 font-semibold">very recent or upcoming release</span> not yet in the database.</li>
                    <li>• It could be a <span className="text-amber-400 font-semibold">foreign or independent film</span> with limited coverage.</li>
                    <li>• It may be a <span className="text-amber-400 font-semibold">TV series or documentary</span> not in our movie database.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-950 rounded-xl p-4 border border-gray-800">
                <div className="text-xs text-gray-500">Our database contains <span className="text-white font-bold">70+ movies</span>. Try including the year or director name.</div>
                <button onClick={() => { setNotFound(null); setQuery(''); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">Search Again</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !searching && (
        <div className="space-y-6 animate-fadeIn">
          {/* Unreleased banner */}
          {result.movie.isUnreleased && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-400">Pre-Release Recommendation</h4>
                <p className="text-xs text-gray-400">This movie has not been released yet. The recommendation is based on the creative team's track record, genre, and expected storytelling devices — not audience ratings.</p>
              </div>
            </div>
          )}

          {/* Verdict */}
          <div className={`border rounded-2xl p-6 md:p-8 ${vStyle.bg} border-opacity-50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg`}>
            <div className="space-y-2 md:max-w-2xl">
              <span className={`px-3 py-1 text-xs font-black tracking-widest rounded-full uppercase border border-current bg-gray-950/80 ${vStyle.text}`}>{result.movie.isUnreleased ? 'Pre-Release Estimate' : 'Hybrid Recommendation'}</span>
              <h2 className={`text-3xl md:text-4xl font-black ${vStyle.text} tracking-tight`}>{result.verdict}</h2>
              <p className="text-gray-200 text-sm leading-relaxed">{result.summary}</p>
            </div>
            <div className={`w-28 h-28 rounded-full border-4 bg-gray-950/80 flex flex-col items-center justify-center shadow-xl ${scoreColor(result.matchScore)}`}>
              <span className="text-4xl font-black font-sans">{result.matchScore}%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">{result.movie.isUnreleased ? 'Projected' : 'Taste Match'}</span>
            </div>
          </div>

          {/* Rate & Save */}
          {!result.movie.isUnreleased && (
            <div className={`bg-gray-900 border rounded-2xl p-5 shadow-xl transition-all ${saved ? 'border-green-500/60 bg-green-950/20' : 'border-gray-800'}`}>
              {saved ? (
                <div className="flex items-center justify-center gap-3 py-2"><CheckCircle className="w-6 h-6 text-green-400" /><span className="text-lg font-bold text-green-400">Saved! The CF engine is now learning from your rating.</span></div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Save className="w-5 h-5 text-white" /></div>
                    <div><h4 className="text-sm font-bold text-white">{isSaved ? 'Update Your Rating' : 'Rate & Save'}</h4><p className="text-[10px] text-gray-400">Teach the CF engine your taste.</p></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400 fill-current" /><input type="number" min={1} max={10} value={rating} onChange={e => setRating(parseInt(e.target.value) || 5)} className="w-14 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none" /><span className="text-xs text-gray-500">/10</span></div>
                    <div className="flex gap-1">
                      {([{ v: 'loved', e: '❤️', c: 'border-green-500/60 bg-green-950/40 text-green-400' }, { v: 'liked', e: '👍', c: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400' }, { v: 'neutral', e: '😐', c: 'border-gray-600 bg-gray-800 text-gray-300' }, { v: 'disliked', e: '👎', c: 'border-amber-500/40 bg-amber-950/30 text-amber-400' }, { v: 'hated', e: '🤮', c: 'border-red-500/40 bg-red-950/30 text-red-400' }] as const).map(o => (
                        <button key={o.v} onClick={() => setStatus(o.v)} className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${status === o.v ? o.c : 'border-gray-800 bg-gray-900 text-gray-500'}`}>{o.e}</button>
                      ))}
                    </div>
                    <input value={review} onChange={e => setReview(e.target.value)} placeholder="Quick review..." className="flex-1 min-w-[100px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                    <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shrink-0"><Save className="w-3.5 h-3.5" />{isSaved ? 'Update' : 'Save & Learn'}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Movie Info */}
            <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex gap-4 border-b border-gray-800 pb-4">
                <div className="w-16 h-20 shrink-0 bg-gray-950 rounded-lg flex items-center justify-center text-4xl border border-gray-800">{result.movie.poster}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{result.movie.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold mt-0.5">
                    <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{result.movie.isUnreleased ? (result.movie.releaseDate || result.movie.year) : result.movie.year}</span>
                    <span>•</span><span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{result.movie.runtime}m</span>
                    {result.movie.mpaaRating && <><span>•</span><span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 font-bold text-[10px]">{result.movie.mpaaRating}</span></>}
                    {result.movie.isUnreleased && <><span>•</span><span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 font-bold text-[10px]">UNRELEASED</span></>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">{result.movie.genres.map(g => <span key={g} className="px-2 py-0.5 bg-indigo-950/40 text-indigo-400 text-[10px] font-bold rounded border border-indigo-900/40">{g}</span>)}</div>
                </div>
              </div>
              {!result.movie.isUnreleased && (
                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="bg-gray-950 p-2 rounded-xl border border-gray-800 flex flex-col items-center"><div className="flex items-center gap-0.5 text-yellow-500 font-bold text-sm"><Star className="w-3.5 h-3.5 fill-current" />{result.movie.rating}</div><span className="text-[9px] text-gray-500 font-bold uppercase">IMDb</span></div>
                  <div className="bg-gray-950 p-2 rounded-xl border border-gray-800 flex flex-col items-center"><span className="font-bold text-sm text-red-500">🍅 {result.movie.rottenTomatoes ? `${result.movie.rottenTomatoes}%` : 'N/A'}</span><span className="text-[9px] text-gray-500 font-bold uppercase">RT</span></div>
                  <div className="bg-gray-950 p-2 rounded-xl border border-gray-800 flex flex-col items-center"><span className="text-yellow-400 font-bold text-sm">🎛️ {result.movie.metacritic ? `${result.movie.metacritic}%` : 'N/A'}</span><span className="text-[9px] text-gray-500 font-bold uppercase">Meta</span></div>
                </div>
              )}
              <div><span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Clapperboard className="w-3.5 h-3.5" />Plot</span><p className="text-xs text-gray-300 leading-relaxed bg-gray-950 p-3 rounded-xl border border-gray-800">{result.movie.description}</p></div>
              <div className="space-y-1.5 text-xs border-t border-gray-800/60 pt-3">
                <div className="flex"><span className="w-16 font-bold text-gray-400">Director:</span><span className="text-white">{result.movie.director.join(', ')}</span></div>
                <div className="flex"><span className="w-16 font-bold text-gray-400">Cast:</span><span className="text-white">{result.movie.cast.join(', ')}</span></div>
                {result.movie.boxOffice && <div className="flex"><span className="w-16 font-bold text-gray-400">Box Office:</span><span className="text-gray-300">{result.movie.boxOffice}</span></div>}
                {result.movie.awards && <div className="flex border-t border-gray-800/40 pt-2"><span className="w-16 font-bold text-gray-400 shrink-0"><Award className="w-3 h-3 inline" /></span><span className="text-yellow-500 italic">{result.movie.awards}</span></div>}
              </div>
              <div className="border-t border-gray-800/60 pt-3">
                <span className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Storytelling Devices:</span>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {result.movie.tropes.map(t => {
                    const lo = profile.lovedTropes.includes(t); const di = profile.dislikedTropes.includes(t);
                    let c = 'bg-gray-800 border-gray-700 text-gray-300'; if (lo) c = 'bg-green-950/40 border-green-500/40 text-green-400 font-bold'; if (di) c = 'bg-red-950/40 border-red-500/30 text-red-400 font-bold';
                    return <span key={t} className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${c}`}>{lo && <Check className="w-2.5 h-2.5" />}{di && <XCircle className="w-2.5 h-2.5" />}{t}</span>;
                  })}
                </div>
              </div>
            </div>

            {/* CF Dashboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hybrid Weights */}
              {!result.movie.isUnreleased && result.cfMetrics.finalPrediction > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                  <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-cyan-400" />Hybrid Model Weights</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: 'Content', w: result.cfMetrics.contentWeight, p: result.cfMetrics.contentPrediction, ic: <Sparkles className="w-4 h-4" />, cl: 'text-indigo-400' },
                      { l: 'User-User', w: result.cfMetrics.userUserWeight, p: result.cfMetrics.userUserPrediction, ic: <Users className="w-4 h-4" />, cl: 'text-cyan-400' },
                      { l: 'Item-Item', w: result.cfMetrics.itemItemWeight, p: result.cfMetrics.itemItemPrediction, ic: <Link className="w-4 h-4" />, cl: 'text-emerald-400' },
                      { l: 'Latent', w: result.cfMetrics.latentFactorWeight, p: result.cfMetrics.latentFactorPrediction, ic: <Cpu className="w-4 h-4" />, cl: 'text-purple-400' },
                    ].map(m => (
                      <div key={m.l} className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-center">
                        <div className={`${m.cl} flex justify-center mb-1`}>{m.ic}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{m.l}</div>
                        <div className="text-lg font-black text-white mt-1">{m.p.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-400">/10</div>
                        <div className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300">×{Math.round(m.w * 100)}%</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3 bg-gray-950 rounded-xl p-3 border border-gray-800">
                    <TrendingUp className="w-5 h-5 text-yellow-400" /><span className="text-sm text-gray-400">Hybrid:</span><span className="text-2xl font-black text-white">{result.cfMetrics.finalPrediction.toFixed(1)}</span><span className="text-sm text-gray-500">/10</span>
                  </div>
                </div>
              )}

              {/* Taste Twins */}
              {!result.movie.isUnreleased && result.cfMetrics.tasteTwins.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                  <h4 className="text-md font-bold text-white mb-1 flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" />Taste Twins — User-User CF</h4>
                  <p className="text-xs text-gray-400 mb-4">Pearson correlation found these community members who match your taste.</p>
                  <div className="space-y-3">
                    {result.cfMetrics.tasteTwins.map(t => (
                      <div key={t.userId} className="bg-gray-950 border border-gray-800 rounded-xl p-3 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg shrink-0 border border-gray-700">{t.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between"><div><span className="text-sm font-bold text-white">{t.userName}</span><span className="text-[10px] text-gray-500 ml-2">{t.persona}</span></div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-cyan-950/50 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-800/40">sim: {t.similarity}</span>
                              <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full font-bold">rated: {t.predictedRating}/10</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">{t.sharedMovieCount} shared movies</div>
                          {t.sharedMovies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {t.sharedMovies.map((s, i) => (
                                <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${s.userRating >= 7 ? 'bg-green-950/30 border-green-800/30 text-green-400' : s.userRating >= 5 ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-red-950/30 border-red-800/30 text-red-400'}`}>
                                  {s.title}: You {s.userRating}/Twin {s.twinRating}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Factor Breakdown */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-500" />Factor Breakdown</h4>
                <div className="space-y-4">
                  {result.factorBreakdown.map(f => {
                    const ds = Math.round((f.score + 100) / 2);
                    let cc = 'bg-gray-700', tc = 'text-gray-300';
                    if (f.score >= 50) { cc = 'bg-green-500'; tc = 'text-green-400 font-semibold'; }
                    else if (f.score >= 0) { cc = 'bg-indigo-500'; tc = 'text-indigo-400'; }
                    else if (f.score >= -40) { cc = 'bg-amber-500'; tc = 'text-amber-500'; }
                    else { cc = 'bg-red-500'; tc = 'text-red-400 font-semibold'; }
                    const isCF = f.category.includes('CF') || f.category.includes('Latent');
                    return (
                      <div key={f.category}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className={`font-bold flex items-center gap-1 ${isCF ? 'text-cyan-400' : 'text-white'}`}>{isCF && <Cpu className="w-3 h-3" />}{f.category}</span>
                          <span className="text-gray-500 mr-4">Weight: {f.weight}%</span>
                          <span className={`${tc}`}>{f.score > 0 ? '+' : ''}{Math.round(f.score)} ({ds}%)</span>
                        </div>
                        <div className="h-2.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className={`h-full ${cc} rounded-full transition-all duration-1000`} style={{ width: `${ds}%` }} /></div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{f.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 border-t-2 border-t-green-500/60 shadow-xl">
                  <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2 uppercase"><CheckCircle className="w-4 h-4 fill-green-950" />Why You'll Love It</h4>
                  <ul className="space-y-3">{result.pros.map((p, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-2"><Check className="w-4 h-4 text-green-400 shrink-0 border border-green-500/30 rounded-full bg-green-950/20 p-0.5 mt-0.5" /><span>{p}</span></li>)}</ul>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 border-t-2 border-t-red-500/50 shadow-xl">
                  <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2 uppercase"><XCircle className="w-4 h-4 fill-red-950" />Potential Friction</h4>
                  <ul className="space-y-3">{result.cons.map((c, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-red-400 shrink-0 border border-red-500/30 rounded-full bg-red-950/20 p-0.5 mt-0.5" /><span>{c}</span></li>)}</ul>
                </div>
              </div>

              {/* Vibe Comparison */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                <h4 className="text-md font-bold text-white mb-2 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-indigo-500" />Vibe Comparison</h4>
                <p className="text-xs text-gray-400 mb-4">🎬 Film vs 👤 Your preference</p>
                <div className="space-y-5">
                  {([{ id: 'pacing', l: 'Pacing', a: 'Glacial', b: 'Relentless' }, { id: 'tone', l: 'Tone', a: 'Bleak', b: 'Lighthearted' }, { id: 'complexity', l: 'Complexity', a: 'Brain-Off', b: 'Mind-Bending' }, { id: 'visuals', l: 'Visuals', a: 'Grounded', b: 'Spectacular' }, { id: 'emotion', l: 'Emotion', a: 'Cold', b: 'Tear-Jerker' }] as const).map(attr => {
                    const uv = profile.preferredAttributes[attr.id]; const fv = result.movie.attributes[attr.id]; const d = Math.abs(uv - fv);
                    const up = `${((uv - 1) / 9) * 100}%`; const fp = `${((fv - 1) / 9) * 100}%`;
                    return (
                      <div key={attr.id}>
                        <div className="flex justify-between text-xs mb-1"><span className="font-bold text-white">{attr.l}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d <= 2 ? 'bg-green-950/30 text-green-400 border border-green-500/20' : d <= 4 ? 'bg-indigo-950/20 text-indigo-400' : 'bg-red-950/30 text-red-400 border border-red-500/20'}`}>{d <= 2 ? 'Excellent Fit' : d <= 4 ? 'Moderate' : 'Mismatch'}</span></div>
                        <div className="relative h-6 flex items-center">
                          <div className="w-full h-1.5 bg-gray-800 border border-gray-700 rounded-full" />
                          <div className="absolute h-0.5 bg-indigo-500/50" style={{ left: uv < fv ? up : fp, width: `${(d / 9) * 100}%` }} />
                          <div className="absolute w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center -ml-2.5 z-10" style={{ left: up }} title={`You: ${uv}/10`}><span className="text-[9px] font-bold text-white">👤</span></div>
                          <div className="absolute w-6 h-6 rounded bg-gray-950 border-2 border-emerald-400 shadow-md flex items-center justify-center -ml-3 z-20 rotate-45" style={{ left: fp }} title={`Film: ${fv}/10`}><span className="text-[9px] font-bold text-emerald-400 -rotate-45">🎬</span></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5"><span>{attr.a}</span><span className="font-bold text-gray-400">You: {uv} vs Film: {fv}</span><span>{attr.b}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
