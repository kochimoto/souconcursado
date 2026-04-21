import dotenv from 'dotenv';
dotenv.config();

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
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    res.json({ success: true, message: 'Database connection successful', result });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/plans', planRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
