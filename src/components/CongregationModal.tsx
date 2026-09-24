import React, { useState, useEffect } from 'react';
import { X, Save, Building, MapPin, FileText } from 'lucide-react';
import { Congregation } from '../types';

interface CongregationModalProps {
  isOpen: boolean;
  onClose: () => void;
  congregation: Congregation | null;
  onSave: (cong: Partial<Congregation>) => Promise<void>;
}

export const CongregationModal: React.FC<CongregationModalProps> = ({
  isOpen,
  onClose,
  congregation,
  onSave
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (congregation) {
      setName(congregation.name || '');
      setCity(congregation.city || '');
      setAddress(congregation.address || '');
      setNotes(congregation.notes || '');
    } else {
      setName('');
      setCity('');
      setAddress('');
      setNotes('');
    }
    setError(null);
  }, [congregation, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Il nome della congregazione è obbligatorio.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        id: congregation?.id,
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {congregation ? 'Modifica Congregazione' : 'Nuova Congregazione'}
              </h3>
              <p className="text-xs text-slate-500">
                Definisci il nome e i dettagli della congregazione
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome Congregazione *
            </label>
            <input
              type="text"
              required
              placeholder="es. Milano Sud, Roma Nord, Napoli Centro..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Città
              </label>
              <input
                type="text"
                placeholder="es. Milano"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Indirizzo Sala
              </label>
              <input
                type="text"
                placeholder="es. Via Roma 12"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Note (Orari Adunanze, Informazioni)
            </label>
            <textarea
              rows={3}
              placeholder="es. Adunanza infrasettimanale Giovedì ore 20:00, Fine settimana Domenica ore 10:00"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvataggio...' : 'Salva Congregazione'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
