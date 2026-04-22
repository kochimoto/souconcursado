// frontend/src/app/api/flashcards/all/route.ts
// Retorna TODOS os flashcards do usuário (sem filtro de data), usado para praticar extras
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
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(flashcards);
  } catch (error: any) {
    console.error('[/api/flashcards/all] Error:', error?.message);
    return NextResponse.json({ message: 'Error fetching all flashcards' }, { status: 500 });
  }
}
