import { Router } from 'express';
import {
  getQuestions,
  submitAttempt,
  getSubjectStats,
  getAdaptiveQuestion,
} from '../controllers/question.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getQuestions);
router.get('/adaptive', authenticateToken, getAdaptiveQuestion);
router.get('/stats', authenticateToken, getSubjectStats);
router.post('/attempt', authenticateToken, submitAttempt);

export default router;
