// frontend/src/app/api/plans/[id]/sync/route.ts
// Sincroniza o progresso do plano de estudos com base nas tentativas reais do usuário.
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  const { id } = await params;

  try {
    const plan = await (prisma as any).studyPlan.findFirst({
      where: { id, userId: authUser.id },
    });

    if (!plan) {
      return NextResponse.json({ message: 'Plano não encontrado' }, { status: 404 });
    }

    // Busca estatísticas reais de desempenho do usuário
    const subjectStats = await (prisma as any).subjectStat.findMany({
      where: { userId: authUser.id },
    });

    const statsMap: Record<string, { totalAnswered: number; totalCorrect: number; currentLevel: number }> = {};
    for (const stat of subjectStats) {
      statsMap[stat.subject] = {
        totalAnswered: stat.totalAnswered,
        totalCorrect: stat.totalCorrect,
        currentLevel: stat.currentLevel,
      };
    }

    const contentBlocks = plan.contentBlocks as any[];
    const levelUps: { subject: string; newLevel: number }[] = [];

    const updatedBlocks = contentBlocks.map((block: any) => {
      const stat = statsMap[block.subject];
      if (!stat) return block;

      const accuracy = stat.totalAnswered > 0
        ? (stat.totalCorrect / stat.totalAnswered) * 100
        : 0;

      // Sobe de nível se acertar ≥70% com pelo menos 10 questões
      let newLevel = block.userLevel;
      if (stat.totalAnswered >= block.nextLevelThreshold && accuracy >= 70 && block.userLevel < 3) {
        newLevel = block.userLevel + 1;
        levelUps.push({ subject: block.subject, newLevel });
      }

      return {
        ...block,
        userLevel: newLevel,
        correctAnswers: stat.totalCorrect,
        totalAnswers: stat.totalAnswered,
        status: accuracy >= 70 && stat.totalAnswered >= 10 ? 'done' : 'todo',
      };
    });

    // Calcula progresso geral: % de blocos com status 'done'
    const doneCount = updatedBlocks.filter((b: any) => b.status === 'done').length;
    const progress = contentBlocks.length > 0
      ? Math.round((doneCount / contentBlocks.length) * 100)
      : 0;

    const updatedPlan = await (prisma as any).studyPlan.update({
      where: { id },
      data: { contentBlocks: updatedBlocks, progress },
      include: { exam: true },
    });

    return NextResponse.json({ plan: updatedPlan, levelUps });
  } catch (error: any) {
    console.error('[/api/plans/sync] Error:', error?.message);
    return NextResponse.json({ message: 'Erro ao sincronizar progresso', detail: error?.message }, { status: 500 });
  }
}
