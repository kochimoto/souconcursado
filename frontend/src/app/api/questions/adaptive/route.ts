// frontend/src/app/api/questions/adaptive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'Direito Constitucional';
  const subtopic = searchParams.get('subtopic');
  const level = parseInt(searchParams.get('level') || '1');

  try {
    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    // 1. Tenta buscar questões que correspondam ao subtema específico primeiro
    let questions = [];
    
    if (subtopic) {
      questions = await (prisma as any).question.findMany({
        where: {
          OR: [
            { text: { contains: subtopic, mode: 'insensitive' } },
            { subject: { contains: subtopic, mode: 'insensitive' } }
          ],
          difficulty: difficulty
        },
        include: { exam: true },
        take: 50
      });
    }

    // 2. Se não encontrar pelo subtema, busca pelo tema (matéria) geral e dificuldade
    if (questions.length === 0) {
      questions = await (prisma as any).question.findMany({
        where: {
          subject: { contains: topic, mode: 'insensitive' },
          difficulty: difficulty
        },
        include: { exam: true },
        take: 50
      });
    }

    // 3. Fallback: Qualquer questão do tema se a dificuldade exata não existir
    if (questions.length === 0) {
       questions = await (prisma as any).question.findMany({
        where: {
          subject: { contains: topic, mode: 'insensitive' }
        },
        include: { exam: true },
        take: 50
      });
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { message: 'Nenhuma questão encontrada na biblioteca para este tema.' },
        { status: 404 }
      );
    }

    // 4. "IA" escolhe: Seleciona uma questão aleatória do pool filtrado
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];

    return NextResponse.json(selectedQuestion);
  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json(
      { message: 'Erro ao buscar questão adaptativa', detail: error?.message },
      { status: 500 }
    );
  }
}
