import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Congregation, Publisher, Privilege, Stats } from './types';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { CongregationCards } from './components/CongregationCards';
import { PrivilegeFilter } from './components/PrivilegeFilter';
import { PublishersTable } from './components/PublishersTable';
import { PublisherModal } from './components/PublisherModal';
import { CongregationModal } from './components/CongregationModal';
import { CsvImportModal } from './components/CsvImportModal';
import { PdfExportModal } from './components/PdfExportModal';
import { PrivilegesManagerModal } from './components/PrivilegesManagerModal';
import { SecurityModal } from './components/SecurityModal';
import { Loader2 } from 'lucide-react';
import {
  authService,
  getCongregations,
  saveCongregation,
  deleteCongregation,
  getPublishers,
  savePublisher,
  deletePublisher,
  bulkSavePublishers,
  getPrivileges,
  savePrivilege,
  deletePrivilege,
  exportBackup,
  importBackup,
} from './db';

// ─── Auth session (in-memory only, not localStorage token) ─────────────────
let sessionUser: string | null = null;

function setSession(username: string) { sessionUser = username; }
function clearSession() { sessionUser = null; }

// ─── Login Screen ────────────────────────────────────────────────────────────
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await authService.login(username, password);
    if (ok) {
      setSession(username);
      onLogin();
    } else {
      setError('Username o password non corretti.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-sm border border-white/20">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Congregazioni</h1>
          <p className="text-slate-400 text-sm mt-1">Accedi al tuo account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
              autoComplete="username"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Setup Screen ────────────────────────────────────────────────────────────
const SetupScreen: React.FC<{ onSetup: () => void }> = ({ onSetup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) { setError('Le password non coincidono.'); return; }
    if (password.length < 4) { setError('La password deve avere almeno 4 caratteri.'); return; }
    setLoading(true);
    await authService.setup(username.trim(), password);
    setSession(username.trim());
    onSetup();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-sm border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Prima configurazione</h1>
          <p className="text-slate-400 text-sm mt-1">Crea le credenziali di accesso</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Conferma password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
          />
          {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Creazione...' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  const [authState, setAuthState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading');
  const [currentUsername, setCurrentUsername] = useState('');

  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);

  const [selectedCongregationId, setSelectedCongregationId] = useState<string | null>(null);
  const [selectedPrivilege, setSelectedPrivilege] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [publisherModalOpen, setPublisherModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [congregationModalOpen, setCongregationModalOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState<Congregation | null>(null);
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);
  const [privilegesModalOpen, setPrivilegesModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // ── Boot: check if auth is configured ──
  useEffect(() => {
    if (authService.isInitialized()) {
      setAuthState('login');
    } else {
      setAuthState('setup');
    }
  }, []);

  // ── Load data from localStorage ──
  const loadData = useCallback(() => {
    setCongregations(getCongregations());
    setPublishers(getPublishers());
    setPrivileges(getPrivileges());
  }, []);

  useEffect(() => {
    if (authState === 'app') {
      loadData();
    }
  }, [authState, loadData]);

  const handleSetup = () => {
    setCurrentUsername(authService.getUsername());
    setAuthState('app');
  };

  const handleLogin = () => {
    setCurrentUsername(authService.getUsername());
    setAuthState('app');
  };

  const handleLogout = () => {
    clearSession();
    setAuthState('login');
  };

  const handleChangeCredentials = async (currentPassword?: string, newUsername?: string, newPassword?: string) => {
    if (currentPassword) {
      const ok = await authService.verifyPassword(currentPassword);
      if (!ok) throw new Error('Password attuale non corretta.');
    }
    await authService.changeCredentials(
      newUsername || currentUsername,
      newPassword || ''
    );
    setCurrentUsername(newUsername || currentUsername);
  };

  // ── Congregations ──
  const handleSaveCongregation = (c: Partial<Congregation>) => {
    saveCongregation(c);
    loadData();
  };

  const handleDeleteCongregation = (id: string) => {
    deleteCongregation(id);
    if (selectedCongregationId === id) setSelectedCongregationId(null);
    loadData();
  };

  // ── Publishers ──
  const handleSavePublisher = (p: Partial<Publisher>) => {
    savePublisher(p);
    loadData();
  };

  const handleDeletePublisher = (id: string) => {
    deletePublisher(id);
    loadData();
  };

  const handleBulkImport = (pubs: any[]) => {
    const res = bulkSavePublishers(pubs);
    loadData();
    return res;
  };

  // ── Privileges ──
  const handleSavePrivilege = (priv: Partial<Privilege>) => {
    savePrivilege(priv);
    loadData();
  };

  const handleDeletePrivilege = (code: string) => {
    deletePrivilege(code);
    loadData();
  };

  // ── Backup / Restore ──
  const handleExportBackup = () => exportBackup();

  const handleImportBackup = async (file: File) => {
    await importBackup(file);
    loadData();
  };

  // ── CSV Export ──
  const handleExportCsv = () => {
    if (filteredPublishers.length === 0) {
      alert('Nessun proclamatore da esportare.');
      return;
    }
    const headers = ['COGNOME E NOME', 'CONGREGAZIONE', 'PRIVILEGIO', 'ETÀ', 'NOTE'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredPublishers.map((p) => {
      const cong = congregations.find((c) => c.id === p.congregation_id);
      return [
        esc(`${p.last_name} ${p.first_name}`.trim()),
        esc(cong?.name || ''),
        esc(p.privilege_codes || ''),
        esc(p.age || ''),
        esc(p.notes || ''),
      ].join(',');
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const prefix = selectedCongregationId
      ? congregations.find((c) => c.id === selectedCongregationId)?.name.replace(/\s+/g, '_')
      : 'Tutte';
    a.href = url;
    a.download = `Proclamatori_${prefix}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Computed stats ──
  const stats: Stats = useMemo(() => {
    const privilegeCounts: Record<string, number> = {};
    privileges.forEach((p) => { privilegeCounts[p.code] = 0; });
    publishers.forEach((pub) => {
      if (!pub.privilege_codes) return;
      pub.privilege_codes.split(',').map((c) => c.trim()).filter(Boolean).forEach((code) => {
        privilegeCounts[code] = (privilegeCounts[code] || 0) + 1;
      });
    });
    const ages = publishers.map((p) => p.age).filter((a): a is number => typeof a === 'number' && a > 0);
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0;

    const congregationStats = congregations.map((cong) => {
      const congPubs = publishers.filter((p) => p.congregation_id === cong.id);
      const congAges = congPubs.map((p) => p.age).filter((a): a is number => typeof a === 'number' && a > 0);
      const congPrivCounts: Record<string, number> = {};
      privileges.forEach((p) => { congPrivCounts[p.code] = 0; });
      congPubs.forEach((pub) => {
        if (!pub.privilege_codes) return;
        pub.privilege_codes.split(',').map((c) => c.trim()).filter(Boolean).forEach((code) => {
          congPrivCounts[code] = (congPrivCounts[code] || 0) + 1;
        });
      });
      return {
        id: cong.id,
        name: cong.name,
        city: cong.city,
        address: cong.address,
        publishersCount: congPubs.length,
        averageAge: congAges.length > 0 ? Math.round(congAges.reduce((s, a) => s + a, 0) / congAges.length) : 0,
        privilegeCounts: congPrivCounts,
      };
    });

    return {
      totalPersons: publishers.length,
      totalCongregations: congregations.length,
      averageAge,
      privilegeCounts,
      congregationStats,
    };
  }, [congregations, publishers, privileges]);

  const enrichedCongregations = useMemo(() =>
    congregations.map((cong) => {
      const cs = stats.congregationStats.find((s) => s.id === cong.id);
      return {
        ...cong,
        publishersCount: cs?.publishersCount ?? 0,
        averageAge: cs?.averageAge ?? 0,
        privilegeCounts: cs?.privilegeCounts ?? {},
      };
    }),
    [congregations, stats]
  );

  const filteredPublishers = useMemo(() =>
    publishers.filter((pub) => {
      if (selectedCongregationId && pub.congregation_id !== selectedCongregationId) return false;
      if (selectedPrivilege) {
        if (!pub.privilege_codes) return false;
        const codes = pub.privilege_codes.split(',').map((c) => c.trim().toUpperCase());
        if (!codes.includes(selectedPrivilege.toUpperCase())) return false;
      }
      if (selectedGender && pub.gender !== selectedGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const full = `${pub.first_name} ${pub.last_name}`.toLowerCase();
        const rev = `${pub.last_name} ${pub.first_name}`.toLowerCase();
        if (!full.includes(q) && !rev.includes(q) && !(pub.notes || '').toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [publishers, selectedCongregationId, selectedPrivilege, selectedGender, searchQuery]
  );

  // ── Render ──
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
      </div>
    );
  }
  if (authState === 'setup') return <SetupScreen onSetup={handleSetup} />;
  if (authState === 'login') return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <Header
        username={currentUsername}
        dbStatus={{ connectedToNeon: false, neonUrl: '', provider: 'Browser (localStorage)' }}
        onOpenNewPublisher={() => { setEditingPublisher(null); setPublisherModalOpen(true); }}
        onOpenNewCongregation={() => { setEditingCongregation(null); setCongregationModalOpen(true); }}
        onOpenCsvImport={() => setCsvImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        onOpenPdfExport={() => setPdfExportModalOpen(true)}
        onOpenPrivilegesManager={() => setPrivilegesModalOpen(true)}
        onOpenNeonModal={() => {}} // disabled
        onOpenSecurityModal={() => setSecurityModalOpen(true)}
        onLogout={handleLogout}
        onRefresh={loadData}
        isRefreshing={false}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <StatCards stats={stats} />

        <CongregationCards
          congregations={enrichedCongregations}
          selectedCongregationId={selectedCongregationId}
          onSelectCongregation={(id) => setSelectedCongregationId(id)}
          onEditCongregation={(c) => { setEditingCongregation(c); setCongregationModalOpen(true); }}
          onDeleteCongregation={handleDeleteCongregation}
          onNewCongregation={() => { setEditingCongregation(null); setCongregationModalOpen(true); }}
          privileges={privileges}
        />

        <PrivilegeFilter
          privileges={privileges}
          selectedPrivilege={selectedPrivilege}
          onSelectPrivilege={(code) => setSelectedPrivilege(code)}
          selectedGender={selectedGender}
          onSelectGender={(g) => setSelectedGender(g)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          selectedCongregationId={selectedCongregationId}
          onSelectCongregation={(id) => setSelectedCongregationId(id)}
          congregations={congregations}
          privilegeCounts={stats.privilegeCounts || {}}
          totalPublishersCount={publishers.length}
          onOpenPrivilegesManager={() => setPrivilegesModalOpen(true)}
        />

        <PublishersTable
          publishers={filteredPublishers}
          congregations={congregations}
          privileges={privileges}
          onEdit={(pub) => { setEditingPublisher(pub); setPublisherModalOpen(true); }}
          onDelete={handleDeletePublisher}
          onNewPublisher={() => { setEditingPublisher(null); setPublisherModalOpen(true); }}
        />
      </main>

      <PublisherModal
        isOpen={publisherModalOpen}
        onClose={() => { setPublisherModalOpen(false); setEditingPublisher(null); }}
        publisher={editingPublisher}
        congregations={congregations}
        privileges={privileges}
        defaultCongregationId={selectedCongregationId}
        onSave={handleSavePublisher}
        onOpenPrivilegesManager={() => { setPublisherModalOpen(false); setPrivilegesModalOpen(true); }}
      />

      <CongregationModal
        isOpen={congregationModalOpen}
        onClose={() => { setCongregationModalOpen(false); setEditingCongregation(null); }}
        congregation={editingCongregation}
        onSave={handleSaveCongregation}
      />

      <CsvImportModal
        isOpen={csvImportModalOpen}
        onClose={() => setCsvImportModalOpen(false)}
        congregations={congregations}
        onImportSuccess={loadData}
        onBulkImport={handleBulkImport}
      />

      <PdfExportModal
        isOpen={pdfExportModalOpen}
        onClose={() => setPdfExportModalOpen(false)}
        publishers={filteredPublishers}
        congregations={congregations}
        privileges={privileges}
        selectedCongregationId={selectedCongregationId}
      />

      <PrivilegesManagerModal
        isOpen={privilegesModalOpen}
        onClose={() => setPrivilegesModalOpen(false)}
        privileges={privileges}
        onSavePrivilege={handleSavePrivilege}
        onDeletePrivilege={handleDeletePrivilege}
      />

      <SecurityModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        currentUsername={currentUsername}
        onChangeCredentials={handleChangeCredentials}
      />
    </div>
  );
};
