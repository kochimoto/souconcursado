// @ts-nocheck
import {
  getFlashcards,
  getAllFlashcards,
  updateFlashcard,
  createFlashcard,
  getFlashcardStats,
} from '../controllers/flashcard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/due', authenticateToken, getFlashcards);
router.get('/stats', authenticateToken, getFlashcardStats);
router.get('/', authenticateToken, getAllFlashcards);
router.post('/', authenticateToken, createFlashcard);
router.patch('/review', authenticateToken, updateFlashcard);

export default router;
