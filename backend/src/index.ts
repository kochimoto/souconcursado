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
