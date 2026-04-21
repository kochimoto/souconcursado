import { Router } from 'express';
import { getExams, syncExams } from '../controllers/question.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de concursos exigem autenticação
router.use(authenticateToken);

router.get('/', getExams);
router.post('/sync', syncExams);

export default router;
