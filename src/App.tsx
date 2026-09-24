import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api, auth } from './api';
import { Congregation, Publisher, Privilege, Stats, DbStatus } from './types';
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
import { NeonSettingsModal } from './components/NeonSettingsModal';
import { SecurityModal } from './components/SecurityModal';
import { LoginScreen } from './components/LoginScreen';
import { SetupScreen } from './components/SetupScreen';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  // Auth state
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connectedToNeon: false,
    neonUrl: '',
    provider: 'Database Locale'
  });

  // App data state
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPersons: 0,
    totalCongregations: 0,
    averageAge: 0,
    privilegeCounts: {},
    congregationStats: []
  });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state (no group filter)
  const [selectedCongregationId, setSelectedCongregationId] = useState<string | null>(null);
  const [selectedPrivilege, setSelectedPrivilege] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [publisherModalOpen, setPublisherModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);

  const [congregationModalOpen, setCongregationModalOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState<Congregation | null>(null);

  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);
  const [privilegesModalOpen, setPrivilegesModalOpen] = useState(false);
  const [neonModalOpen, setNeonModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Check auth & init status
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      const status = await api.getAuthStatus();
      setIsInitialized(status.isInitialized);
      if (status.dbStatus) {
        setDbStatus(status.dbStatus);
      }

      if (auth.isAuthenticated() && status.isInitialized) {
        setIsAuthenticated(true);
        setCurrentUsername(auth.getUsername() || status.username || 'Admin');
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Errore verifica stato auth:', e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    const handleAuthChange = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, [checkAuthStatus]);

  // Load app data
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsRefreshing(true);
      const [cRes, pRes, privRes, sRes, dbRes] = await Promise.all([
        api.getCongregations(),
        api.getPublishers(),
        api.getPrivileges(),
        api.getStats(),
        api.getNeonStatus()
      ]);

      setCongregations(cRes);
      setPublishers(pRes);
      setPrivileges(privRes);
      setStats(sRes);
      setDbStatus(dbRes);
    } catch (err) {
      console.error('Errore nel caricamento dati:', err);
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Authentication handlers
  const handleSetup = async (username: string, pass: string) => {
    const res = await api.setup(username, pass);
    auth.setSession(res.token, res.username);
    setIsInitialized(true);
    setIsAuthenticated(true);
    setCurrentUsername(res.username);
    return res;
  };

  const handleLogin = async (username: string, pass: string) => {
    const res = await api.login(username, pass);
    auth.setSession(res.token, res.username);
    setIsAuthenticated(true);
    setCurrentUsername(res.username);
    return res;
  };

  const handleLogout = () => {
    auth.clearSession();
    setIsAuthenticated(false);
  };

  const handleChangeCredentials = async (currentPassword: string, newUsername?: string, newPassword?: string) => {
    const res = await api.changeCredentials(currentPassword, newUsername, newPassword);
    auth.setSession(res.token, res.username);
    setCurrentUsername(res.username);
  };

  const handleConnectNeon = async (connStr: string) => {
    const res = await api.connectNeon(connStr);
    if (res.status) {
      setDbStatus(res.status);
    }
    await loadData();
  };

  // Congregation actions
  const handleSaveCongregation = async (c: Partial<Congregation>) => {
    await api.saveCongregation(c);
    await loadData();
  };

  const handleDeleteCongregation = async (id: string) => {
    await api.deleteCongregation(id);
    if (selectedCongregationId === id) {
      setSelectedCongregationId(null);
    }
    await loadData();
  };

  // Publisher actions
  const handleSavePublisher = async (p: Partial<Publisher>) => {
    await api.savePublisher(p);
    await loadData();
  };

  const handleDeletePublisher = async (id: string) => {
    await api.deletePublisher(id);
    await loadData();
  };

  const handleBulkImport = async (pubs: any[]) => {
    const res = await api.bulkImportPublishers(pubs);
    await loadData();
    return res;
  };

  // Privilege actions
  const handleSavePrivilege = async (priv: Partial<Privilege>) => {
    await api.savePrivilege(priv);
    await loadData();
  };

  const handleDeletePrivilege = async (code: string) => {
    await api.deletePrivilege(code);
    await loadData();
  };

  // CSV Export (Cleaned columns)
  const handleExportCsv = () => {
    if (filteredPublishers.length === 0) {
      alert('Nessun proclamatore da esportare.');
      return;
    }

    const headers = [
      'Cognome',
      'Nome',
      'Congregazione',
      'Privilegio',
      'Età',
      'Data di Nascita',
      'Note'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredPublishers.map((p) => {
      const cong = congregations.find((c) => c.id === p.congregation_id);
      return [
        escapeCsv(p.last_name),
        escapeCsv(p.first_name),
        escapeCsv(cong ? cong.name : ''),
        escapeCsv(p.privilege_codes || ''),
        escapeCsv(p.age || ''),
        escapeCsv(p.birth_date || ''),
        escapeCsv(p.notes || '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const congPrefix = selectedCongregationId 
      ? congregations.find((c) => c.id === selectedCongregationId)?.name.replace(/\s+/g, '_')
      : 'Tutte';
    link.setAttribute('href', url);
    link.setAttribute('download', `Proclamatori_${congPrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enrich congregations with computed stats
  const enrichedCongregations = useMemo(() => {
    return congregations.map((cong) => {
      const congStats = stats.congregationStats?.find((s) => s.id === cong.id);
      return {
        ...cong,
        publishersCount: congStats ? congStats.publishersCount : publishers.filter((p) => p.congregation_id === cong.id).length,
        averageAge: congStats ? congStats.averageAge : 0,
        privilegeCounts: congStats ? congStats.privilegeCounts : {}
      };
    });
  }, [congregations, stats, publishers]);

  // Filtered publishers (no group filter)
  const filteredPublishers = useMemo(() => {
    return publishers.filter((pub) => {
      // Congregation filter
      if (selectedCongregationId && pub.congregation_id !== selectedCongregationId) {
        return false;
      }

      // Privilege filter
      if (selectedPrivilege) {
        if (!pub.privilege_codes) return false;
        const codes = pub.privilege_codes.split(',').map((c) => c.trim().toUpperCase());
        if (!codes.includes(selectedPrivilege.toUpperCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${pub.first_name} ${pub.last_name}`.toLowerCase();
        const reverseName = `${pub.last_name} ${pub.first_name}`.toLowerCase();
        const notes = (pub.notes || '').toLowerCase();

        if (
          !fullName.includes(q) &&
          !reverseName.includes(q) &&
          !notes.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [publishers, selectedCongregationId, selectedPrivilege, searchQuery]);

  // Initial loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">
            Caricamento Congregazioni...
          </p>
        </div>
      </div>
    );
  }

  // First time configuration screen
  if (!isInitialized) {
    return <SetupScreen onSetupSuccess={() => checkAuthStatus()} onSetup={handleSetup} />;
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => checkAuthStatus()} onLogin={handleLogin} dbStatus={dbStatus} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Navigation Bar */}
      <Header
        username={currentUsername}
        dbStatus={dbStatus}
        onOpenNewPublisher={() => {
          setEditingPublisher(null);
          setPublisherModalOpen(true);
        }}
        onOpenNewCongregation={() => {
          setEditingCongregation(null);
          setCongregationModalOpen(true);
        }}
        onOpenCsvImport={() => setCsvImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        onOpenPdfExport={() => setPdfExportModalOpen(true)}
        onOpenPrivilegesManager={() => setPrivilegesModalOpen(true)}
        onOpenNeonModal={() => setNeonModalOpen(true)}
        onOpenSecurityModal={() => setSecurityModalOpen(true)}
        onLogout={handleLogout}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Stat Cards - Persone Totali, Congregazioni, Età Media */}
        <StatCards stats={stats} />

        {/* Congregazioni Section */}
        <CongregationCards
          congregations={enrichedCongregations}
          selectedCongregationId={selectedCongregationId}
          onSelectCongregation={(id) => setSelectedCongregationId(id)}
          onEditCongregation={(c) => {
            setEditingCongregation(c);
            setCongregationModalOpen(true);
          }}
          onDeleteCongregation={handleDeleteCongregation}
          onNewCongregation={() => {
            setEditingCongregation(null);
            setCongregationModalOpen(true);
          }}
          privileges={privileges}
        />

        {/* Orderly Filter Bar with Clean Privilege Chips */}
        <PrivilegeFilter
          privileges={privileges}
          selectedPrivilege={selectedPrivilege}
          onSelectPrivilege={(code) => setSelectedPrivilege(code)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          selectedCongregationId={selectedCongregationId}
          onSelectCongregation={(id) => setSelectedCongregationId(id)}
          congregations={congregations}
          privilegeCounts={stats.privilegeCounts || {}}
          totalPublishersCount={publishers.length}
          onOpenPrivilegesManager={() => setPrivilegesModalOpen(true)}
        />

        {/* Publishers Table (No Initials, No Gruppo, No Contatti, Privilegio) */}
        <PublishersTable
          publishers={filteredPublishers}
          congregations={congregations}
          privileges={privileges}
          onEdit={(pub) => {
            setEditingPublisher(pub);
            setPublisherModalOpen(true);
          }}
          onDelete={handleDeletePublisher}
          onNewPublisher={() => {
            setEditingPublisher(null);
            setPublisherModalOpen(true);
          }}
        />

      </main>

      {/* MODALS */}
      <PublisherModal
        isOpen={publisherModalOpen}
        onClose={() => {
          setPublisherModalOpen(false);
          setEditingPublisher(null);
        }}
        publisher={editingPublisher}
        congregations={congregations}
        privileges={privileges}
        defaultCongregationId={selectedCongregationId}
        onSave={handleSavePublisher}
        onOpenPrivilegesManager={() => {
          setPublisherModalOpen(false);
          setPrivilegesModalOpen(true);
        }}
      />

      <CongregationModal
        isOpen={congregationModalOpen}
        onClose={() => {
          setCongregationModalOpen(false);
          setEditingCongregation(null);
        }}
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

      <NeonSettingsModal
        isOpen={neonModalOpen}
        onClose={() => setNeonModalOpen(false)}
        dbStatus={dbStatus}
        onConnectNeon={handleConnectNeon}
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
