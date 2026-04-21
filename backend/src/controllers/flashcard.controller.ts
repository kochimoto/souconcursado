import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getFlashcards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const now = new Date();

    const flashcards = await prisma.flashcard.findMany({
      where: {
        userId,
        nextReview: { lte: now },
      },
      include: { question: true },
      orderBy: { nextReview: 'asc' },
    });

    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flashcards' });
  }
};

export const getAllFlashcards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;

    const flashcards = await prisma.flashcard.findMany({
      where: { userId },
      include: { question: true },
      orderBy: { nextReview: 'asc' },
    });

    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all flashcards' });
  }
};

export const updateFlashcard = async (req: Request, res: Response) => {
  try {
    const { id, rating } = req.body; // rating: 'easy' | 'medium' | 'hard'

    const flashcard = await prisma.flashcard.findUnique({ where: { id } });
    if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });

    let { interval, easeFactor, reps } = flashcard;

    // Algoritmo SM-2 completo
    if (rating === 'easy') {
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * easeFactor);
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    } else if (rating === 'medium') {
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 4 : Math.round(interval * (easeFactor - 0.15));
      // easeFactor não muda para 'medium'
    } else {
      // hard — reinicia
      reps = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.max(1, interval));

    const updated = await prisma.flashcard.update({
      where: { id },
      data: { interval, easeFactor, reps, nextReview },
    });

    res.json({ ...updated, nextReviewDays: Math.max(1, interval) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating flashcard' });
  }
};

export const createFlashcard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const { cardType, front, back, clozeText, clozeAnswers, questionId } = req.body;

    const flashcard = await prisma.flashcard.create({
      data: {
        userId,
        cardType: cardType ?? 'classic',
        front,
        back,
        clozeText,
        clozeAnswers,
        questionId,
      },
    });

    res.status(201).json(flashcard);
  } catch (error) {
    res.status(500).json({ message: 'Error creating flashcard' });
  }
};
