import React from 'react';
import { Search, Filter, X, Tag } from 'lucide-react';
import { Privilege, Congregation } from '../types';

interface PrivilegeFilterProps {
  privileges: Privilege[];
  selectedPrivilege: string | null;
  onSelectPrivilege: (code: string | null) => void;
  selectedGender: string | null;
  onSelectGender: (g: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCongregationId: string | null;
  onSelectCongregation: (id: string | null) => void;
  congregations: Congregation[];
  privilegeCounts: Record<string, number>;
  totalPublishersCount: number;
  onOpenPrivilegesManager: () => void;
}

export const PrivilegeFilter: React.FC<PrivilegeFilterProps> = ({
  privileges,
  selectedPrivilege,
  onSelectPrivilege,
  selectedGender,
  onSelectGender,
  searchQuery,
  onSearchChange,
  selectedCongregationId,
  onSelectCongregation,
  congregations,
  privilegeCounts,
  totalPublishersCount,
  onOpenPrivilegesManager
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      {/* Top Bar: Clean Search + Congregation Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca proclamatore per cognome, nome o note..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Congregation Selector */}
        <div className="sm:w-64">
          <select
            value={selectedCongregationId || ''}
            onChange={(e) => onSelectCongregation(e.target.value || null)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">Tutte le congregazioni</option>
            {congregations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Privilege Filter Row: Orderly and refined */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtra per Privilegio</span>
          </div>

          <button
            onClick={onOpenPrivilegesManager}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Gestisci Sigle</span>
          </button>
        </div>

        {/* Privilege chips grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tutti */}
          <button
            onClick={() => onSelectPrivilege(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              selectedPrivilege === null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <span>Tutti</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedPrivilege === null ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalPublishersCount}
            </span>
          </button>

          {/* Individual privileges */}
          {privileges.map((p) => {
            const isSelected = selectedPrivilege === p.code;
            const count = privilegeCounts[p.code] || 0;

            return (
              <button
                key={p.id}
                onClick={() => onSelectPrivilege(isSelected ? null : p.code)}
                style={{
                  borderColor: isSelected ? p.color : undefined,
                  backgroundColor: isSelected ? `${p.color}15` : undefined,
                  color: isSelected ? p.color : undefined
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-1 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-bold">{p.code}</span>
                <span className="text-slate-400 font-normal hidden lg:inline">
                  • {p.label}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/80' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Gender Filter */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mostra:</span>
        <div className="flex gap-2">
          <button
            onClick={() => onSelectGender(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedGender === null
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tutti
          </button>
          <button
            onClick={() => onSelectGender('M')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedGender === 'M'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fratelli
          </button>
          <button
            onClick={() => onSelectGender('F')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedGender === 'F'
                ? 'bg-pink-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sorelle
          </button>
        </div>
      </div>
    </div>
  );
};
