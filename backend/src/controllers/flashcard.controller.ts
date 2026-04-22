// @ts-nocheck
import express from 'express';
import prisma from '../utils/prisma';

export const getFlashcards = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const now = new Date();

    const flashcards = await (prisma as any).flashcard.findMany({
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

export const getAllFlashcards = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;

    const flashcards = await (prisma as any).flashcard.findMany({
      where: { userId },
      include: { question: true },
      orderBy: { nextReview: 'asc' },
    });

    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all flashcards' });
  }
};

export const updateFlashcard = async (req: express.Request, res: express.Response) => {
  try {
    const { id, rating } = req.body;

    const flashcard = await (prisma as any).flashcard.findUnique({ where: { id: String(id) } });
    if (!flashcard) return res.status(404).json({ message: 'Flashcard not found' });

    let { interval, easeFactor, reps } = flashcard;

    if (rating === 'easy') {
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * easeFactor);
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    } else if (rating === 'medium') {
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 4 : Math.round(interval * (easeFactor - 0.15));
    } else {
      reps = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.max(1, interval));

    const updated = await (prisma as any).flashcard.update({
      where: { id: String(id) },
      data: { 
        interval, 
        easeFactor, 
        reps, 
        nextReview,
        lastReviewedAt: new Date()
      },
    });

    res.json({ ...updated, nextReviewDays: Math.max(1, interval) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating flashcard' });
  }
};

export const getFlashcardStats = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayReviews = await (prisma as any).flashcard.count({
      where: {
        userId,
        lastReviewedAt: { gte: startOfDay },
      },
    });

    const totalCards = await (prisma as any).flashcard.count({
      where: { userId },
    });

    res.json({ todayReviews, dailyGoal: 30, totalCards });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

export const createFlashcard = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { cardType, front, back, clozeText, clozeAnswers, questionId } = req.body;

    const flashcard = await (prisma as any).flashcard.create({
      data: {
        userId,
        cardType: cardType ?? 'classic',
        front,
        back,
        clozeText,
        clozeAnswers: (clozeAnswers as any) || [],
        questionId,
      },
    });

    res.status(201).json(flashcard);
  } catch (error) {
    res.status(500).json({ message: 'Error creating flashcard' });
  }
};
