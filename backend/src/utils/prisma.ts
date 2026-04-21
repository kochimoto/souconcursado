import { PrismaClient } from '@prisma/client';

// Use standard PrismaClient for better compatibility with Vercel and pooled connections
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;
