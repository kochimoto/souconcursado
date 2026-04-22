// frontend/src/app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true, email: true, name: true, age: true, city: true, state: true,
        targetExam: true, xp: true, level: true, rankingPoints: true,
        alreadyTaken: true, subjectLevels: true, createdAt: true
      }
    });

    if (!user) return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao buscar perfil' }, { status: 500 });
  }
}
