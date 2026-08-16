import * as SQLite from 'expo-sqlite';

// The single SQLite database file for the app.
// It lives entirely on the device — nothing is sent to any server.
const DB_NAME = 'loki-messages.db';

let _db: SQLite.SQLiteDatabase | null = null;

// Opens the database and creates tables if they don't exist yet.
// Called once at app start, then the same connection is reused everywhere.
export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL mode makes reads and writes faster when they happen at the same time.
  // It's a standard SQLite performance setting, recommended for mobile apps.
  await _db.execAsync('PRAGMA journal_mode = WAL;');

  // messages table — one row per message in every conversation
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id               TEXT PRIMARY KEY,
      contact_public_id TEXT NOT NULL,
      envelope_id      TEXT UNIQUE,
      ciphertext       BLOB NOT NULL,
      sent_by_me       INTEGER NOT NULL DEFAULT 0,
      timestamp        TEXT NOT NULL,
      expires_at       TEXT
    );
  `);

  // This index makes loading a conversation fast.
  // Without it, every fetch would scan the entire table.
  // With it, SQLite jumps straight to the rows for that contact, ordered by time.
  await _db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_messages_contact_time
      ON messages (contact_public_id, timestamp);
  `);

  return _db;
};

// Closes the database connection — called during app shutdown.
export const closeDb = async (): Promise<void> => {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
};
