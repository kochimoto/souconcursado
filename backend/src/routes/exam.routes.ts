// @ts-nocheck
import { Router } from 'express';
import { getExams, syncExams } from '../controllers/question.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Rota pública para visualização de concursos
router.get('/', getExams);

// Sincronização exige autenticação
router.post('/sync', authenticateToken, syncExams);

export default router;
