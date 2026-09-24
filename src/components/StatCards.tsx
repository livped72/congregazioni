import React from 'react';
import { Users, Building, Calendar } from 'lucide-react';
import { Stats } from '../types';

interface StatCardsProps {
  stats: Stats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
      {/* Persone Totali */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
          <Users className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-0.5">
            Persone totali
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            {stats.totalPersons}
          </p>
        </div>
      </div>

      {/* Congregazioni */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
          <Building className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-0.5">
            Congregazioni
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            {stats.totalCongregations}
          </p>
        </div>
      </div>

      {/* Età media */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
          <Calendar className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-0.5">
            Età media
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            {stats.averageAge > 0 ? stats.averageAge : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};
