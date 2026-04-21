import express from 'express';
import cors from 'cors';

const app = express();

// 1. HARD-CODED CORS (Bypass Middleware for Health)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://souconcursado-theta.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// 2. DIAGNOSTIC ROUTES (Absolute Priority - No DB dependency here)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0-SafeBoot' });
});

// 3. LAZY LOADING ROUTES (Prevent global crash on import)
// We use a safe try-catch wrapper for imports if needed, but for now just standard imports
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import questionRoutes from './routes/question.routes';
import planRoutes from './routes/plan.routes';
import flashcardRoutes from './routes/flashcard.routes';
import prisma from './utils/prisma';

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/flashcards', flashcardRoutes);

app.get('/api/test-db', async (req, res) => {
  try {
    const start = Date.now();
    // Using simple query to test connection
    const result = await (prisma as any).$queryRaw`SELECT 1 as connected`;
    const duration = Date.now() - start;
    res.json({ status: 'connected', duration: `${duration}ms`, result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
