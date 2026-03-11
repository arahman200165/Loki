import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireApiKey } from './middleware/requireApiKey.js';
import { requireSessionAuth } from './middleware/requireSessionAuth.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Backend scaffold is running.',
    docs: {
      health: `${env.apiPrefix}/health`,
      authRegister: `${env.apiPrefix}/auth/register`,
      authLogin: `${env.apiPrefix}/auth/login`
    }
  });
});

app.use(`${env.apiPrefix}/auth`, requireApiKey, authRoutes);
app.use('/api', requireApiKey, requireSessionAuth);
app.use(env.apiPrefix, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;