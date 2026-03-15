import { env } from '../config/env.js';
import { checkDatabaseConnection } from '../db/pool.js';

export const runHealthCheck = async () => {
  const payload = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  if (!env.databaseUrl) {
    payload.status = 'degraded';
    payload.database = {
      status: 'not_configured',
      message: 'DATABASE_URL is not configured.'
    };
    return { statusCode: 503, payload };
  }

  try {
    payload.database = await checkDatabaseConnection();
    return { statusCode: 200, payload };
  } catch (error) {
    payload.status = 'degraded';
    payload.database = {
      status: 'error',
      message: 'Database connectivity check failed.'
    };
    return { statusCode: 503, payload };
  }
};
