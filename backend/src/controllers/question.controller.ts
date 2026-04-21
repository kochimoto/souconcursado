import { generateAdaptiveQuestion } from '../services/aiService';
import { syncExamsFromPCI } from '../services/examMonitorService';

export const syncExams = async (req: express.Request, res: express.Response) => {
  try {
    const result = await syncExamsFromPCI();
    res.json({ message: 'Sincronização concluída', count: result.count });
  } catch (error) {
    console.error('Erro no syncExams:', error);
    res.status(500).json({ message: 'Falha na sincronização de concursos' });
  }
};

export const getAdaptiveQuestion = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const { topic } = req.query;

    // Buscar nível do usuário (simulado ou do perfil)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userLevel = (user as any)?.level || 1;

    const aiQuestion = await generateAdaptiveQuestion(userLevel, topic as string || 'Direito Constitucional');

    // Encontrar o índice da resposta correta
    const correctOptionIndex = aiQuestion.options.findIndex((opt: string) => opt === aiQuestion.correctAnswer);

    const savedQuestion = await prisma.question.create({
      data: {
        title: aiQuestion.title,
        content: aiQuestion.content,
        options: aiQuestion.options,
        correctAnswer: aiQuestion.correctAnswer, 
        explanation: aiQuestion.explanation,
        difficulty: aiQuestion.difficulty,
        subject: aiQuestion.subject,
      }
    });

    // Retorna com os campos esperados pelo frontend
    res.json({
      ...savedQuestion,
      text: savedQuestion.content, // Frontend espera 'text'
      correctOption: correctOptionIndex === -1 ? 0 : correctOptionIndex // Frontend espera 'correctOption'
    });
  } catch (error) {
    console.error('Erro em getAdaptiveQuestion:', error);
    res.status(500).json({ message: 'Falha ao gerar questão adaptativa' });
  }
};

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

export const getExams = async (req: express.Request, res: express.Response) => {
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

export const submitAttempt = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const { questionId, chosenOption } = req.body;

    const question = await prisma.question.findUnique({ where: { id: String(questionId) } });
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

export const getSubjectStats = async (req: express.Request, res: express.Response) => {
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
