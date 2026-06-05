import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import { createOpenApiDocument } from './docs/openapi.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireApiKey } from './middleware/requireApiKey.js';
import { requireBrowserSession } from './middleware/requireBrowserSession.js';
import {
  renderLoginPage,
  handleLoginPage,
  renderProtectedHomePage,
  handleLogoutPage,
  handleWebHealthCheck
} from './controllers/webAuthController.js';

const app = express();
const openApiDocument = createOpenApiDocument({
  apiPrefix: env.apiPrefix,
  apiKeyHeader: env.apiKeyHeader
});

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/login', renderLoginPage);
app.post('/login', handleLoginPage);
app.get('/', requireBrowserSession, renderProtectedHomePage);
app.post('/logout', requireBrowserSession, handleLogoutPage);
app.get('/web/health-check', requireBrowserSession, handleWebHealthCheck);
app.get(`${env.apiPrefix}/docs.json`, (req, res) => res.status(200).json(openApiDocument));
app.use(
  `${env.apiPrefix}/docs`,
  (req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: 'Loki Swagger',
    swaggerOptions: {
      displayRequestDuration: true,
      persistAuthorization: true
    }
  })
);

app.use(`${env.apiPrefix}/auth`, requireApiKey, authRoutes);
app.use(env.apiPrefix, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

