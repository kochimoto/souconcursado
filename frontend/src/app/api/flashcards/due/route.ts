// frontend/src/app/api/flashcards/due/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

    const { searchParams } = request.nextUrl;
    const subject = searchParams.get('subject');
    const examId = searchParams.get('examId');

    const now = new Date();
    const bufferTime = new Date(now.getTime() + 300000); 
    
    console.log(`[Due] Buscando cards para user: ${authUser.id} subject: ${subject} exam: ${examId}`);

    // @ts-ignore
    const flashcards = await prisma.flashcard.findMany({
      where: {
        userId: authUser.id,
        nextReview: { lte: bufferTime },
        ...(subject && { subject }),
        ...(examId && { examId }),
      },
      include: { question: true },
      orderBy: { nextReview: 'asc' },
    });

    console.log(`[Due] Sucesso: ${flashcards.length} cartões encontrados`);
    return NextResponse.json(flashcards);
  } catch (error: any) {
    console.error('[Due] Erro Fatal ao buscar cards pendentes:', error);
    return NextResponse.json({ message: 'Error fetching due flashcards', detail: error.message }, { status: 500 });
  }
}
