// frontend/src/app/api/study/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { minutes } = await request.json();

    if (!minutes || isNaN(minutes)) {
      return NextResponse.json({ message: 'Minutos inválidos' }, { status: 400 });
    }

    // @ts-ignore
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        studyTimeMinutes: { increment: minutes }
      }
    });

    return NextResponse.json({ 
      message: 'Tempo de estudo contabilizado!', 
      totalMinutes: updatedUser.studyTimeMinutes 
    });
  } catch (error: any) {
    console.error('[Track] Erro ao salvar tempo de estudo:', error);
    return NextResponse.json({ message: 'Erro ao salvar tempo', detail: error.message }, { status: 500 });
  }
}
