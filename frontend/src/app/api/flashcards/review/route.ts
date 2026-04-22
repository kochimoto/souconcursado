// frontend/src/app/api/flashcards/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { id, rating } = await request.json();

    const flashcard = await (prisma as any).flashcard.findUnique({ where: { id: String(id) } });
    if (!flashcard) return NextResponse.json({ message: 'Flashcard not found' }, { status: 404 });

    let { interval, easeFactor, reps } = flashcard;

    if (rating === 'easy') {
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * easeFactor);
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    } else if (rating === 'medium') {
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 4 : Math.round(interval * (easeFactor - 0.15));
    } else {
      reps = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.max(1, interval));

    const updated = await (prisma as any).flashcard.update({
      where: { id: String(id) },
      data: { interval, easeFactor, reps, nextReview, lastReviewedAt: new Date() },
    });

    return NextResponse.json({ ...updated, nextReviewDays: Math.max(1, interval) });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating flashcard' }, { status: 500 });
  }
}
