// @ts-nocheck
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Configurações básicas de CORS
app.use(cors({
  origin: ['https://souconcursado-theta.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Rota de Health integrada (sem dependências)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    engine: 'CommonJS',
    timestamp: new Date().toISOString() 
  });
});

// Lazy loading para evitar crash de inicialização no banco de dados
app.use('/api', async (req, res, next) => {
  try {
    // Roteamento manual para as rotas existentes
    if (req.path.startsWith('/auth')) {
      const authRoutes = require('./routes/auth.routes');
      // Suporte para export default ou commonjs module.exports
      const router = authRoutes.default || authRoutes;
      return router(req, res, next);
    }
    if (req.path.startsWith('/exams')) {
      const examRoutes = require('./routes/exam.routes');
      const router = examRoutes.default || examRoutes;
      return router(req, res, next);
    }
    if (req.path.startsWith('/questions')) {
      const questionRoutes = require('./routes/question.routes');
      const router = questionRoutes.default || questionRoutes;
      return router(req, res, next);
    }
    next();
  } catch (error) {
    console.error('Lazy Route Error:', error);
    res.status(500).json({ error: 'Failed to load module', detail: error.message });
  }
});

// Prevenção de Listen na Vercel (Crash de porta)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
