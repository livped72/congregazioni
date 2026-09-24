import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Smartphone, Laptop, Tablet } from 'lucide-react';
import { DbStatus } from '../types';

interface NeonSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatus;
  onConnectNeon: (connectionString: string) => Promise<void>;
}

export const NeonSettingsModal: React.FC<NeonSettingsModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onConnectNeon
}) => {
  const [connectionString, setConnectionString] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionString.trim()) {
      setError('Inserisci la stringa di connessione PostgreSQL.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setSuccess(null);
      await onConnectNeon(connectionString.trim());
      setSuccess('Connessione a Neon PostgreSQL completata! I dati sono ora sincronizzati su cloud.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Impossibile connettersi al database Neon. Verifica le credenziali.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Sincronizzazione Neon PostgreSQL
            </h3>
            <p className="text-xs text-slate-500">
              Sincronizza in tempo reale su PC, smartphone e tablet (Senza Firestore)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Current Status Box */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            dbStatus.connectedToNeon 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {dbStatus.connectedToNeon ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-bold">
                {dbStatus.provider}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                {dbStatus.connectedToNeon
                  ? 'Il tuo database è sincronizzato su Neon Cloud. Tutte le modifiche sono accessibili da qualunque tuo dispositivo.'
                  : 'Stai usando il database locale. Per sincronizzare smartphone, tablet e PC, inserisci la tua stringa Neon gratuita qui sotto.'}
              </p>
              {dbStatus.neonUrl && (
                <code className="inline-block mt-2 px-2 py-1 bg-black/10 rounded text-[11px] font-mono">
                  {dbStatus.neonUrl}
                </code>
              )}
            </div>
          </div>

          {/* Multi-Device Graphic Banner */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Accesso multi-dispositivo unificato
            </p>
            <div className="flex items-center justify-around py-2 text-slate-600">
              <div className="flex flex-col items-center gap-1">
                <Laptop className="w-6 h-6 text-slate-800" />
                <span className="text-[11px] font-semibold">Computer</span>
              </div>
              <span className="text-slate-300 font-bold">⟷</span>
              <div className="flex flex-col items-center gap-1">
                <Tablet className="w-6 h-6 text-slate-800" />
                <span className="text-[11px] font-semibold">Tablet</span>
              </div>
              <span className="text-slate-300 font-bold">⟷</span>
              <div className="flex flex-col items-center gap-1">
                <Smartphone className="w-6 h-6 text-slate-800" />
                <span className="text-[11px] font-semibold">Smartphone</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stringa di connessione Neon PostgreSQL *
              </label>
              <textarea
                rows={3}
                required
                placeholder="postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-700">Come ottenere il tuo database gratuito su Neon:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>
                  Apri{' '}
                  <a
                    href="https://neon.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    neon.tech <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  e crea un account gratuito.
                </li>
                <li>Crea un nuovo progetto (es. "Congregazioni").</li>
                <li>Copia la riga <strong>Connection string</strong>.</li>
                <li>Incollala qui sopra e premi <strong>Verifica e Sincronizza</strong>.</li>
              </ol>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Chiudi
              </button>
              <button
                type="submit"
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                {isConnecting ? 'Connessione...' : 'Verifica e Sincronizza'}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
