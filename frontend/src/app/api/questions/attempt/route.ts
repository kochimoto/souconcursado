// frontend/src/app/api/questions/attempt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { questionId, chosenOption } = await request.json();

    const question = await (prisma as any).question.findUnique({ where: { id: String(questionId) } });
    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    const isCorrect = question.correctOption === chosenOption;

    const attempt = await (prisma as any).attempt.create({
      data: {
        userId: authUser.id,
        questionId,
        chosenOption,
        isCorrect,
        subject: question.subject,
        difficulty: question.difficulty,
      },
    });

    if (isCorrect) {
      const xpGain = question.difficulty === 'Difícil' ? 20 : question.difficulty === 'Médio' ? 15 : 10;
      await (prisma as any).user.update({
        where: { id: authUser.id },
        data: {
          xp: { increment: xpGain },
          rankingPoints: { increment: Math.floor(xpGain / 2) },
        },
      });
    }

    await (prisma as any).subjectStat.upsert({
      where: { userId_subject: { userId: authUser.id, subject: question.subject } },
      update: {
        totalAnswered: { increment: 1 },
        ...(isCorrect && { totalCorrect: { increment: 1 } }),
      },
      create: {
        userId: authUser.id,
        subject: question.subject,
        totalAnswered: 1,
        totalCorrect: isCorrect ? 1 : 0,
        currentLevel: 1,
      },
    });

    return NextResponse.json({ attempt, isCorrect, explanation: question.explanation });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Error submitting attempt' }, { status: 500 });
  }
}
