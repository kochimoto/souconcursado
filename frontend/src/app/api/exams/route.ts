// frontend/src/app/api/exams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const area = searchParams.get('area');
    const level = searchParams.get('level');
    const status = searchParams.get('status');

    const exams = await (prisma as any).exam.findMany({
      where: {
        ...(state && state !== 'Todos' && { state }),
        ...(area && area !== 'Todos' && { area }),
        ...(level && level !== 'Todos' && { level }),
        ...(status && status !== 'Todos' && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(exams);
  } catch (error: any) {
    console.error('[/api/exams] Error:', error?.message, error?.code);
    return NextResponse.json({ message: 'Error fetching exams', detail: error?.message }, { status: 500 });
  }
}
