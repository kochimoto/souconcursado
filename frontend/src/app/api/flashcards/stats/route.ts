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

    return NextResponse.json({ todayReviews, dailyGoal: 30, totalCards });
  } catch (error: any) {
    console.error('[Stats] Erro ao buscar estatísticas de flashcards:', error);
    return NextResponse.json({ message: 'Error fetching stats', detail: error.message }, { status: 500 });
  }
}
