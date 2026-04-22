// @ts-nocheck
import { Router } from 'express';
import {
  generatePlan,
  getMyPlans,
  getPlanById,
  updatePlanProgress,
  syncPlanProgress,
} from '../controllers/plan.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/generate', authenticateToken, generatePlan);
router.get('/me', authenticateToken, getMyPlans);
router.get('/:id', authenticateToken, getPlanById);
router.patch('/:id', authenticateToken, updatePlanProgress);
router.post('/:id/sync', authenticateToken, syncPlanProgress);

export default router;
