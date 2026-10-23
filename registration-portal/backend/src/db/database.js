import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'portal.db');
logger.info(`Initializing SQLite database at: ${dbPath}`);

export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and resilience
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    company TEXT,
    consent INTEGER NOT NULL DEFAULT 1,
    consent_timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered',
    contact_status TEXT NOT NULL DEFAULT 'pending',
    message_status TEXT NOT NULL DEFAULT 'pending',
    call_status TEXT NOT NULL DEFAULT 'pending',
    autocomm_contact_id TEXT,
    autocomm_message_id TEXT,
    autocomm_call_id TEXT,
    last_error TEXT,
    last_failed_step TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
  CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
  CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

  CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER,
    event_type TEXT NOT NULL,
    raw_payload TEXT,
    status TEXT,
    created_at TEXT NOT NULL
  );
`);

logger.info('SQLite schema initialized successfully');
