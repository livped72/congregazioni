import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Phone, Mail, MapPin, Tag, Building } from 'lucide-react';
import { Publisher, Congregation, Privilege } from '../types';

interface PublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisher: Publisher | null;
  congregations: Congregation[];
  privileges: Privilege[];
  defaultCongregationId?: string | null;
  onSave: (pub: Partial<Publisher>) => Promise<void>;
  onOpenPrivilegesManager: () => void;
}

export const PublisherModal: React.FC<PublisherModalProps> = ({
  isOpen,
  onClose,
  publisher,
  congregations,
  privileges,
  defaultCongregationId,
  onSave,
  onOpenPrivilegesManager
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [congregationId, setCongregationId] = useState('');
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publisher) {
      setFirstName(publisher.first_name || '');
      setLastName(publisher.last_name || '');
      setCongregationId(publisher.congregation_id || (congregations[0]?.id || ''));
      setSelectedPrivileges(
        publisher.privilege_codes 
          ? publisher.privilege_codes.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
          : []
      );
      setBirthDate(publisher.birth_date || '');
      setAge(publisher.age !== undefined && publisher.age !== null ? String(publisher.age) : '');
      setGender((publisher.gender as 'M' | 'F') || 'M');
      setPhone(publisher.phone || '');
      setEmail(publisher.email || '');
      setAddress(publisher.address || '');
      setIsActive(publisher.is_active !== false);
      setNotes(publisher.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setCongregationId(defaultCongregationId || (congregations[0]?.id || ''));
      setSelectedPrivileges([]);
      setBirthDate('');
      setAge('');
      setGender('M');
      setPhone('');
      setEmail('');
      setAddress('');
      setIsActive(true);
      setNotes('');
    }
    setError(null);
  }, [publisher, isOpen, congregations, defaultCongregationId]);

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const birth = new Date(val);
      if (!isNaN(birth.getTime())) {
        const diff = Date.now() - birth.getTime();
        const calculatedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        if (calculatedAge >= 0 && calculatedAge < 130) {
          setAge(String(calculatedAge));
        }
      }
    }
  };

  const togglePrivilege = (code: string) => {
    const clean = code.toUpperCase();
    if (selectedPrivileges.includes(clean)) {
      setSelectedPrivileges(selectedPrivileges.filter((c) => c !== clean));
    } else {
      setSelectedPrivileges([...selectedPrivileges, clean]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Nome e Cognome sono obbligatori.');
      return;
    }
    if (!congregationId) {
      setError('Seleziona una congregazione.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        id: publisher?.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        congregation_id: congregationId,
        privilege_codes: selectedPrivileges.join(','),
        birth_date: birthDate,
        age: age ? parseInt(age) : null,
        gender,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        is_active: isActive,
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
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header (No logo) */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {publisher ? 'Modifica Persona' : 'Nuova Persona'}
            </h3>
            <p className="text-xs text-slate-500">
              Inserisci o modifica i dettagli del proclamatore e il privilegio
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Name and Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cognome *
              </label>
              <input
                type="text"
                required
                placeholder="es. Rossi"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome *
              </label>
              <input
                type="text"
                required
                placeholder="es. Marco"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Congregation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Congregazione *
            </label>
            <select
              value={congregationId}
              onChange={(e) => setCongregationId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              {congregations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.city ? `(${c.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* PRIVILEGIO TOGGLE PILLS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Privilegio (PR, A, SM, A-PR, SM-PR, ecc.)
              </label>
              <button
                type="button"
                onClick={onOpenPrivilegesManager}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                + Aggiungi altre sigle
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50/80 border border-slate-200 rounded-2xl">
              {privileges.map((p) => {
                const isSelected = selectedPrivileges.includes(p.code.toUpperCase());
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePrivilege(p.code)}
                    style={{
                      borderColor: isSelected ? p.color : undefined,
                      backgroundColor: isSelected ? p.color : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155'
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                      isSelected ? 'ring-2 ring-offset-1' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{p.code}</span>
                    <span className="font-normal opacity-90 ml-1.5">
                      ({p.label})
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Fai clic per selezionare o deselezionare il privilegio desiderato.
            </p>
          </div>

          {/* Birth Date, Age, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Data di Nascita
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Età (anni)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                placeholder="es. 40"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Genere
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    gender === 'M' 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Fratello
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    gender === 'F' 
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Sorella
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Note
            </label>
            <textarea
              rows={2}
              placeholder="es. Incaricato pulizie, reparto audio, altre note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvataggio...' : 'Salva Proclamatore'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
