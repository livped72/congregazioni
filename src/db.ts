/**
 * db.ts - Client-side localStorage persistence layer.
 * Replaces the Neon/Express backend. All data lives in the browser.
 * Backup/restore via JSON download.
 */

import { Congregation, Publisher, Privilege } from './types';
import { parseItalianFullName, inferGender } from './nameUtils';

const DB_KEY = 'congregazioni_db_v1';

export interface AppDatabase {
  congregations: Congregation[];
  publishers: Publisher[];
  privileges: Privilege[];
  version: number;
}

const DEFAULT_PRIVILEGES: Privilege[] = [
  { id: 'priv-1', code: 'A', label: 'Anziano', color: '#f59e0b', is_default: true },
  { id: 'priv-2', code: 'SM', label: 'Servitore di ministero', color: '#3b82f6', is_default: true },
  { id: 'priv-3', code: 'PR', label: 'Pioniere regolare', color: '#10b981', is_default: true },
  { id: 'priv-4', code: 'PA', label: 'Pioniere ausiliario', color: '#06b6d4', is_default: true },
  { id: 'priv-5', code: 'PS', label: 'Pioniere speciale', color: '#8b5cf6', is_default: true },
  { id: 'priv-6', code: 'SG', label: 'Sorvegliante di gruppo', color: '#7c3aed', is_default: true },
  { id: 'priv-7', code: 'SOG', label: 'Sorvegliante di gruppo', color: '#7c3aed', is_default: true },
  { id: 'priv-8', code: 'PNB', label: 'Proclamatore non battezzato', color: '#64748b', is_default: true },
  { id: 'priv-9', code: 'PB', label: 'Proclamatore battezzato', color: '#0ea5e9', is_default: true },
];

function getEmpty(): AppDatabase {
  return {
    congregations: [],
    publishers: [],
    privileges: DEFAULT_PRIVILEGES,
    version: 1,
  };
}

export function loadDb(): AppDatabase {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return getEmpty();
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed.privileges || parsed.privileges.length === 0) {
      parsed.privileges = [...DEFAULT_PRIVILEGES];
    } else {
      const existingCodes = new Set(parsed.privileges.map((p) => p.code.toUpperCase()));
      for (const dp of DEFAULT_PRIVILEGES) {
        if (!existingCodes.has(dp.code.toUpperCase())) {
          parsed.privileges.push(dp);
        }
      }
    }

    // Auto-repair any duplicated names from previous imports
    if (parsed.publishers && parsed.publishers.length > 0) {
      let repaired = false;
      for (const p of parsed.publishers) {
        if (
          p.last_name &&
          p.first_name &&
          p.last_name.trim().toLowerCase() === p.first_name.trim().toLowerCase()
        ) {
          const split = parseItalianFullName(p.last_name);
          p.last_name = split.last_name;
          p.first_name = split.first_name;
          p.gender = inferGender(p.first_name, p.privilege_codes);
          repaired = true;
        }
      }
      if (repaired) {
        saveDb(parsed);
      }
    }

    return parsed;
  } catch {
    return getEmpty();
  }
}

function saveDb(db: AppDatabase): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── CONGREGATIONS ──────────────────────────────────────────────────────────

export function getCongregations(): Congregation[] {
  return loadDb().congregations;
}

export function saveCongregation(c: Partial<Congregation>): Congregation {
  const db = loadDb();
  const id = c.id || `cong-${uid()}`;
  const item: Congregation = {
    id,
    name: c.name || '',
    city: c.city || '',
    address: c.address || '',
    notes: c.notes || '',
  };
  const idx = db.congregations.findIndex((x) => x.id === id);
  if (idx >= 0) {
    db.congregations[idx] = item;
  } else {
    db.congregations.push(item);
  }
  saveDb(db);
  return item;
}

export function deleteCongregation(id: string): void {
  const db = loadDb();
  db.congregations = db.congregations.filter((c) => c.id !== id);
  // Cascade: remove all publishers belonging to this congregation
  db.publishers = db.publishers.filter((p) => p.congregation_id !== id);
  saveDb(db);
}

// ─── PUBLISHERS ─────────────────────────────────────────────────────────────

export function getPublishers(): Publisher[] {
  return loadDb().publishers;
}

export function savePublisher(p: Partial<Publisher>): Publisher {
  const db = loadDb();
  const id = p.id || `pub-${uid()}`;
  const item: Publisher = {
    id,
    congregation_id: p.congregation_id || '',
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    birth_date: p.birth_date || '',
    age: p.age !== undefined && p.age !== null && p.age !== ('' as any) ? Number(p.age) : undefined,
    gender: p.gender || 'M',
    phone: p.phone || '',
    email: p.email || '',
    address: p.address || '',
    privilege_codes: p.privilege_codes || '',
    group_number: p.group_number || '',
    is_active: p.is_active !== false,
    notes: p.notes || '',
    created_at: p.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const idx = db.publishers.findIndex((x) => x.id === id);
  if (idx >= 0) {
    db.publishers[idx] = item;
  } else {
    db.publishers.push(item);
  }
  saveDb(db);
  return item;
}

export function deletePublisher(id: string): void {
  const db = loadDb();
  db.publishers = db.publishers.filter((p) => p.id !== id);
  saveDb(db);
}

export function bulkSavePublishers(publishers: Partial<Publisher & { congregation_name?: string }>[]) : { count: number; message: string } {
  const db = loadDb();
  let count = 0;
  let defaultCongId = db.congregations[0]?.id;

  for (let p of publishers) {
    let congId = p.congregation_id;

    // Resolve congregation_name → congregation_id
    if (!congId && p.congregation_name && p.congregation_name.trim()) {
      const congName = p.congregation_name.trim();
      let cong = db.congregations.find(
        (c) => c.name.toLowerCase() === congName.toLowerCase()
      );
      if (!cong) {
        cong = {
          id: 'cong-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: congName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.congregations.push(cong);
      }
      congId = cong.id;
      if (!defaultCongId) defaultCongId = cong.id;
    }

    // Fallback: if still no congregation id, use defaultCongId or create one
    if (!congId) {
      if (!defaultCongId) {
        const fallbackCong: Congregation = {
          id: 'cong-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: 'Congregazione Principale',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.congregations.push(fallbackCong);
        defaultCongId = fallbackCong.id;
      }
      congId = defaultCongId;
    }

    // Auto-register any new privilege codes found into db.privileges
    if (p.privilege_codes) {
      const codes = p.privilege_codes.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
      for (const code of codes) {
        if (!db.privileges.some((pr) => pr.code.toUpperCase() === code)) {
          db.privileges.push({
            id: 'priv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            code,
            label: code,
            color: '#6366f1',
            is_default: false,
          });
        }
      }
    }

    let lastName = (p.last_name || '').trim();
    let firstName = (p.first_name || '').trim();

    if (lastName && firstName && lastName.toLowerCase() === firstName.toLowerCase()) {
      const split = parseItalianFullName(lastName);
      lastName = split.last_name;
      firstName = split.first_name;
    }

    // Upsert publisher
    const id = p.id || 'pub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const item: Publisher = {
      id,
      congregation_id: congId,
      first_name: firstName,
      last_name: lastName,
      phone: (p.phone || '').trim(),
      email: (p.email || '').trim(),
      address: (p.address || '').trim(),
      gender: p.gender === 'F' ? 'F' : 'M',
      privilege_codes: (p.privilege_codes || '').trim(),
      group_number: (p.group_number || '').trim(),
      birth_date: p.birth_date ? String(p.birth_date).trim() : '',
      age: typeof p.age === 'number' && !isNaN(p.age) ? p.age : null,
      is_active: p.is_active !== false,
      notes: (p.notes || '').trim(),
      created_at: p.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existingIdx = db.publishers.findIndex(
      (x) => x.id === id || (
        x.congregation_id === congId &&
        x.last_name.toLowerCase().trim() === item.last_name.toLowerCase().trim() &&
        x.first_name.toLowerCase().trim() === item.first_name.toLowerCase().trim()
      )
    );

    if (existingIdx >= 0) {
      db.publishers[existingIdx] = { ...db.publishers[existingIdx], ...item, updated_at: new Date().toISOString() };
    } else {
      db.publishers.push(item);
    }
    count++;
  }

  saveDb(db);
  return { count, message: `${count} proclamatori importati con successo!` };
}

// ─── PRIVILEGES ─────────────────────────────────────────────────────────────

export function getPrivileges(): Privilege[] {
  return loadDb().privileges;
}

export function savePrivilege(priv: Partial<Privilege>): Privilege {
  const db = loadDb();
  const code = (priv.code || '').toUpperCase().trim();
  const id = priv.id || `priv-${uid()}`;
  const item: Privilege = {
    id,
    code,
    label: priv.label || '',
    color: priv.color || '#3b82f6',
    is_default: !!priv.is_default,
  };
  const idx = (db.privileges || []).findIndex((p) => p.code === code);
  if (idx >= 0) {
    db.privileges[idx] = item;
  } else {
    db.privileges = [...(db.privileges || []), item];
  }
  saveDb(db);
  return item;
}

export function deletePrivilege(code: string): void {
  const db = loadDb();
  db.privileges = (db.privileges || []).filter((p) => p.code !== code);
  saveDb(db);
}

// ─── BACKUP / RESTORE ───────────────────────────────────────────────────────

export function exportBackup(): void {
  const db = loadDb();
  const json = JSON.stringify(db, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `congregazioni_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppDatabase;
        if (!parsed.congregations || !parsed.publishers) {
          throw new Error('File di backup non valido.');
        }
        if (!parsed.privileges || parsed.privileges.length === 0) {
          parsed.privileges = DEFAULT_PRIVILEGES;
        }
        saveDb(parsed);
        resolve();
      } catch (err: any) {
        reject(new Error(err.message || 'Errore nel ripristino del backup.'));
      }
    };
    reader.onerror = () => reject(new Error('Impossibile leggere il file.'));
    reader.readAsText(file);
  });
}

// ─── AUTH (localStorage only) ────────────────────────────────────────────────

const AUTH_KEY = 'congregazioni_auth_v1';

interface AuthData {
  username: string;
  // password stored as plain hash using SubtleCrypto – for local use, we store hashed
  passwordHash: string;
  initialized: boolean;
}

function getAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(data: AuthData): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  isInitialized(): boolean {
    return !!getAuth()?.initialized;
  },

  getUsername(): string {
    return getAuth()?.username || 'Admin';
  },

  async setup(username: string, password: string): Promise<void> {
    const hash = await hashPassword(password);
    saveAuth({ username, passwordHash: hash, initialized: true });
  },

  async login(username: string, password: string): Promise<boolean> {
    const auth = getAuth();
    if (!auth) return false;
    const hash = await hashPassword(password);
    return auth.username.toLowerCase() === username.toLowerCase() && auth.passwordHash === hash;
  },

  async changeCredentials(newUsername: string, newPassword: string): Promise<void> {
    const hash = await hashPassword(newPassword);
    saveAuth({ username: newUsername, passwordHash: hash, initialized: true });
  },

  async verifyPassword(password: string): Promise<boolean> {
    const auth = getAuth();
    if (!auth) return false;
    const hash = await hashPassword(password);
    return auth.passwordHash === hash;
  },
};
