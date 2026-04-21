import express from 'express';
import prisma from '../utils/prisma';

export const getQuestions = async (req: express.Request, res: express.Response) => {
  try {
    const { subject, examId, difficulty, limit = '20', offset = '0' } = req.query;

    const questions = await prisma.question.findMany({
      where: {
        ...(subject && { subject: String(subject) }),
        ...(examId && { examId: String(examId) }),
        ...(difficulty && { difficulty: String(difficulty) }),
      },
      include: { exam: true },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
    });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions' });
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    const { state, area, level, status } = req.query;

    const exams = await prisma.exam.findMany({
      where: {
        ...(state && state !== 'Todos' && { state: String(state) }),
        ...(area && area !== 'Todos' && { area: String(area) }),
        ...(level && level !== 'Todos' && { level: String(level) }),
        ...(status && status !== 'Todos' && { status: String(status) }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(exams);
  } catch (error) {
    console.error('Erro ao buscar concursos:', error);
    res.status(500).json({ message: 'Error fetching exams' });
  }
};

export const submitAttempt = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const { questionId, chosenOption } = req.body;

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isCorrect = question.correctOption === chosenOption;

    const attempt = await prisma.attempt.create({
      data: {
        userId,
        questionId,
        chosenOption,
        isCorrect,
        subject: question.subject,
        difficulty: question.difficulty,
      },
    });

    // Atualiza XP e rankingPoints
    if (isCorrect) {
      const xpGain = question.difficulty === 'Difícil' ? 20 : question.difficulty === 'Médio' ? 15 : 10;
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpGain },
          rankingPoints: { increment: Math.floor(xpGain / 2) },
        },
      });
    }

    // Atualiza SubjectStat em tempo real
    await prisma.subjectStat.upsert({
      where: { userId_subject: { userId, subject: question.subject } },
      update: {
        totalAnswered: { increment: 1 },
        ...(isCorrect && { totalCorrect: { increment: 1 } }),
      },
      create: {
        userId,
        subject: question.subject,
        totalAnswered: 1,
        totalCorrect: isCorrect ? 1 : 0,
        currentLevel: 1,
      },
    });

    res.json({ attempt, isCorrect, explanation: question.explanation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting attempt' });
  }
};

export const getSubjectStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;

    const stats = await prisma.subjectStat.findMany({
      where: { userId },
      orderBy: { totalAnswered: 'desc' },
    });

    // Calcula taxa de acerto e nível dinâmico
    const enriched = stats.map(s => ({
      subject: s.subject,
      totalAnswered: s.totalAnswered,
      totalCorrect: s.totalCorrect,
      accuracy: s.totalAnswered > 0 ? Math.round((s.totalCorrect / s.totalAnswered) * 100) : 0,
      currentLevel: s.currentLevel,
      levelLabel: s.currentLevel === 1 ? 'Iniciante' : s.currentLevel === 2 ? 'Intermediário' : 'Avançado',
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject stats' });
  }
};
