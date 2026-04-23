// frontend/src/app/api/plans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  const { id } = await params;

  try {
    const plan = await (prisma as any).studyPlan.findFirst({
      where: { id, userId: authUser.id },
      include: { exam: true },
    });

    if (!plan) return NextResponse.json({ message: 'Plano não encontrado' }, { status: 404 });
    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao buscar plano' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  const { id } = await params;

  try {
    const { contentBlocks, progress } = await request.json();

    const updatedPlan = await (prisma as any).studyPlan.update({
      where: { id },
      data: { contentBlocks, progress },
    });

    return NextResponse.json(updatedPlan);
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao atualizar plano' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  const { id } = await params;

  try {
    await (prisma as any).studyPlan.delete({
      where: { id, userId: authUser.id },
    });

    return NextResponse.json({ message: 'Plano excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir plano:', error);
    return NextResponse.json({ message: 'Erro ao excluir plano' }, { status: 500 });
  }
}
