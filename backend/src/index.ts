import express from 'express';
import cors from 'cors';

// Safe Boot: Minimizar imports no topo para evitar crash de inicialização na Vercel
const app = express();

// Configurações básicas
app.use(cors({
  origin: ['https://souconcursado-theta.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// --- ROTAS DIAGNÓSTICAS (100% ISOLADAS) ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    isolated: true 
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const { default: prisma } = await import('./utils/prisma');
    await (prisma as any).$queryRaw`SELECT 1`;
    res.json({ status: 'connected', database: 'postgres' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// --- ROTEAMENTO LAZY (Carregamento sob demanda para evitar crash global) ---
app.use('/api/auth', async (req, res, next) => {
  try {
    const { default: router } = await import('./routes/auth.routes');
    router(req, res, next);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Auth module', detail: err.message });
  }
});

app.use('/api/exams', async (req, res, next) => {
  try {
    const { default: router } = await import('./routes/exam.routes');
    router(req, res, next);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Exams module', detail: err.message });
  }
});

app.use('/api/questions', async (req, res, next) => {
  try {
    const { default: router } = await import('./routes/question.routes');
    router(req, res, next);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Questions module', detail: err.message });
  }
});

app.use('/api/flashcards', async (req, res, next) => {
  try {
    const { default: router } = await import('./routes/flashcard.routes');
    router(req, res, next);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Flashcards module', detail: err.message });
  }
});

app.use('/api/plans', async (req, res, next) => {
  try {
    const { default: router } = await import('./routes/plan.routes');
    router(req, res, next);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load StudyPlan module', detail: err.message });
  }
});

// Fallback para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found in Souconcursado API' });
});

const PORT = process.env.PORT || 3001;
// CRITICAL: NEVER call app.listen() on Vercel as it crashes the Serverless Function
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[SERVER] Running isolated boot on port ${PORT}`);
  });
}

export default app;
