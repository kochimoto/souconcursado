import { Router } from 'express';
import {
  getFlashcards,
  getAllFlashcards,
  updateFlashcard,
  createFlashcard,
} from '../controllers/flashcard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/due', authenticateToken, getFlashcards);       // apenas vencidos (para revisão)
router.get('/', authenticateToken, getAllFlashcards);        // todos
router.post('/', authenticateToken, createFlashcard);       // criar novo
router.patch('/review', authenticateToken, updateFlashcard); // avaliar (SM-2)

export default router;
