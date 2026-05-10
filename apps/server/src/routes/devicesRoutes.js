import { Router } from 'express';
import {
  approveLinkSession,
  completeLinkSession,
  denyLinkSession,
  getLinkStatus,
  listDevices,
  resolveLinkSession,
  revokeDeviceById,
  startLinkSession,
  updateDeviceSecurityState
} from '../controllers/devicesController.js';
import { requireSessionAuth } from '../middleware/requireSessionAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(requireSessionAuth), asyncHandler(listDevices));
router.delete('/:deviceId', asyncHandler(requireSessionAuth), asyncHandler(revokeDeviceById));
router.post('/link/start', asyncHandler(startLinkSession));
router.post('/link/resolve', asyncHandler(requireSessionAuth), asyncHandler(resolveLinkSession));
router.post('/link/approve', asyncHandler(requireSessionAuth), asyncHandler(approveLinkSession));
router.post('/link/deny', asyncHandler(requireSessionAuth), asyncHandler(denyLinkSession));
router.get('/link/status', asyncHandler(getLinkStatus));
router.post('/link/complete', asyncHandler(completeLinkSession));
router.post(
  '/:deviceId/security-state',
  asyncHandler(requireSessionAuth),
  asyncHandler(updateDeviceSecurityState)
);

export default router;
