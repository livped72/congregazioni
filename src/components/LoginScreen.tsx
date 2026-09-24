import React, { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle, Database, KeyRound, CheckCircle2 } from 'lucide-react';
import { DbStatus } from '../types';
import { api } from '../api';

interface LoginScreenProps {
  onLoginSuccess: (token: string, username: string) => void;
  onLogin: (username: string, pass: string) => Promise<{ token: string; username: string }>;
  dbStatus: DbStatus;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLogin, dbStatus }) => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  
  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  
  // Reset form state
  const [resetUsername, setResetUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername.trim()) {
      setError('Inserisci il tuo username.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError('La nuova password deve contenere almeno 4 caratteri.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      const res = await api.resetPassword(resetUsername.trim(), newPassword);
      setSuccess('Password aggiornata con successo! Accesso in corso...');
      setTimeout(() => {
        onLoginSuccess(res.token, res.username);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Errore nella modifica della password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Congregazioni
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login' 
              ? 'Accedi al tuo portale privato e sincronizzato' 
              : 'Modifica o reimposta la tua password personale'}
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

        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setMode('reset'); setError(null); setSuccess(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'reset'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Modifica Password
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {mode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(null); setSuccess(null); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  Modifica password?
                </button>
              </div>
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
        ) : (
          /* RESET / MODIFY PASSWORD FORM */
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              💡 <strong>Reimposta Password:</strong> Inserisci il tuo username e specifica la nuova password desiderata per aggiornare subito l'accesso.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username Account
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="es. admin"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nuova Password (minimo 4 caratteri)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nuova password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Conferma Nuova Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti nuova password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors"
            >
              <span>{isSubmitting ? 'Salvataggio...' : 'Salva Nuova Password e Accedi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Accesso privato e riservato</span>
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
            >
              Torna al login
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
