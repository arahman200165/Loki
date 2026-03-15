import { ensureAuthSchema } from './initAuthSchema.js';
import { closePool } from './pool.js';

const run = async () => {
  try {
    await ensureAuthSchema();
    console.log('Database schema initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

void run();
