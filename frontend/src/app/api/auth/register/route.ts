// frontend/src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, age, city, state, alreadyTaken, targetExam, howFound, subjectLevels } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'E-mail, nome e senha são obrigatórios.' }, { status: 400 });
    }

    const existingUser = await (prisma as any).user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (prisma as any).user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        age: age ? (typeof age === 'string' ? parseInt(age) : age) : null,
        city: city || null,
        state: state || null,
        alreadyTaken: Boolean(alreadyTaken),
        targetExam: targetExam || null,
        howFound: howFound || null,
        subjectLevels: subjectLevels || {}
      }
    });

    const token = signToken(user.id, '30d');
    return NextResponse.json(
      { token, user: { id: user.id, name: user.name, email: user.email }, message: 'Conta criada com sucesso!' },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[REGISTER] Error:', error);
    return NextResponse.json({ message: 'Erro interno ao criar conta.', error: error.message }, { status: 500 });
  }
}
