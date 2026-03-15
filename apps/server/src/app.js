import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireApiKey } from './middleware/requireApiKey.js';
import { requireBrowserSession } from './middleware/requireBrowserSession.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import {
  renderLoginPage,
  handleLoginPage,
  renderProtectedHomePage,
  handleLogoutPage,
  handleWebHealthCheck
} from './controllers/webAuthController.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/login', asyncHandler(renderLoginPage));
app.post('/login', asyncHandler(handleLoginPage));
app.use('/web/assets', requireBrowserSession, express.static(path.join(__dirname, 'public', 'web')));
app.get('/', requireBrowserSession, asyncHandler(renderProtectedHomePage));
app.post('/logout', requireBrowserSession, asyncHandler(handleLogoutPage));
app.get('/web/health-check', requireBrowserSession, asyncHandler(handleWebHealthCheck));

app.use(env.apiPrefix, requireApiKey, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

