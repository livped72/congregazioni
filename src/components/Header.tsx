import React, { useRef, useState } from 'react';
import { 
  Building2, 
  Upload, 
  UserPlus, 
  Printer, 
  Download, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  Tag, 
  Menu, 
  X,
  HardDrive,
  FolderInput
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
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  username,
  onOpenNewPublisher,
  onOpenNewCongregation,
  onOpenCsvImport,
  onExportCsv,
  onOpenPdfExport,
  onOpenPrivilegesManager,
  onOpenSecurityModal,
  onLogout,
  onExportBackup,
  onImportBackup,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingBackup(true);
    try {
      await onImportBackup(file);
      alert('Backup ripristinato con successo!');
    } catch (err: any) {
      alert(`Errore ripristino: ${err.message}`);
    } finally {
      setImportingBackup(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Title */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-none">
                  Congregazioni
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Locale
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                Dati salvati nel browser · Usa Backup per trasferire
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">

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

            {/* Backup & Restore separator */}
            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Backup scaricabile */}
            <button
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-all shadow-2xs cursor-pointer"
              title="Scarica backup completo (JSON)"
            >
              <HardDrive className="w-3.5 h-3.5" />
              Backup
            </button>

            {/* Ripristina backup */}
            <label
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all shadow-2xs cursor-pointer"
              title="Ripristina da backup JSON"
            >
              <FolderInput className="w-3.5 h-3.5" />
              {importingBackup ? 'Ripristino...' : 'Ripristina'}
              <input ref={backupInputRef} type="file" accept=".json" className="hidden" onChange={handleBackupFile} />
            </label>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Nuova Congregazione */}
            <button
              onClick={onOpenNewCongregation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              + Congregazione
            </button>

            {/* Nuova Persona */}
            <button
              onClick={onOpenNewPublisher}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs cursor-pointer ml-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nuova Persona
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5">
              <button
                onClick={onOpenPrivilegesManager}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-colors cursor-pointer"
                title="Gestisci Sigle Privilegi"
              >
                <Tag className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSecurityModal}
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50/80 rounded-lg transition-colors cursor-pointer"
                title={`Account: ${username}`}
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
                title="Disconnetti"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Right Bar */}
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <span className="font-medium text-slate-500">Utente: <strong className="text-slate-800">{username}</strong></span>
            <span className="text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Dati locali
            </span>
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
            <button
              onClick={() => { onExportBackup(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200"
            >
              <HardDrive className="w-4 h-4" />
              Backup JSON
            </button>
            <label
              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
            >
              <FolderInput className="w-4 h-4" />
              Ripristina
              <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try { await onImportBackup(file); alert('Backup ripristinato!'); setMobileMenuOpen(false); } catch (err: any) { alert(err.message); }
              }} />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs">
            <button
              onClick={() => { onOpenPrivilegesManager(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Tag className="w-4 h-4 text-blue-600" />
              Gestisci Sigle Privilegi
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
