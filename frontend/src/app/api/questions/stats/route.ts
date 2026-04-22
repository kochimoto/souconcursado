// frontend/src/app/api/questions/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const stats = await (prisma as any).subjectStat.findMany({
      where: { userId: authUser.id },
      orderBy: { totalAnswered: 'desc' },
    });

    const enriched = stats.map((s: any) => ({
      subject: s.subject,
      totalAnswered: s.totalAnswered,
      totalCorrect: s.totalCorrect,
      accuracy: s.totalAnswered > 0 ? Math.round((s.totalCorrect / s.totalAnswered) * 100) : 0,
      currentLevel: s.currentLevel,
      levelLabel: s.currentLevel === 1 ? 'Iniciante' : s.currentLevel === 2 ? 'Intermediário' : 'Avançado',
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching subject stats' }, { status: 500 });
  }
}
