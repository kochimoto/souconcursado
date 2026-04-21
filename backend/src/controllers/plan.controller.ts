import express from 'express';
import prisma from '../utils/prisma';
import {
  computeSubjectPriority,
  buildWeeklySchedule,
  checkLevelUp,
  computeSubjectStats,
} from '../services/studyPlanEngine';

export const generatePlan = async (req: express.Request, res: express.Response) => {
  try {
    const { examId, hoursPerDay = 2 } = req.body;
    const userId = (req as any).user.id;

    // 1. Busca perfil completo do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subjectLevels: true,
        createdAt: true,
        attempts: {
          select: { subject: true, isCorrect: true, difficulty: true },
        },
        subjectStats: true,
      },
    });

    // 2. Busca concurso e suas questões
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      res.status(404).json({ message: 'Concurso não encontrado' });
      return;
    }

    // 3. Agrupa matérias do edital
    const subjectMap: Record<string, { subject: string; topics: Set<string>; count: number }> = {};
    exam.questions.forEach(q => {
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = { subject: q.subject, topics: new Set(), count: 0 };
      }
      if (q.topic) subjectMap[q.subject].topics.add(q.topic);
      subjectMap[q.subject].count++;
    });

    // Se o concurso não tem questões, usa matérias do campo subjects do edital
    const examSubjectsList = Object.values(subjectMap).length > 0
      ? Object.values(subjectMap).map(s => ({
          subject: s.subject,
          questionCount: s.count,
          topics: Array.from(s.topics),
        }))
      : ((exam.subjects as string[]) ?? []).map(s => ({
          subject: s,
          questionCount: 5,
          topics: [],
        }));

    // 4. Calcula estatísticas reais do usuário por matéria
    const realStats = computeSubjectStats(user?.attempts ?? []);
    const userSubjectStats = (user?.subjectStats ?? []).map((s: any) => ({
      subject: s.subject,
      totalAnswered: s.totalAnswered,
      totalCorrect: s.totalCorrect,
      currentLevel: s.currentLevel,
    }));

    // 5. Computa prioridade personalizada
    const userLevels = (user?.subjectLevels as Record<string, number>) ?? {};

    // Mescla nível declarado com nível real calculado
    const mergedLevels: Record<string, number> = { ...userLevels };
    for (const [subject, stat] of Object.entries(realStats)) {
      mergedLevels[subject] = Math.max(stat.level, userLevels[subject] ?? 1);
    }

    const priorities = computeSubjectPriority(mergedLevels, examSubjectsList, userSubjectStats);

    // 6. Gera cronograma semanal
    const weeklySchedule = buildWeeklySchedule(
      priorities,
      exam.examDate ?? exam.date ?? null,
      hoursPerDay
    );

    // 7. Monta contentBlocks com todos os dados necessários
    const contentBlocks = priorities.map(p => ({
      subject: p.subject,
      userLevel: p.userLevel,
      priority: p.priority,
      difficulty: p.difficulty,
      weeklyHours: p.weeklyHours,
      nextLevelThreshold: p.nextLevelThreshold,
      status: 'todo',
      hoursSpent: 0,
      correctAnswers: realStats[p.subject]?.correct ?? 0,
      totalAnswers: realStats[p.subject]?.total ?? 0,
    }));

    // 8. Salva o plano
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId,
        examId,
        contentBlocks: contentBlocks as any,
        weeklySchedule: weeklySchedule as any,
        status: 'ACTIVE',
        progress: 0,
      },
      include: { exam: true },
    });

    res.status(201).json(studyPlan);
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ message: 'Erro ao gerar plano de estudos' });
  }
};

export const getMyPlans = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user.id;
    const plans = await prisma.studyPlan.findMany({
      where: { userId },
      include: { exam: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar planos' });
  }
};

export const getPlanById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const plan = await prisma.studyPlan.findFirst({
      where: { id, userId },
      include: { exam: true },
    });

    if (!plan) {
      res.status(404).json({ message: 'Plano não encontrado' });
      return;
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar plano' });
  }
};

export const updatePlanProgress = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { contentBlocks, progress } = req.body;

    const updatedPlan = await prisma.studyPlan.update({
      where: { id },
      data: { 
        contentBlocks: contentBlocks as any, 
        progress: progress as any 
      },
    });

    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar plano' });
  }
};

export const syncPlanProgress = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const plan = await prisma.studyPlan.findFirst({
      where: { id, userId },
      include: { exam: { include: { questions: true } } },
    });

    if (!plan) {
      res.status(404).json({ message: 'Plano não encontrado' });
      return;
    }

    // Busca tentativas recentes do usuário
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      select: { subject: true, isCorrect: true, difficulty: true },
    });

    const realStats = computeSubjectStats(attempts);

    // Atualiza subjectStats no banco
    for (const [subject, stat] of Object.entries(realStats)) {
      await prisma.subjectStat.upsert({
        where: { userId_subject: { userId, subject } },
        update: {
          totalAnswered: stat.total,
          totalCorrect: stat.correct,
          currentLevel: stat.level,
        },
        create: {
          userId,
          subject,
          totalAnswered: stat.total,
          totalCorrect: stat.correct,
          currentLevel: stat.level,
        },
      });
    }

    // Verifica level-ups e atualiza contentBlocks
    const contentBlocks = (plan.contentBlocks as any[]).map(block => {
      const stat = realStats[block.subject];
      if (!stat) return block;

      const levelUpResult = checkLevelUp(stat.correct, stat.total, block.userLevel);

      return {
        ...block,
        correctAnswers: stat.correct,
        totalAnswers: stat.total,
        userLevel: levelUpResult.newLevel,
        difficulty: levelUpResult.leveled
          ? ['Fácil', 'Médio', 'Difícil'][levelUpResult.newLevel - 1]
          : block.difficulty,
        leveledUp: levelUpResult.leveled,
      };
    });

    // Calcula progresso geral
    const doneBlocks = contentBlocks.filter(b => b.status === 'done').length;
    const progress = contentBlocks.length > 0 ? (doneBlocks / contentBlocks.length) * 100 : 0;

    const updated = await prisma.studyPlan.update({
      where: { id },
      data: { contentBlocks, progress },
    });

    res.json({ plan: updated, levelUps: contentBlocks.filter(b => b.leveledUp) });
  } catch (error) {
    console.error('syncPlanProgress error:', error);
    res.status(500).json({ message: 'Erro ao sincronizar progresso' });
  }
};
