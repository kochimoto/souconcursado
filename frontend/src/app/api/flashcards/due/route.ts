// frontend/src/app/api/flashcards/due/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const now = new Date();
    // Adiciona um buffer de 1 minuto para garantir que cards recém-criados apareçam
    const bufferTime = new Date(now.getTime() + 60000); 
    
    const flashcards = await (prisma as any).flashcard.findMany({
      where: {
        userId: authUser.id,
        nextReview: { lte: bufferTime },
      },
      include: { question: true },
      orderBy: { nextReview: 'asc' },
    });
    return NextResponse.json(flashcards);
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching due flashcards' }, { status: 500 });
  }
}
