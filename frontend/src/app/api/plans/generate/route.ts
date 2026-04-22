// frontend/src/app/api/plans/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const body = await request.json();
    const { examId, hoursPerDay = 2 } = body;

    if (!examId) {
      return NextResponse.json({ message: 'examId é obrigatório' }, { status: 400 });
    }

    const exam = await (prisma as any).exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      return NextResponse.json({ message: 'Concurso não encontrado' }, { status: 404 });
    }

    // Verifica se já existe plano ativo para este usuário + exam
    const existing = await (prisma as any).studyPlan.findFirst({
      where: { userId: authUser.id, examId, status: 'ACTIVE' },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // Monta lista de matérias a partir de questões ou campos do concurso
    const subjectMap: Record<string, number> = {};
    if (Array.isArray(exam.questions) && exam.questions.length > 0) {
      (exam.questions as any[]).forEach((q: any) => {
        if (q.subject) subjectMap[q.subject] = (subjectMap[q.subject] || 0) + 1;
      });
    }

    let examSubjectsList: { subject: string; questionCount: number }[] = Object.entries(subjectMap).map(
      ([subject, count]) => ({ subject, questionCount: count })
    );

    // Fallback: usar campo subjects do banco se não houver questões
    if (examSubjectsList.length === 0 && Array.isArray(exam.subjects)) {
      examSubjectsList = (exam.subjects as string[]).map((s: string, i: number) => ({
        subject: s,
        questionCount: 5,
      }));
    }

    // Fallback final: criar matérias genéricas de concurso público
    if (examSubjectsList.length === 0) {
      examSubjectsList = [
        { subject: 'Português', questionCount: 10 },
        { subject: 'Matemática', questionCount: 10 },
        { subject: 'Direito Constitucional', questionCount: 8 },
        { subject: 'Legislação Específica', questionCount: 8 },
        { subject: 'Conhecimentos Gerais', questionCount: 8 },
      ];
    }

    const contentBlocks = examSubjectsList.map((s, i) => ({
      subject: s.subject,
      userLevel: 1,
      priority: examSubjectsList.length - i,
      difficulty: 'Fácil',
      weeklyHours: Math.max(1, Math.floor((hoursPerDay * 7) / examSubjectsList.length)),
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
        contentBlocks: contentBlocks,
        weeklySchedule: {},
        status: 'ACTIVE',
        progress: 0,
      },
      include: { exam: true },
    });

    return NextResponse.json(studyPlan, { status: 201 });
  } catch (error: any) {
    console.error('[/api/plans/generate] Error:', error?.message, error?.code, error?.meta);
    return NextResponse.json(
      { message: 'Erro ao gerar plano de estudos', detail: error?.message },
      { status: 500 }
    );
  }
}
