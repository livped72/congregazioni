import React, { useState } from 'react';
import { 
  Building2, 
  Upload, 
  UserPlus, 
  Printer, 
  Download, 
  Database, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  Tag, 
  Menu, 
  X,
  RefreshCw,
  CheckCircle2,
  Cloud
} from 'lucide-react';
import { DbStatus } from '../types';

interface HeaderProps {
  username: string;
  dbStatus: DbStatus;
  onOpenNewPublisher: () => void;
  onOpenNewCongregation: () => void;
  onOpenCsvImport: () => void;
  onExportCsv: () => void;
  onOpenPdfExport: () => void;
  onOpenPrivilegesManager: () => void;
  onOpenNeonModal: () => void;
  onOpenSecurityModal: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  username,
  dbStatus,
  onOpenNewPublisher,
  onOpenNewCongregation,
  onOpenCsvImport,
  onExportCsv,
  onOpenPdfExport,
  onOpenPrivilegesManager,
  onOpenNeonModal,
  onOpenSecurityModal,
  onLogout,
  onRefresh,
  isRefreshing
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Title & Sync Status (No Logo) */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-none">
                  Congregazioni
                </h1>

                {/* Cloud Sync Status Badge */}
                <button
                  onClick={onOpenNeonModal}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    dbStatus.connectedToNeon 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/70' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100/70'
                  }`}
                  title="Stato sincronizzazione database"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connectedToNeon ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="hidden sm:inline">
                    {dbStatus.connectedToNeon ? 'Neon Cloud Sincronizzato' : 'DB Locale (Sincronizza)'}
                  </span>
                  <span className="sm:hidden">
                    {dbStatus.connectedToNeon ? 'Neon' : 'Locale'}
                  </span>
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                Gestione persone, incarichi e note per congregazione
              </p>
            </div>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Aggiorna dati"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Print / PDF */}
            <button
              onClick={onOpenPdfExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Stampa / PDF
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Esporta CSV
            </button>

            {/* Import CSV */}
            <button
              onClick={onOpenCsvImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Importa CSV
            </button>

            {/* Nuova Congregazione */}
            <button
              onClick={onOpenNewCongregation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              + Congregazione
            </button>

            {/* Nuova Persona - Black Button */}
            <button
              onClick={onOpenNewPublisher}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs cursor-pointer active:scale-98 ml-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nuova Persona
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 mx-1.5" />

            {/* Action icons */}
            <div className="flex items-center gap-0.5">
              {/* Sigle Privilegi */}
              <button
                onClick={onOpenPrivilegesManager}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-colors cursor-pointer"
                title="Gestisci Sigle Privilegi (PR, A, SM, ecc.)"
              >
                <Tag className="w-4 h-4" />
              </button>

              {/* Neon DB Sync */}
              <button
                onClick={onOpenNeonModal}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/80 rounded-lg transition-colors cursor-pointer"
                title="Sincronizzazione Neon PostgreSQL"
              >
                <Database className="w-4 h-4" />
              </button>

              {/* Sicurezza Account */}
              <button
                onClick={onOpenSecurityModal}
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50/80 rounded-lg transition-colors cursor-pointer"
                title={`Account: ${username} (Cambia password)`}
              >
                <KeyRound className="w-4 h-4" />
              </button>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
                title="Disconnetti"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Right Bar: New Person button + Menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenNewPublisher}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Persona
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <span className="font-medium text-slate-500">Utente: <strong className="text-slate-800">{username}</strong></span>
            <button
              onClick={() => { onOpenNeonModal(); setMobileMenuOpen(false); }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                dbStatus.connectedToNeon ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Database className="w-3 h-3" />
              {dbStatus.connectedToNeon ? 'Neon Connesso' : 'DB Locale'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onOpenNewCongregation(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg border border-slate-200"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              + Congregazione
            </button>
            <button
              onClick={() => { onOpenCsvImport(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg border border-slate-200"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              Importa CSV
            </button>
            <button
              onClick={() => { onExportCsv(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Esporta CSV
            </button>
            <button
              onClick={() => { onOpenPdfExport(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Stampa / PDF
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs">
            <button
              onClick={() => { onOpenPrivilegesManager(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Tag className="w-4 h-4 text-blue-600" />
              Gestisci Sigle Privilegi (PR, A, SM, ecc.)
            </button>
            <button
              onClick={() => { onOpenNeonModal(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              Database Neon PostgreSQL (Sincronizzazione)
            </button>
            <button
              onClick={() => { onOpenSecurityModal(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Sicurezza & Cambio Password
            </button>
            <button
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Disconnetti
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
