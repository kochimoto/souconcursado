// frontend/src/app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const examId = searchParams.get('examId');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const questions = await (prisma as any).question.findMany({
      where: {
        ...(subject && { subject }),
        ...(examId && { examId }),
        ...(difficulty && { difficulty }),
      },
      include: { exam: true },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching questions' }, { status: 500 });
  }
}
