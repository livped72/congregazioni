import { Congregation, Publisher, Privilege, Stats, DbStatus } from './types';

const TOKEN_KEY = 'congregazioni_token';
const USERNAME_KEY = 'congregazioni_username';

const NEON_URL_KEY = 'congregazioni_neon_url';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUsername: () => localStorage.getItem(USERNAME_KEY),
  setSession: (token: string, username: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    // non eliminiamo il neon_url per permettere la connessione al db al login
  },
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  getNeonUrl: () => localStorage.getItem(NEON_URL_KEY),
  setNeonUrl: (url: string) => localStorage.setItem(NEON_URL_KEY, url)
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const neonUrl = auth.getNeonUrl();
  if (neonUrl) {
    headers['x-neon-url'] = neonUrl;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (res.status === 401) {
    auth.clearSession();
    // Dispatch auth change event so UI updates immediately
    window.dispatchEvent(new Event('auth-changed'));
    throw new Error('Sessione scaduta o non autorizzata. Effettua nuovamente l\'accesso.');
  }

  let data: any = {};
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Errore HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Errore HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  getAuthStatus: () => request<{ isInitialized: boolean; username: string | null; dbStatus: DbStatus }>('/api/auth/status'),
  setup: (username: string, password: string) =>
    request<{ success: boolean; token: string; username: string }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  login: (username: string, password: string) =>
    request<{ success: boolean; token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  resetPassword: (username: string, newPassword: string) =>
    request<{ success: boolean; token: string; username: string; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ username, newPassword })
    }),
  changeCredentials: (currentPassword?: string, newUsername?: string, newPassword?: string) =>
    request<{ success: boolean; token: string; username: string; message: string }>('/api/auth/change-credentials', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newUsername, newPassword })
    }),

  // Neon
  getNeonStatus: () => request<DbStatus>('/api/neon/status'),
  connectNeon: async (connectionString: string) => {
    const res = await request<{ success: boolean; message: string; status: DbStatus }>('/api/neon/connect', {
      method: 'POST',
      body: JSON.stringify({ connectionString })
    });
    if (res.success) {
      auth.setNeonUrl(connectionString);
    }
    return res;
  },

  // Stats
  getStats: () => request<Stats>('/api/stats'),

  // Congregations
  getCongregations: () => request<Congregation[]>('/api/congregations'),
  saveCongregation: (c: Partial<Congregation>) =>
    request<Congregation>('/api/congregations', {
      method: 'POST',
      body: JSON.stringify(c)
    }),
  deleteCongregation: (id: string) =>
    request<{ success: boolean }>(`/api/congregations/${id}`, {
      method: 'DELETE'
    }),

  // Publishers
  getPublishers: () => request<Publisher[]>('/api/publishers'),
  savePublisher: (p: Partial<Publisher>) =>
    request<Publisher>('/api/publishers', {
      method: 'POST',
      body: JSON.stringify(p)
    }),
  deletePublisher: (id: string) =>
    request<{ success: boolean }>(`/api/publishers/${id}`, {
      method: 'DELETE'
    }),
  bulkImportPublishers: (publishers: any[]) =>
    request<{ success: boolean; count: number; message: string }>('/api/publishers/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ publishers })
    }),

  // Privileges
  getPrivileges: () => request<Privilege[]>('/api/privileges'),
  savePrivilege: (priv: Partial<Privilege>) =>
    request<Privilege>('/api/privileges', {
      method: 'POST',
      body: JSON.stringify(priv)
    }),
  deletePrivilege: (code: string) =>
    request<{ success: boolean }>(`/api/privileges/${code}`, {
      method: 'DELETE'
    })
};
