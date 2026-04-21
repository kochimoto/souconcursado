import prisma from '../utils/prisma';

export interface GeneratedPlan {
  subjects: string[];
  description: string;
  initialFlashcards: Array<{ front: string; back: string; cardType: string }>;
}

/**
 * Mock AI Service to generate plan data based on the exam name
 */
export async function generateAIDataForExam(examName: string): Promise<GeneratedPlan> {
  const normalizedExam = examName.toLowerCase();
  
  // Basic mapping for popular exams
  if (normalizedExam.includes('pf') || normalizedExam.includes('policia federal')) {
    return {
      subjects: ['Português', 'Informática', 'Direito Constitucional', 'Direito Administrativo', 'Contabilidade', 'Estatística'],
      description: 'Plano focado no edital da Polícia Federal, com ênfase em Contabilidade e Informática.',
      initialFlashcards: [
        { front: 'Qual o objeto da contabilidade?', back: 'O Patrimônio.', cardType: 'classic' },
        { front: 'O que é o Princípio da Legalidade na Adm. Pública?', back: 'O administrador só pode fazer o que a lei permite.', cardType: 'classic' }
      ]
    };
  }
  
  if (normalizedExam.includes('prf') || normalizedExam.includes('rodoviaria')) {
    return {
      subjects: ['Português', 'Raciocínio Lógico', 'Informática', 'CTB (Trânsito)', 'Direito Constitucional', 'Direitos Humanos'],
      description: 'Plano intensivo para PRF, com foco total no Código de Trânsito Brasileiro.',
      initialFlashcards: [
        { front: 'Velocidade máxima em rodovias de pista dupla não sinalizadas?', back: '110 km/h para veículos leves.', cardType: 'classic' }
      ]
    };
  }

  // Default fallback
  return {
    subjects: ['Português', 'Direito Administrativo', 'Direito Constitucional', 'Raciocínio Lógico', 'Informática'],
    description: 'Plano de estudos base para concursos de nível médio e superior.',
    initialFlashcards: [
      { front: 'O que significa a sigla LIMPE no Direito Adm?', back: 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.', cardType: 'classic' }
    ]
  };
}
