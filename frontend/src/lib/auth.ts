// frontend/src/lib/auth.ts
// Funções auxiliares de autenticação para os Route Handlers

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { id: decoded.userId };
  } catch {
    return null;
  }
}

export function signToken(userId: string, expiresIn: string = '7d'): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

export function unauthorized() {
  return Response.json({ message: 'Authentication required' }, { status: 401 });
}
