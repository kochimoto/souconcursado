// frontend/src/lib/prisma.ts
// Prisma client singleton com lazy initialization para serverless

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const getPrismaClient = () => {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return globalForPrisma.prisma;
};

export default getPrismaClient();
