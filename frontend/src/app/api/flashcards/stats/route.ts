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

    const todayReviews = await (prisma as any).flashcard.count({
      where: { userId: authUser.id, lastReviewedAt: { gte: startOfDay } },
    });
    const totalCards = await (prisma as any).flashcard.count({
      where: { userId: authUser.id },
    });

    return NextResponse.json({ todayReviews, dailyGoal: 30, totalCards });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
  }
}
