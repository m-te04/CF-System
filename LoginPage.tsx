import React, { useState } from 'react';
import { User } from '../types';
import { signIn } from '../utils/auth';
import { Clapperboard, LogIn, AlertCircle, UserPlus } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onSwitchToSignUp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignUp }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 600));

    const result = signIn(usernameOrEmail, password);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 mb-4">
            <Clapperboard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your CineTaste account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Username or Email</label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              placeholder="Enter your username or email"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition shadow-md border border-indigo-500/30 text-sm"
          >
            {isLoading ? (
              <><LogIn className="w-4 h-4 animate-pulse" /> Signing In...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        {/* Switch to Sign Up */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignUp} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
              <span className="flex items-center gap-1 inline-flex">
                <UserPlus className="w-3.5 h-3.5" />
                Create one here
              </span>
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-6 bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">First time?</p>
          <p className="text-xs text-gray-400">Create a new account to set up your taste profile and start getting personalized movie recommendations.</p>
        </div>
      </div>
    </div>
  );
};
