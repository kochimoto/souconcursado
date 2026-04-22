// frontend/src/app/api/plans/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const plans = await (prisma as any).studyPlan.findMany({
      where: { userId: authUser.id },
      include: { exam: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao buscar planos' }, { status: 500 });
  }
}
