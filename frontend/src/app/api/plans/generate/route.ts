// frontend/src/app/api/plans/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { examId, hoursPerDay = 2 } = await request.json();

    const exam = await (prisma as any).exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      return NextResponse.json({ message: 'Concurso não encontrado' }, { status: 404 });
    }

    const subjectMap: Record<string, { subject: string; count: number }> = {};
    (exam.questions as any[]).forEach((q: any) => {
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { subject: q.subject, count: 0 };
      subjectMap[q.subject].count++;
    });

    const examSubjectsList = Object.values(subjectMap).length > 0
      ? Object.values(subjectMap).map(s => ({ subject: s.subject, questionCount: s.count, topics: [] }))
      : ((exam.subjects as string[]) ?? []).map((s: string) => ({ subject: s, questionCount: 5, topics: [] }));

    const contentBlocks = examSubjectsList.map((s, i) => ({
      subject: s.subject,
      userLevel: 1,
      priority: examSubjectsList.length - i,
      difficulty: 'Fácil',
      weeklyHours: Math.max(1, Math.floor(hoursPerDay * 7 / examSubjectsList.length)),
      nextLevelThreshold: 10,
      status: 'todo',
      hoursSpent: 0,
      correctAnswers: 0,
      totalAnswers: 0,
    }));

    const studyPlan = await (prisma as any).studyPlan.create({
      data: {
        userId: authUser.id,
        examId,
        contentBlocks: contentBlocks as any,
        weeklySchedule: {} as any,
        status: 'ACTIVE',
        progress: 0,
      },
      include: { exam: true },
    });

    return NextResponse.json(studyPlan, { status: 201 });
  } catch (error: any) {
    console.error('Error generating plan:', error);
    return NextResponse.json({ message: 'Erro ao gerar plano de estudos' }, { status: 500 });
  }
}
