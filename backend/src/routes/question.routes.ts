import { Router } from 'express';
import {
  getQuestions,
  getExams,
  submitAttempt,
  getSubjectStats,
} from '../controllers/question.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getQuestions);
router.get('/exams', getExams);
router.get('/stats', authenticateToken, getSubjectStats);
router.post('/attempt', authenticateToken, submitAttempt);

export default router;
