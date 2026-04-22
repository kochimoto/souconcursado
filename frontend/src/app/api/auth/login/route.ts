// frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await (prisma as any).user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 400 });
    }

    const token = signToken(user.id, '7d');
    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (error: any) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json({ message: 'Erro ao fazer login' }, { status: 500 });
  }
}
