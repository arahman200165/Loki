import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import publicIdRoutes from './routes/publicIdRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { createOpenApiDocument } from './docs/openapi.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireApiKey } from './middleware/requireApiKey.js';
import { requireBrowserSession } from './middleware/requireBrowserSession.js';
import { asyncHandler } from './utils/asyncHandler.js';
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

app.get('/login', asyncHandler(renderLoginPage));
app.post('/login', asyncHandler(handleLoginPage));
app.get('/', asyncHandler(requireBrowserSession), renderProtectedHomePage);
app.post('/logout', asyncHandler(requireBrowserSession), asyncHandler(handleLogoutPage));
app.get(
  '/web/health-check',
  asyncHandler(requireBrowserSession),
  asyncHandler(handleWebHealthCheck)
);
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
app.use(`${env.apiPrefix}/public-id`, requireApiKey, publicIdRoutes);
app.use(`${env.apiPrefix}/contact-request`, requireApiKey, contactRoutes);
app.use(env.apiPrefix, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

