import React, { useState } from 'react';
import { X, Plus, Tag, Trash2, AlertCircle } from 'lucide-react';
import { Privilege } from '../types';

interface PrivilegesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  privileges: Privilege[];
  onSavePrivilege: (priv: Partial<Privilege>) => Promise<void>;
  onDeletePrivilege: (code: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#0d9488', // Teal
  '#4f46e5', // Indigo
  '#0891b2', // Cyan
  '#e11d48', // Rose
  '#475569'  // Slate
];

export const PrivilegesManagerModal: React.FC<PrivilegesManagerModalProps> = ({
  isOpen,
  onClose,
  privileges,
  onSavePrivilege,
  onDeletePrivilege
}) => {
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#2563eb');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode || !newLabel.trim()) {
      setError('Sigla e Descrizione sono obbligatorie.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSavePrivilege({
        code: cleanCode,
        label: newLabel.trim(),
        color: newColor,
        is_default: false
      });
      setNewCode('');
      setNewLabel('');
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Gestione Sigle Privilegi
            </h3>
            <p className="text-xs text-slate-500">
              Visualizza o aggiungi sigle personalizzate (es. PR, A, SM, A-PR, SM-PR)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form to add a new custom privilege */}
          <form onSubmit={handleAdd} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Aggiungi Nuova Sigla Personalizzata
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Sigla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. USC"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs uppercase font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Descrizione Privilegio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Usciere / Reparto Audio"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Colore Badge
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      newColor === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSaving ? 'Salvataggio...' : 'Crea Sigla Privilegio'}
            </button>
          </form>

          {/* Current Privileges List */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Sigle Configurate ({privileges.length})
            </div>

            <div className="space-y-1.5">
              {privileges.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{ backgroundColor: p.color }}
                      className="w-3 h-3 rounded-full shrink-0"
                    />
                    <span className="font-bold text-sm text-slate-900">
                      {p.code}
                    </span>
                    <span className="text-xs text-slate-600">
                      {p.label}
                    </span>
                    {p.is_default && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Standard
                      </span>
                    )}
                  </div>

                  {!p.is_default && (
                    <button
                      onClick={() => {
                        if (confirm(`Rimuovere la sigla "${p.code}"?`)) {
                          onDeletePrivilege(p.code);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Elimina sigla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
