import React from 'react';
import { Users, ChevronRight, Plus, MapPin, Edit3, Trash2 } from 'lucide-react';
import { Congregation, Privilege } from '../types';

interface CongregationCardsProps {
  congregations: Congregation[];
  selectedCongregationId: string | null;
  onSelectCongregation: (id: string | null) => void;
  onEditCongregation: (cong: Congregation) => void;
  onDeleteCongregation: (id: string) => void;
  onNewCongregation: () => void;
  privileges: Privilege[];
}

export const CongregationCards: React.FC<CongregationCardsProps> = ({
  congregations,
  selectedCongregationId,
  onSelectCongregation,
  onEditCongregation,
  onDeleteCongregation,
  onNewCongregation,
  privileges
}) => {
  const getPrivilegeLabel = (code: string) => {
    const priv = privileges.find((p) => p.code.toUpperCase() === code.toUpperCase());
    return priv ? priv.label : code;
  };

  const getPrivilegeStyle = (code: string) => {
    switch (code.toUpperCase()) {
      case 'A':
        return 'bg-amber-50 text-amber-800 border-amber-200/60';
      case 'SM':
        return 'bg-blue-50 text-blue-800 border-blue-200/60';
      case 'PR':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
      case 'A-PR':
        return 'bg-teal-50 text-teal-800 border-teal-200/60';
      case 'SM-PR':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/60';
      case 'PA':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200/60';
      case 'SG':
        return 'bg-purple-50 text-purple-800 border-purple-200/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight font-heading">
            Congregazioni
          </h2>
          {selectedCongregationId && (
            <button
              onClick={() => onSelectCongregation(null)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
            >
              Mostra tutte ({congregations.length})
            </button>
          )}
        </div>

        <button
          onClick={onNewCongregation}
          className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Aggiungi congregazione
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {congregations.map((cong) => {
          const isSelected = selectedCongregationId === cong.id;
          const pubCount = cong.publishersCount ?? 0;
          const privCounts = cong.privilegeCounts || {};
          const activePrivileges = Object.entries(privCounts).filter(([_, count]) => count > 0);

          return (
            <div
              key={cong.id}
              onClick={() => onSelectCongregation(isSelected ? null : cong.id)}
              className={`group bg-white rounded-2xl border p-4.5 transition-all cursor-pointer relative shadow-xs hover:shadow-sm ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Header row: Icon, Name & count, Chevron */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-200 transition-colors">
                    <Users className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors leading-tight">
                      {cong.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pubCount} {pubCount === 1 ? 'persona' : 'persone'}
                      {cong.city ? ` • ${cong.city}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Actions visible on hover/card */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCongregation(cong);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Modifica congregazione"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Sei sicuro di voler eliminare la congregazione "${cong.name}" e tutti i suoi proclamatori?`)) {
                        onDeleteCongregation(cong.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Elimina congregazione"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-transform ${isSelected ? 'rotate-90 text-blue-600' : ''}`} />
                </div>
              </div>

              {/* Bottom Privilege Badges - exactly as seen in reference image */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                {activePrivileges.length > 0 ? (
                  activePrivileges.map(([code, count]) => (
                    <span
                      key={code}
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getPrivilegeStyle(code)}`}
                    >
                      {count} {getPrivilegeLabel(code)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Nessun incarico registrato
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
