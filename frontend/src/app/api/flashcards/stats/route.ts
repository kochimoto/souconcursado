// frontend/src/app/api/flashcards/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    console.log(`[Stats] Buscando stats para user: ${authUser.id}`);

    // @ts-ignore
    const todayReviews = await prisma.flashcard.count({
      where: { userId: authUser.id, lastReviewedAt: { gte: startOfDay } },
    });
    // @ts-ignore
    const totalCards = await prisma.flashcard.count({
      where: { userId: authUser.id },
    });

    // Busca resumo por matéria (agrupado)
    // @ts-ignore
    const allDueCards = await prisma.flashcard.findMany({
      where: {
        userId: authUser.id,
        nextReview: { lte: new Date() }
      },
      select: { 
        id: true,
        question: { select: { subject: true } } 
      }
    });

    const summary: Record<string, number> = {};
    allDueCards.forEach((card: any) => {
      const sub = card.question?.subject || "Geral";
      summary[sub] = (summary[sub] || 0) + 1;
    });

    const subjectsSummary = Object.entries(summary).map(([subject, count]) => ({
      subject,
      count
    }));

    return NextResponse.json({ 
      todayReviews, 
      dailyGoal: 30, 
      totalCards,
      subjectsSummary 
    });
  } catch (error: any) {
    console.error('[Stats] Erro ao buscar estatísticas de flashcards:', error);
    return NextResponse.json({ message: 'Error fetching stats', detail: error.message }, { status: 500 });
  }
}
