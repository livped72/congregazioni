import React, { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle, Database } from 'lucide-react';
import { DbStatus } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (token: string, username: string) => void;
  onLogin: (username: string, pass: string) => Promise<{ token: string; username: string }>;
  dbStatus: DbStatus;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLogin, dbStatus }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Inserisci sia username che password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await onLogin(username.trim(), password);
      onLoginSuccess(res.token, res.username);
    } catch (err: any) {
      setError(err.message || 'Username o password errati.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Title without logo */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Congregazioni
          </h1>
          <p className="text-xs text-slate-500">
            Accedi al tuo portale privato e sincronizzato
          </p>
        </div>

        {/* Database Status indicator */}
        <div className="flex items-center justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            dbStatus.connectedToNeon 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            <Database className="w-3.5 h-3.5" />
            {dbStatus.connectedToNeon ? 'Sincronizzato con Neon Cloud' : 'Accesso Locale'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Il tuo username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors"
          >
            <span>{isSubmitting ? 'Verifica in corso...' : 'Accedi all\'App'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          Accesso riservato e protetto con crittografia privata.
        </p>

      </div>
    </div>
  );
};
