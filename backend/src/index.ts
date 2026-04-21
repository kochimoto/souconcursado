import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: 'https://souconcursado-theta.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Diagnostic Routes (Top Level - Resilience)
app.get('/api/health', (req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    team: 'Senior Master Team'
  });
});

import prisma from './utils/prisma';
import authRoutes from './routes/auth.routes';
import questionRoutes from './routes/question.routes';
import flashcardRoutes from './routes/flashcard.routes';
import planRoutes from './routes/plan.routes';
import examRoutes from './routes/exam.routes';

// Diagnostic Routes (Database)
app.get('/api/test-db', async (req: any, res: any) => {
  console.log('[DIAGNOSTIC] DB Test requested');
  try {
    const start = Date.now();
    const result = await (prisma as any).$queryRaw`SELECT 1 as result`;
    const duration = Date.now() - start;
    
    const count = await (prisma as any).exam.count();
    
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

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/exams', examRoutes);

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
