// @ts-nocheck
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check integrado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'self-contained',
    timestamp: new Date().toISOString()
  });
});

// Inicialização lazy das rotas para evitar crashes no boot
app.use('/api', async (req, res, next) => {
  try {
    const path = req.path;

    if (path.startsWith('/auth')) {
      const { router } = await require('../src/routes/auth.routes');
      return (router || (await import('../src/routes/auth.routes')).default)(req, res, next);
    }
    if (path.startsWith('/exams')) {
      const mod = require('../src/routes/exam.routes');
      return (mod.default || mod)(req, res, next);
    }
    if (path.startsWith('/questions')) {
      const mod = require('../src/routes/question.routes');
      return (mod.default || mod)(req, res, next);
    }
    if (path.startsWith('/flashcards')) {
      const mod = require('../src/routes/flashcard.routes');
      return (mod.default || mod)(req, res, next);
    }
    if (path.startsWith('/plans')) {
      const mod = require('../src/routes/plan.routes');
      return (mod.default || mod)(req, res, next);
    }

    next();
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal error', detail: String(error) });
  }
});

module.exports = app;
