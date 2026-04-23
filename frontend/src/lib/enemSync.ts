
import prisma from './prisma';
import axios from 'axios';

const ENEM_API_BASE = 'https://api.enem.dev/v1';

export async function syncEnemQuestions(years: number[] = [2023]) {
  console.log(`[EnemSync] Iniciando sincronização para os anos: ${years.join(', ')}`);

  // 1. Garantir que o "Concurso" Enem existe
  let enemExam = await (prisma as any).exam.findFirst({
    where: { name: 'Enem - Exame Nacional do Ensino Médio' }
  });

  if (!enemExam) {
    enemExam = await (prisma as any).exam.create({
      data: {
        name: 'Enem - Exame Nacional do Ensino Médio',
        organization: 'INEP',
        area: 'Vestibular',
        level: 'Médio',
        status: 'Aberto',
        state: 'Nacional',
        subjects: [
          'Linguagens, Códigos e suas Tecnologias',
          'Matemática e suas Tecnologias',
          'Ciências da Natureza e suas Tecnologias',
          'Ciências Humanas e suas Tecnologias'
        ],
        date: new Date('2024-11-03T13:00:00Z'), // Data fictícia próxima
      }
    });
    console.log('[EnemSync] Criado registro do concurso Enem.');
  }

  let totalSynced = 0;

  for (const year of years) {
    try {
      console.log(`[EnemSync] Buscando questões de ${year}...`);
      const response = await axios.get(`${ENEM_API_BASE}/exams/${year}/questions`);
      const questions = response.data.questions;

      if (!Array.isArray(questions)) {
        console.error(`[EnemSync] Resposta inválida para o ano ${year}: questions não é um array`);
        continue;
      }

      console.log(`[EnemSync] Processando ${questions.length} questões de ${year}...`);

      for (const q of questions) {
        // Mapear dados da API para o nosso modelo
        // API: index, title, context, question, alternatives[], subject, topic
        
        const questionText = `${q.context || ''}\n\n${q.question || ''}`;
        const alternatives = q.alternatives || [];
        const options = alternatives.map((alt: any) => alt.text);
        
        // Encontrar índice da alternativa correta
        const correctOption = alternatives.findIndex((alt: any) => alt.isCorrect);

        if (correctOption === -1) {
          console.warn(`[EnemSync] Questão ${q.index} de ${year} sem alternativa correta.`);
          continue;
        }

        const disciplineMap: Record<string, string> = {
          'linguagens': 'Linguagens, Códigos e suas Tecnologias',
          'matematica': 'Matemática e suas Tecnologias',
          'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
          'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias'
        };

        const subject = disciplineMap[q.discipline] || q.subject || 'Geral';

        // Verificar se a questão já existe (pelo texto e examId)
        const existing = await (prisma as any).question.findFirst({
          where: {
            text: questionText,
            examId: enemExam.id
          }
        });

        if (existing) {
          await (prisma as any).question.update({
            where: { id: existing.id },
            data: { 
              subject: subject,
              files: q.files || null
            }
          });
        } else {
          await (prisma as any).question.create({
            data: {
              text: questionText,
              options: options,
              correctOption: correctOption,
              subject: subject,
              topic: q.topic || null,
              difficulty: 'Médio',
              examId: enemExam.id,
              explanation: `Questão do Enem ${year}.`,
              files: q.files || null
            }
          });
          totalSynced++;
        }
      }
    } catch (error: any) {
      console.error(`[EnemSync] Erro ao sincronizar ano ${year}:`, error.message);
    }
  }

  console.log(`[EnemSync] Sincronização concluída. Total de novas questões: ${totalSynced}`);
  return totalSynced;
}
