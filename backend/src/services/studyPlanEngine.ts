// Study Plan Engine — algoritmo de personalização e progressão

export interface SubjectPriority {
  subject: string;
  userLevel: number; // 1-3
  priority: number;  // 0-100
  weeklyHours: number;
  difficulty: string;
  nextLevelThreshold: number; // acertos necessários para subir de nível
}

export interface WeeklyBlock {
  week: number;
  subject: string;
  hours: number;
  targetDifficulty: string;
}

export interface LevelUpResult {
  leveled: boolean;
  newLevel: number;
  subject: string;
}

// Mapeia dificuldade de questões por nível do usuário
export const DIFFICULTY_MAP: Record<number, string> = {
  1: 'Fácil',
  2: 'Médio',
  3: 'Difícil',
};

// Acertos necessários (com taxa > 70%) para subir de nível
const LEVEL_THRESHOLDS = {
  1: 10, // 10 questões fáceis com 70%+ → vai para intermediário
  2: 15, // 15 questões médias com 70%+ → vai para avançado
  3: 999, // nível máximo
};

/**
 * Calcula prioridade de cada matéria baseado no nível do usuário e frequência no edital.
 * Matérias com nível mais baixo e mais questões no edital recebem maior prioridade.
 */
export function computeSubjectPriority(
  subjectLevels: Record<string, number>,
  examSubjects: Array<{ subject: string; questionCount: number; topics: string[] }>,
  subjectStats: Array<{ subject: string; totalAnswered: number; totalCorrect: number; currentLevel: number }> = []
): SubjectPriority[] {
  const totalQuestions = examSubjects.reduce((acc, s) => acc + s.questionCount, 0);
  const statsMap: Record<string, typeof subjectStats[0]> = {};
  subjectStats.forEach(s => { statsMap[s.subject] = s; });

  return examSubjects.map(s => {
    const declaredLevel = subjectLevels[s.subject] ?? 1;
    const stat = statsMap[s.subject];
    
    // Se tiver histórico real, usa o nível calculado; senão, usa o declarado
    const effectiveLevel = stat ? stat.currentLevel : declaredLevel;
    
    // Peso por frequência no edital (matérias com mais questões = maior importância)
    const frequencyWeight = (s.questionCount / totalQuestions) * 100;
    
    // Peso inversamente proporcional ao nível (iniciante precisa de mais atenção)
    const levelWeight = (4 - effectiveLevel) * 25; // 1→75, 2→50, 3→25
    
    const priority = Math.round((frequencyWeight * 0.5) + (levelWeight * 0.5));
    
    // Horas semanais mínimas baseadas na prioridade (1-5 horas)
    const weeklyHours = Math.max(1, Math.round(priority / 25));
    
    return {
      subject: s.subject,
      userLevel: effectiveLevel,
      priority,
      weeklyHours,
      difficulty: DIFFICULTY_MAP[effectiveLevel] || 'Fácil',
      nextLevelThreshold: LEVEL_THRESHOLDS[effectiveLevel as keyof typeof LEVEL_THRESHOLDS] ?? 10,
    };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Gera o cronograma semanal distribuindo matérias até a data da prova.
 */
export function buildWeeklySchedule(
  priorityMap: SubjectPriority[],
  examDate: Date | null,
  hoursPerDay: number = 2
): WeeklyBlock[] {
  const now = new Date();
  const target = examDate ?? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 dias default
  const daysUntilExam = Math.max(7, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalWeeks = Math.ceil(daysUntilExam / 7);

  const schedule: WeeklyBlock[] = [];

  for (let week = 1; week <= totalWeeks; week++) {
    // Alterna prioridade: nas primeiras semanas foca nos mais prioritários
    const weekRatio = week / totalWeeks;
    
    for (const subj of priorityMap) {
      // Ajusta dificuldade progressivamente no final do cronograma
      let targetDifficulty = subj.difficulty;
      if (weekRatio > 0.7 && subj.userLevel < 3) {
        targetDifficulty = DIFFICULTY_MAP[Math.min(3, subj.userLevel + 1)];
      }
      
      schedule.push({
        week,
        subject: subj.subject,
        hours: subj.weeklyHours,
        targetDifficulty,
      });
    }
  }

  return schedule;
}

/**
 * Verifica se o usuário deve subir de nível em uma matéria com base nos attempts recentes.
 */
export function checkLevelUp(
  correctCount: number,
  totalCount: number,
  currentLevel: number
): LevelUpResult {
  const threshold = LEVEL_THRESHOLDS[currentLevel as keyof typeof LEVEL_THRESHOLDS] ?? 999;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  if (totalCount >= threshold && accuracy >= 0.7 && currentLevel < 3) {
    return { leveled: true, newLevel: currentLevel + 1, subject: '' };
  }

  return { leveled: false, newLevel: currentLevel, subject: '' };
}

/**
 * Calcula taxa de acerto por matéria a partir dos attempts do usuário.
 */
export function computeSubjectStats(
  attempts: Array<{ subject?: string | null; isCorrect: boolean; difficulty?: string | null }>
): Record<string, { total: number; correct: number; level: number }> {
  const stats: Record<string, { total: number; correct: number; level: number }> = {};

  for (const attempt of attempts) {
    const subject = attempt.subject ?? 'Geral';
    if (!stats[subject]) {
      stats[subject] = { total: 0, correct: 0, level: 1 };
    }
    stats[subject].total++;
    if (attempt.isCorrect) stats[subject].correct++;
  }

  // Calcula nível baseado na taxa de acerto
  for (const subject of Object.keys(stats)) {
    const { total, correct } = stats[subject];
    const accuracy = total > 0 ? correct / total : 0;
    if (total >= 15 && accuracy >= 0.7) stats[subject].level = 3;
    else if (total >= 10 && accuracy >= 0.7) stats[subject].level = 2;
    else stats[subject].level = 1;
  }

  return stats;
}
