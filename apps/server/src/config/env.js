import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  apiKey: process.env.API_KEY || 'dev-mobile-api-key',
  apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
  authUsername: process.env.AUTH_USERNAME || 'loki-admin',
  authPassword: process.env.AUTH_PASSWORD || 'loki-pass-123'
};
