import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'congregazioni-secure-jwt-key-2026-privato';
const DATA_DIR = process.env.VERCEL ? '/tmp/congregazioni-data' : path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'congregazioni-db.json');
const ENV_FILE = path.join(process.cwd(), '.env');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore in read-only environment
}

// ----------------------------------------------------
// DEFAULT INITIAL DATA
// ----------------------------------------------------
export const DEFAULT_PRIVILEGES = [
  { id: 'priv-a', code: 'A', label: 'Anziano', color: '#d97706', is_default: true },
  { id: 'priv-sm', code: 'SM', label: 'Servitore di Ministero', color: '#2563eb', is_default: true },
  { id: 'priv-pr', code: 'PR', label: 'Pioniere Regolare', color: '#059669', is_default: true },
  { id: 'priv-a-pr', code: 'A-PR', label: 'Anziano & Pioniere Regolare', color: '#0d9488', is_default: true },
  { id: 'priv-sm-pr', code: 'SM-PR', label: 'Servitore & Pioniere Regolare', color: '#4f46e5', is_default: true },
  { id: 'priv-pa', code: 'PA', label: 'Pioniere Ausiliario', color: '#0891b2', is_default: true },
  { id: 'priv-sg', code: 'SG', label: 'Sorvegliante di Gruppo', color: '#9333ea', is_default: true },
  { id: 'priv-p', code: 'P', label: 'Proclamatore', color: '#64748b', is_default: true },
];

export const INITIAL_CONGREGATIONS = [
  { id: 'cong-1', name: 'Milano Sud', city: 'Milano', address: 'Via Roma 12', notes: 'Adunanza Giovedì e Domenica' },
  { id: 'cong-2', name: 'Napoli Centro', city: 'Napoli', address: 'Corso Umberto 45', notes: 'Adunanza Martedì e Sabato' },
  { id: 'cong-3', name: 'Roma Nord', city: 'Roma', address: 'Viale Libia 80', notes: 'Adunanza Mercoledì e Domenica' }
];

export const INITIAL_PUBLISHERS = [
  {
    id: 'pub-1',
    congregation_id: 'cong-1',
    first_name: 'Marco',
    last_name: 'Rossi',
    birth_date: '1988-04-12',
    age: 38,
    gender: 'M',
    phone: '+39 340 1234567',
    email: 'marco.rossi@example.com',
    address: 'Via Dante 10, Milano',
    privilege_codes: 'SM',
    is_active: true,
    notes: 'Incaricato reparto Audio/Video'
  },
  {
    id: 'pub-2',
    congregation_id: 'cong-1',
    first_name: 'Elena',
    last_name: 'Bianchi',
    birth_date: '1995-09-20',
    age: 31,
    gender: 'F',
    phone: '+39 349 9876543',
    email: 'elena.bianchi@example.com',
    address: 'Via Garibaldi 15, Milano',
    privilege_codes: 'PA',
    is_active: true,
    notes: 'Disponibilità servizio mattutino'
  },
  {
    id: 'pub-3',
    congregation_id: 'cong-2',
    first_name: 'Giuseppe',
    last_name: 'Esposito',
    birth_date: '1982-11-05',
    age: 43,
    gender: 'M',
    phone: '+39 333 4567890',
    email: 'giuseppe.esposito@example.com',
    address: 'Via Toledo 22, Napoli',
    privilege_codes: 'SG',
    is_active: true,
    notes: 'Sorvegliante gruppo 1'
  },
  {
    id: 'pub-4',
    congregation_id: 'cong-3',
    first_name: 'Antonio',
    last_name: 'Verdi',
    birth_date: '1974-02-18',
    age: 52,
    gender: 'M',
    phone: '+39 347 1122334',
    email: 'antonio.verdi@example.com',
    address: 'Via Nomentana 100, Roma',
    privilege_codes: 'A',
    is_active: true,
    notes: 'Coordinatore corpo degli anziani'
  },
  {
    id: 'pub-5',
    congregation_id: 'cong-3',
    first_name: 'Chiara',
    last_name: 'Russo',
    birth_date: '1989-07-30',
    age: 36,
    gender: 'F',
    phone: '+39 328 5566778',
    email: 'chiara.russo@example.com',
    address: 'Viale Somalia 40, Roma',
    privilege_codes: 'PR',
    is_active: true,
    notes: 'Pioniera regolare da 5 anni'
  }
];

export interface LocalDatabase {
  user: { username: string; password_hash: string; updated_at: string } | null;
  neon_url?: string;
  congregations: any[];
  publishers: any[];
  privileges: any[];
  settings: Record<string, any>;
}

// In-memory fallback if filesystem write is blocked
let memoryDb: LocalDatabase | null = null;

// ----------------------------------------------------
// DATABASE SERVICE (Neon Postgres + Local Fallback)
// ----------------------------------------------------
export class DatabaseService {
  private pgPool: Pool | null = null;
  private neonUrl: string = '';
  private isNeonConnected: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async ensureInit() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private readLocal(): LocalDatabase {
    if (memoryDb) {
      return memoryDb;
    }

    // Default admin user: admin / admin2026
    const defaultUser = {
      username: 'admin',
      password_hash: '$2b$10$gwXnOOPnJq7TEQn8K4myP.HuekE1zfWA9dS9wujX9hZziN6jVFGXu',
      updated_at: new Date().toISOString()
    };

    if (!fs.existsSync(LOCAL_DB_FILE)) {
      const initial: LocalDatabase = {
        user: defaultUser,
        neon_url: '',
        congregations: INITIAL_CONGREGATIONS,
        publishers: INITIAL_PUBLISHERS,
        privileges: DEFAULT_PRIVILEGES,
        settings: {
          app_title: 'Congregazioni',
          theme: 'Congregazioni'
        }
      };
      try {
        fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2));
      } catch (e) {
        memoryDb = initial;
      }
      return initial;
    }

    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
      if (!data.privileges || data.privileges.length === 0) {
        data.privileges = DEFAULT_PRIVILEGES;
      }
      if (!data.user) {
        data.user = defaultUser;
      }
      return data;
    } catch {
      const fallback: LocalDatabase = {
        user: defaultUser,
        neon_url: '',
        congregations: INITIAL_CONGREGATIONS,
        publishers: INITIAL_PUBLISHERS,
        privileges: DEFAULT_PRIVILEGES,
        settings: {}
      };
      memoryDb = fallback;
      return fallback;
    }
  }

  private saveLocal(data: LocalDatabase) {
    memoryDb = data;
    try {
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      // Memory fallback is active
    }
  }

  public async init() {
    const local = this.readLocal();
    const urlFromEnv = process.env.DATABASE_URL || '';
    const url = urlFromEnv || local.neon_url || '';

    if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
      await this.connectNeon(url, false);
    }
  }

  public async connectNeon(connectionString: string, persist: boolean = true): Promise<{ success: boolean; error?: string }> {
    try {
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.pgPool = pool;
      this.neonUrl = connectionString;
      this.isNeonConnected = true;

      await this.runNeonMigrations();

      if (persist) {
        const local = this.readLocal();
        local.neon_url = connectionString;
        this.saveLocal(local);

        try {
          if (!process.env.VERCEL) {
            let envContent = '';
            if (fs.existsSync(ENV_FILE)) {
              envContent = fs.readFileSync(ENV_FILE, 'utf-8');
            }
            if (envContent.includes('DATABASE_URL=')) {
              envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${connectionString}"`);
            } else {
              envContent += `\nDATABASE_URL="${connectionString}"\n`;
            }
            fs.writeFileSync(ENV_FILE, envContent.trim() + '\n');
          }
        } catch (e) {
          // Ignore write error
        }

        await this.migrateLocalToNeon();
      }

      return { success: true };
    } catch (err: any) {
      this.isNeonConnected = false;
      this.pgPool = null;
      return { success: false, error: err.message };
    }
  }

  private async runNeonMigrations() {
    if (!this.pgPool) return;
    const client = await this.pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS congregazioni_users (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS congregazioni_congregations (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          city VARCHAR(255),
          address VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS congregazioni_privileges (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(64) UNIQUE NOT NULL,
          label VARCHAR(255) NOT NULL,
          color VARCHAR(64),
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS congregazioni_publishers (
          id VARCHAR(64) PRIMARY KEY,
          congregation_id VARCHAR(64) REFERENCES congregazioni_congregations(id) ON DELETE CASCADE,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          birth_date VARCHAR(64),
          age INT,
          gender VARCHAR(16),
          phone VARCHAR(64),
          email VARCHAR(255),
          address VARCHAR(255),
          privilege_codes VARCHAR(255),
          group_number VARCHAR(64),
          is_active BOOLEAN DEFAULT TRUE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS congregazioni_settings (
          key VARCHAR(128) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } finally {
      client.release();
    }
  }

  private async migrateLocalToNeon() {
    if (!this.pgPool) return;
    const local = this.readLocal();
    const client = await this.pgPool.connect();

    try {
      const userCheck = await client.query('SELECT COUNT(*) FROM congregazioni_users');
      if (parseInt(userCheck.rows[0].count) === 0 && local.user) {
        await client.query(
          'INSERT INTO congregazioni_users (id, username, password_hash) VALUES ($1, $2, $3)',
          ['master-user', local.user.username, local.user.password_hash]
        );
      }

      const privCheck = await client.query('SELECT COUNT(*) FROM congregazioni_privileges');
      if (parseInt(privCheck.rows[0].count) === 0) {
        for (const p of local.privileges || DEFAULT_PRIVILEGES) {
          await client.query(
            `INSERT INTO congregazioni_privileges (id, code, label, color, is_default)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING`,
            [p.id, p.code, p.label, p.color, !!p.is_default]
          );
        }
      }

      const congCheck = await client.query('SELECT COUNT(*) FROM congregazioni_congregations');
      if (parseInt(congCheck.rows[0].count) === 0) {
        for (const c of local.congregations || []) {
          await client.query(
            `INSERT INTO congregazioni_congregations (id, name, city, address, notes)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
            [c.id, c.name, c.city || '', c.address || '', c.notes || '']
          );
        }

        for (const pub of local.publishers || []) {
          await client.query(
            `INSERT INTO congregazioni_publishers 
             (id, congregation_id, first_name, last_name, birth_date, age, gender, phone, email, address, privilege_codes, group_number, is_active, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`,
            [
              pub.id,
              pub.congregation_id,
              pub.first_name,
              pub.last_name,
              pub.birth_date || '',
              pub.age || null,
              pub.gender || 'M',
              pub.phone || '',
              pub.email || '',
              pub.address || '',
              pub.privilege_codes || '',
              pub.group_number || '',
              pub.is_active !== false,
              pub.notes || ''
            ]
          );
        }
      }
    } catch (e) {
      console.error('Errore migrazione su Neon:', e);
    } finally {
      client.release();
    }
  }

  public async getStatus() {
    await this.ensureInit();
    return {
      connectedToNeon: this.isNeonConnected,
      neonUrl: this.isNeonConnected ? this.maskConnectionString(this.neonUrl) : (this.neonUrl ? this.maskConnectionString(this.neonUrl) : ''),
      provider: this.isNeonConnected ? 'Neon PostgreSQL (Cloud)' : 'Database Locale (Pronto per connessione Neon)'
    };
  }

  private maskConnectionString(str: string): string {
    if (!str) return '';
    try {
      const url = new URL(str);
      return `${url.protocol}//${url.username}:****@${url.host}${url.pathname}`;
    } catch {
      return str.replace(/:[^@]+@/, ':****@');
    }
  }

  // ---------------- User & Auth ----------------
  public async getUser(): Promise<{ username: string; password_hash: string } | null> {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT username, password_hash FROM congregazioni_users LIMIT 1');
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (e) {
        console.error('Error fetching user from Neon:', e);
      }
    }
    const local = this.readLocal();
    return local.user;
  }

  public async setUser(username: string, password_hash: string) {
    await this.ensureInit();
    const local = this.readLocal();
    local.user = { username, password_hash, updated_at: new Date().toISOString() };
    this.saveLocal(local);

    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO congregazioni_users (id, username, password_hash, updated_at)
           VALUES ('master-user', $1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET username = $1, password_hash = $2, updated_at = CURRENT_TIMESTAMP`,
          [username, password_hash]
        );
      } catch (e) {
        console.error('Error setting user in Neon:', e);
      }
    }
  }

  // ---------------- Congregations ----------------
  public async getCongregations(): Promise<any[]> {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT * FROM congregazioni_congregations ORDER BY name ASC');
        return res.rows;
      } catch (e) {
        console.error('Error getting congregations from Neon:', e);
      }
    }
    return this.readLocal().congregations;
  }

  public async saveCongregation(c: any): Promise<any> {
    const id = c.id || `cong-${Date.now()}`;
    const newCong = {
      id,
      name: c.name,
      city: c.city || '',
      address: c.address || '',
      notes: c.notes || ''
    };

    await this.ensureInit();

    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO congregazioni_congregations (id, name, city, address, notes, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET name = $2, city = $3, address = $4, notes = $5, updated_at = CURRENT_TIMESTAMP`,
          [id, newCong.name, newCong.city, newCong.address, newCong.notes]
        );
      } catch (e) {
        console.error('Error saving congregation to Neon:', e);
      }
    }

    const local = this.readLocal();
    const idx = local.congregations.findIndex((x) => x.id === id);
    if (idx >= 0) {
      local.congregations[idx] = newCong;
    } else {
      local.congregations.push(newCong);
    }
    this.saveLocal(local);
    return newCong;
  }

  public async deleteCongregation(id: string) {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query('DELETE FROM congregazioni_congregations WHERE id = $1', [id]);
      } catch (e) {
        console.error('Error deleting congregation from Neon:', e);
      }
    }
    const local = this.readLocal();
    local.congregations = local.congregations.filter((c) => c.id !== id);
    local.publishers = local.publishers.filter((p) => p.congregation_id !== id);
    this.saveLocal(local);
  }

  // ---------------- Publishers ----------------
  public async getPublishers(): Promise<any[]> {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT * FROM congregazioni_publishers ORDER BY last_name ASC, first_name ASC');
        return res.rows.map((row) => ({
          ...row,
          is_active: row.is_active !== false
        }));
      } catch (e) {
        console.error('Error getting publishers from Neon:', e);
      }
    }
    return this.readLocal().publishers;
  }

  public async savePublisher(p: any): Promise<any> {
    const id = p.id || `pub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const pub = {
      id,
      congregation_id: p.congregation_id,
      first_name: p.first_name,
      last_name: p.last_name,
      birth_date: p.birth_date || '',
      age: p.age !== undefined && p.age !== null && p.age !== '' ? parseInt(p.age) : null,
      gender: p.gender || 'M',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      privilege_codes: p.privilege_codes || '',
      group_number: p.group_number || '',
      is_active: p.is_active !== false,
      notes: p.notes || ''
    };

    await this.ensureInit();

    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO congregazioni_publishers
           (id, congregation_id, first_name, last_name, birth_date, age, gender, phone, email, address, privilege_codes, group_number, is_active, notes, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             congregation_id = $2, first_name = $3, last_name = $4, birth_date = $5,
             age = $6, gender = $7, phone = $8, email = $9, address = $10,
             privilege_codes = $11, group_number = $12, is_active = $13, notes = $14, updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            pub.congregation_id,
            pub.first_name,
            pub.last_name,
            pub.birth_date,
            pub.age,
            pub.gender,
            pub.phone,
            pub.email,
            pub.address,
            pub.privilege_codes,
            pub.group_number,
            pub.is_active,
            pub.notes
          ]
        );
      } catch (e) {
        console.error('Error saving publisher to Neon:', e);
      }
    }

    const local = this.readLocal();
    const idx = local.publishers.findIndex((x) => x.id === id);
    if (idx >= 0) {
      local.publishers[idx] = pub;
    } else {
      local.publishers.push(pub);
    }
    this.saveLocal(local);
    return pub;
  }

  public async deletePublisher(id: string) {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query('DELETE FROM congregazioni_publishers WHERE id = $1', [id]);
      } catch (e) {
        console.error('Error deleting publisher from Neon:', e);
      }
    }
    const local = this.readLocal();
    local.publishers = local.publishers.filter((p) => p.id !== id);
    this.saveLocal(local);
  }

  public async bulkSavePublishers(publishers: any[]) {
    for (const p of publishers) {
      await this.savePublisher(p);
    }
  }

  // ---------------- Privileges ----------------
  public async getPrivileges(): Promise<any[]> {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT * FROM congregazioni_privileges ORDER BY is_default DESC, code ASC');
        if (res.rows.length > 0) return res.rows;
      } catch (e) {
        console.error('Error getting privileges from Neon:', e);
      }
    }
    return this.readLocal().privileges || DEFAULT_PRIVILEGES;
  }

  public async savePrivilege(priv: any): Promise<any> {
    const id = priv.id || `priv-${Date.now()}`;
    const code = priv.code.toUpperCase().trim();
    const item = {
      id,
      code,
      label: priv.label.trim(),
      color: priv.color || '#3b82f6',
      is_default: !!priv.is_default
    };

    await this.ensureInit();

    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO congregazioni_privileges (id, code, label, color, is_default)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (code) DO UPDATE SET label = $3, color = $4`,
          [id, code, item.label, item.color, item.is_default]
        );
      } catch (e) {
        console.error('Error saving privilege to Neon:', e);
      }
    }

    const local = this.readLocal();
    const idx = (local.privileges || []).findIndex((p) => p.code === code);
    if (idx >= 0) {
      local.privileges[idx] = item;
    } else {
      local.privileges = [...(local.privileges || DEFAULT_PRIVILEGES), item];
    }
    this.saveLocal(local);
    return item;
  }

  public async deletePrivilege(code: string) {
    await this.ensureInit();
    if (this.isNeonConnected && this.pgPool) {
      try {
        await this.pgPool.query('DELETE FROM congregazioni_privileges WHERE code = $1', [code]);
      } catch (e) {
        console.error('Error deleting privilege from Neon:', e);
      }
    }
    const local = this.readLocal();
    local.privileges = (local.privileges || []).filter((p) => p.code !== code);
    this.saveLocal(local);
  }
}

export const db = new DatabaseService();

// ----------------------------------------------------
// EXPRESS APP & API ROUTER
// ----------------------------------------------------
export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper auth middleware
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Accesso non autorizzato. Effettua il login.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Sessione scaduta o non valida. Riconnettiti.' });
    return;
  }
};

const router = express.Router();

// ---------------- AUTH ROUTES ----------------
router.get('/auth/status', async (req, res) => {
  try {
    const user = await db.getUser();
    res.json({
      isInitialized: !!user,
      username: user ? user.username : null,
      dbStatus: await db.getStatus()
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auth/setup', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password || password.length < 4) {
      res.status(400).json({ error: 'Username e Password (minimo 4 caratteri) obbligatori.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    await db.setUser(username.trim(), password_hash);

    const token = jwt.sign({ username: username.trim() }, JWT_SECRET, { expiresIn: '90d' });
    res.json({
      success: true,
      message: 'Account configurato con successo!',
      token,
      username: username.trim()
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auth/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await db.getUser();

    if (!user) {
      res.status(404).json({ error: 'Nessun utente configurato. Effettua prima la configurazione iniziale.' });
      return;
    }

    const matchUser = user.username.toLowerCase() === (username || '').trim().toLowerCase();
    const matchPass = await bcrypt.compare(password || '', user.password_hash);

    if (!matchUser || !matchPass) {
      res.status(401).json({ error: 'Credenziali errate. Username o password non corretti.' });
      return;
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '90d' });
    res.json({
      success: true,
      token,
      username: user.username
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint per reimpostare/modificare password direttamente
router.post('/auth/reset-password', async (req, res): Promise<void> => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !username.trim()) {
      res.status(400).json({ error: 'Inserisci il tuo username.' });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ error: 'La nuova password deve contenere almeno 4 caratteri.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await db.setUser(username.trim(), password_hash);

    const token = jwt.sign({ username: username.trim() }, JWT_SECRET, { expiresIn: '90d' });
    res.json({
      success: true,
      message: 'Password modificata con successo!',
      token,
      username: username.trim()
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auth/change-credentials', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const user = await db.getUser();
    if (!user) {
      res.status(400).json({ error: 'Utente non trovato.' });
      return;
    }

    // Se fornita una password corrente, verificala (opzionale per l'utente già autenticato)
    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        res.status(401).json({ error: 'La password attuale inserita non è corretta.' });
        return;
      }
    }

    const targetUsername = newUsername ? newUsername.trim() : user.username;
    let targetHash = user.password_hash;
    if (newPassword && newPassword.length >= 4) {
      const salt = await bcrypt.genSalt(10);
      targetHash = await bcrypt.hash(newPassword, salt);
    }

    await db.setUser(targetUsername, targetHash);
    const token = jwt.sign({ username: targetUsername }, JWT_SECRET, { expiresIn: '90d' });

    res.json({
      success: true,
      message: 'Credenziali aggiornate con successo!',
      token,
      username: targetUsername
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- NEON POSTGRES SYNC ----------------
router.get('/neon/status', async (req, res) => {
  res.json(await db.getStatus());
});

router.post('/neon/connect', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { connectionString } = req.body;
    if (!connectionString) {
      res.status(400).json({ error: 'Stringa di connessione Neon PostgreSQL obbligatoria.' });
      return;
    }

    const result = await db.connectNeon(connectionString.trim(), true);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Impossibile connettersi al database Neon.' });
      return;
    }

    res.json({
      success: true,
      message: 'Connessione a Neon PostgreSQL completata e dati sincronizzati!',
      status: await db.getStatus()
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- CONGREGATIONS ROUTES ----------------
router.get('/congregations', authMiddleware, async (req, res) => {
  try {
    const congregations = await db.getCongregations();
    res.json(congregations);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/congregations', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { name, city, address, notes, id } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Il nome della congregazione è obbligatorio.' });
      return;
    }
    const saved = await db.saveCongregation({ id, name: name.trim(), city, address, notes });
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/congregations/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteCongregation(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- PUBLISHERS ROUTES ----------------
router.get('/publishers', authMiddleware, async (req, res) => {
  try {
    const publishers = await db.getPublishers();
    res.json(publishers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/publishers', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { first_name, last_name, congregation_id } = req.body;
    if (!first_name || !last_name || !congregation_id) {
      res.status(400).json({ error: 'Nome, Cognome e Congregazione sono obbligatori.' });
      return;
    }
    const saved = await db.savePublisher(req.body);
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/publishers/:id', authMiddleware, async (req, res) => {
  try {
    await db.deletePublisher(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk CSV Import
router.post('/publishers/bulk-import', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { publishers } = req.body;
    if (!Array.isArray(publishers) || publishers.length === 0) {
      res.status(400).json({ error: 'Nessun dato da importare ricevuto.' });
      return;
    }

    const congs = await db.getCongregations();
    const congMap = new Map<string, string>();
    congs.forEach((c) => congMap.set(c.name.toLowerCase().trim(), c.id));

    const processed: any[] = [];
    for (const item of publishers) {
      if (!item.first_name || !item.last_name) continue;

      let congId = item.congregation_id;
      if (!congId && item.congregation_name) {
        const key = item.congregation_name.toLowerCase().trim();
        if (congMap.has(key)) {
          congId = congMap.get(key);
        } else {
          const newCong = await db.saveCongregation({ name: item.congregation_name.trim() });
          congId = newCong.id;
          congMap.set(key, congId);
        }
      }
      if (!congId && congs.length > 0) {
        congId = congs[0].id;
      }

      let calculatedAge = item.age ? parseInt(item.age) : null;
      if (!calculatedAge && item.birth_date) {
        const birth = new Date(item.birth_date);
        if (!isNaN(birth.getTime())) {
          const diff = Date.now() - birth.getTime();
          calculatedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        }
      }

      // Check for existing publisher to prevent duplicates
      const allPubs = await db.getPublishers();
      const existing = allPubs.find((p) => 
        p.first_name.toLowerCase() === item.first_name.trim().toLowerCase() && 
        p.last_name.toLowerCase() === item.last_name.trim().toLowerCase()
      );

      processed.push({
        id: existing ? existing.id : undefined,
        congregation_id: congId,
        first_name: item.first_name.trim(),
        last_name: item.last_name.trim(),
        birth_date: item.birth_date || '',
        age: calculatedAge,
        gender: item.gender || 'M',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        privilege_codes: (item.privilege_codes || item.privilegio || '').toUpperCase().trim(),
        is_active: item.is_active !== false,
        notes: item.notes || ''
      });
    }

    await db.bulkSavePublishers(processed);
    res.json({
      success: true,
      count: processed.length,
      message: `${processed.length} proclamatori importati con successo!`
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- PRIVILEGES ROUTES ----------------
router.get('/privileges', authMiddleware, async (req, res) => {
  try {
    const privileges = await db.getPrivileges();
    res.json(privileges);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/privileges', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { code, label, color } = req.body;
    if (!code || !label) {
      res.status(400).json({ error: 'Sigla e descrizione del privilegio sono obbligatorie.' });
      return;
    }
    const saved = await db.savePrivilege(req.body);
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/privileges/:code', authMiddleware, async (req, res) => {
  try {
    await db.deletePrivilege(req.params.code);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- STATS ROUTE ----------------
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [publishers, congregations, privileges] = await Promise.all([
      db.getPublishers(),
      db.getCongregations(),
      db.getPrivileges()
    ]);

    const totalPersons = publishers.length;
    const totalCongregations = congregations.length;

    const ages = publishers.map((p) => p.age).filter((a) => typeof a === 'number' && !isNaN(a) && a > 0);
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length) : 0;

    const privilegeCounts: Record<string, number> = {};
    privileges.forEach((p) => {
      privilegeCounts[p.code] = 0;
    });

    publishers.forEach((pub) => {
      if (!pub.privilege_codes) return;
      const codes = pub.privilege_codes.split(',').map((c: string) => c.trim().toUpperCase());
      codes.forEach((code: string) => {
        privilegeCounts[code] = (privilegeCounts[code] || 0) + 1;
      });
    });

    const congregationStats = congregations.map((c) => {
      const congPubs = publishers.filter((p) => p.congregation_id === c.id);
      const counts: Record<string, number> = {};
      congPubs.forEach((p) => {
        if (!p.privilege_codes) return;
        const codes = p.privilege_codes.split(',').map((code: string) => code.trim().toUpperCase());
        codes.forEach((code: string) => {
          counts[code] = (counts[code] || 0) + 1;
        });
      });

      const congAges = congPubs.map((p) => p.age).filter((a) => typeof a === 'number' && a > 0);
      const congAvgAge = congAges.length > 0 ? Math.round(congAges.reduce((sum, a) => sum + a, 0) / congAges.length) : 0;

      return {
        id: c.id,
        name: c.name,
        city: c.city,
        address: c.address,
        publishersCount: congPubs.length,
        averageAge: congAvgAge,
        privilegeCounts: counts
      };
    });

    res.json({
      totalPersons,
      totalCongregations,
      averageAge,
      privilegeCounts,
      congregationStats
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Mount router on both /api and / so all Vercel and local requests work regardless of rewriting
app.use('/api', router);
app.use('/', router);

export default app;
