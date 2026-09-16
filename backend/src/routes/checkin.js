import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { recordCheckIn, getCheckInStatus } from '../services/checkinService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/checkin
 * Record a manual check-in
 */
router.post('/', async (req, res, next) => {
  try {
    const checkin = await recordCheckIn(req.user.id, 'manual');
    res.json({
      success: true,
      checkin,
      message: 'Check-in recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkin/status
 * Get current check-in status
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await getCheckInStatus(req.user.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;
