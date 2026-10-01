import React, { useState } from 'react';
import { 
  Edit3, 
  Trash2, 
  User, 
  ArrowUpDown, 
  Plus 
} from 'lucide-react';
import { Publisher, Congregation, Privilege } from '../types';

interface PublishersTableProps {
  publishers: Publisher[];
  congregations: Congregation[];
  privileges: Privilege[];
  onEdit: (publisher: Publisher) => void;
  onDelete: (id: string) => void;
  onNewPublisher: () => void;
}

export const PublishersTable: React.FC<PublishersTableProps> = ({
  publishers,
  congregations,
  privileges,
  onEdit,
  onDelete,
  onNewPublisher
}) => {
  const [sortField, setSortField] = useState<'last_name' | 'first_name' | 'age'>('last_name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const getCongregationName = (id: string) => {
    const cong = congregations.find((c) => c.id === id);
    return cong ? cong.name : '—';
  };

  const getPrivilegeBadge = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const priv = privileges.find((p) => p.code.toUpperCase() === cleanCode);
    const color = priv ? priv.color : '#475569';
    const label = priv ? priv.label : cleanCode;

    return (
      <span
        key={cleanCode}
        style={{
          borderColor: `${color}35`,
          backgroundColor: `${color}12`,
          color: color
        }}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-2xs"
        title={label}
      >
        <span>{cleanCode}</span>
        {priv && <span className="font-normal text-[11px] opacity-80 hidden xl:inline">({priv.label})</span>}
      </span>
    );
  };

  const handleSort = (field: 'last_name' | 'first_name' | 'age') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedPublishers = [...publishers].sort((a, b) => {
    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  if (publishers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <User className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Nessun proclamatore trovato
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
          Nessun proclamatore corrisponde ai filtri selezionati o non ne sono ancora stati inseriti.
        </p>
        <button
          onClick={onNewPublisher}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Nuova Persona
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table header bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Elenco Proclamatori
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            {publishers.length} {publishers.length === 1 ? 'persona' : 'persone'}
          </span>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Fai clic sulle intestazioni per ordinare
        </div>
      </div>

      {/* Desktop / Tablet Table View (No Initials Avatar, No Gruppo, No Contatti, Privilegio) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th 
                className="py-3 px-5 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('last_name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Cognome e Nome</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Congregazione</th>
              <th className="py-3 px-4">Privilegio</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Età</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Note</th>
              <th className="py-3 px-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedPublishers.map((pub) => {
              const privilegeList = pub.privilege_codes 
                ? pub.privilege_codes.split(',').map((c) => c.trim()).filter(Boolean)
                : [];

              return (
                <tr key={pub.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* Name: Clean and directly visible without initials avatar */}
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 text-sm">
                      {pub.last_name} {pub.first_name}
                    </div>
                    {pub.gender && (
                      <div className="text-[11px] text-slate-400">
                        {pub.gender === 'M' ? 'Fratello' : 'Sorella'}
                      </div>
                    )}
                  </td>

                  {/* Congregation */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {getCongregationName(pub.congregation_id)}
                    </span>
                  </td>

                  {/* Privilegio */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {privilegeList.length > 0 ? (
                        privilegeList.map((code) => getPrivilegeBadge(code))
                      ) : (
                        <span className="text-xs text-slate-300 italic">—</span>
                      )}
                    </div>
                  </td>

                  {/* Age */}
                  <td className="py-3.5 px-4">
                    {pub.age ? (
                      <span className="text-xs font-semibold text-slate-700">
                        {pub.age} <span className="text-[11px] text-slate-400 font-normal">anni</span>
                      </span>
                    ) : pub.birth_date ? (
                      <span className="text-xs text-slate-500">{pub.birth_date}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    {pub.notes ? (
                      <p className="text-xs text-slate-600 truncate" title={pub.notes}>
                        {pub.notes}
                      </p>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(pub);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Modifica proclamatore"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Sei sicuro di voler eliminare ${pub.first_name} ${pub.last_name}?`)) {
                            onDelete(pub.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Elimina proclamatore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Optimized for Smartphones: clean name without initials avatar) */}
      <div className="md:hidden divide-y divide-slate-100 p-2">
        {sortedPublishers.map((pub) => {
          const privilegeList = pub.privilege_codes 
            ? pub.privilege_codes.split(',').map((c) => c.trim()).filter(Boolean)
            : [];

          return (
            <div key={pub.id} className="p-4 space-y-2.5 bg-white mb-2 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-base leading-tight">
                    {pub.last_name} {pub.first_name}
                  </h4>
                  {pub.gender && (
                    <div className="text-[11px] text-slate-400 mb-1">
                      {pub.gender === 'M' ? 'Fratello' : 'Sorella'}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                    <span className="font-medium text-slate-700">{getCongregationName(pub.congregation_id)}</span>
                    {pub.age ? <span>{pub.age} anni</span> : null}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-slate-50 rounded-lg p-0.5 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(pub); }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md shadow-xs transition-colors"
                    title="Modifica"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Eliminare ${pub.first_name} ${pub.last_name}?`)) {
                        onDelete(pub.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md shadow-xs transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Privileges */}
              {privilegeList.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {privilegeList.map((code) => getPrivilegeBadge(code))}
                </div>
              )}

              {/* Notes */}
              {pub.notes && (
                <div className="mt-2 pt-2 border-t border-slate-50">
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic line-clamp-3">
                    {pub.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
