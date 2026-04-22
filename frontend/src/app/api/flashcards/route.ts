// frontend/src/app/api/flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const flashcards = await (prisma as any).flashcard.findMany({
      where: { userId: authUser.id },
      include: { question: true },
      orderBy: { nextReview: 'asc' },
    });
    return NextResponse.json(flashcards);
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching flashcards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { cardType, front, back, clozeText, clozeAnswers, questionId } = await request.json();

    const flashcard = await (prisma as any).flashcard.create({
      data: {
        userId: authUser.id,
        cardType: cardType ?? 'classic',
        front,
        back,
        clozeText,
        clozeAnswers: clozeAnswers || [],
        questionId,
      },
    });

    return NextResponse.json(flashcard, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error creating flashcard' }, { status: 500 });
  }
}
