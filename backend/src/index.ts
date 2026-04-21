// Removed dotenv.config() for Vercel production

import express from 'express';
import cors from 'cors';
import prisma from './utils/prisma';
import authRoutes from './routes/auth.routes';
import questionRoutes from './routes/question.routes';
import flashcardRoutes from './routes/flashcard.routes';
import planRoutes from './routes/plan.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Diagnostic Routes (Before complex routes)
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test-db', async (req: any, res: any) => {
  try {
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const hasDirect = !!process.env.DIRECT_URL;
    const hasPooled = !!process.env.DATABASE_URL;

    const result = await prisma.$queryRaw`SELECT 1 as result`;
    res.json({ 
      success: true, 
      message: 'Database connection successful', 
      env: {
        hasDirect,
        hasPooled,
        using: hasDirect ? 'DIRECT_URL' : 'DATABASE_URL'
      },
      result 
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      env: {
        hasDirect: !!process.env.DIRECT_URL,
        hasPooled: !!process.env.DATABASE_URL
      },
      error: error.message,
      stack: error.stack
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/plans', planRoutes);

app.get("/api/questions", authMiddleware, questionController.getQuestions);
app.get("/api/questions/adaptive", authMiddleware, questionController.getAdaptiveQuestion);
app.post("/api/questions/submit", authMiddleware, questionController.submitAnswer);
app.get("/api/exams", authMiddleware, questionController.getExams);
app.post("/api/exams/sync", authMiddleware, questionController.syncExams);
app.get("/api/flashcards/due", authMiddleware, flashcardController.getFlashcards);
app.get("/api/flashcards/all", authMiddleware, flashcardController.getAllFlashcards);
app.get("/api/flashcards/stats", authMiddleware, flashcardController.getFlashcardStats);
app.patch("/api/flashcards/review", authMiddleware, flashcardController.updateFlashcard);
app.post("/api/flashcards", authMiddleware, flashcardController.createFlashcard);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
