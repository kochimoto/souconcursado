// Removed dotenv.config() for Vercel production

import express from 'express';
import cors from 'cors';
import prisma from './utils/prisma';
import authRoutes from './routes/auth.routes';
import questionRoutes from './routes/question.routes';
import flashcardRoutes from './routes/flashcard.routes';
import planRoutes from './routes/plan.routes';
import examRoutes from './routes/exam.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Diagnostic Routes (Before complex routes)
app.get('/api/health', (req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api/test-db', async (req: any, res: any) => {
  console.log('[DIAGNOSTIC] DB Test requested');
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    const duration = Date.now() - start;
    
    const count = await prisma.exam.count();
    
    res.json({ 
      success: true, 
      message: 'Database connection successful', 
      duration: `${duration}ms`,
      examsCount: count,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL
      }
    });
  } catch (error: any) {
    console.error('[DIAGNOSTIC] DB Test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message,
      code: error.code
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/exams', examRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
