// frontend/src/lib/prisma.ts
// Prisma client singleton com lazy initialization e SSL para serverless Vercel

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var _prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Tenta usar o adaptador pg com SSL (necessário para Postgres na Vercel)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: ['error', 'warn'] } as any);
  } catch {
    // Fallback para cliente padrão (desenvolvimento local)
    return new PrismaClient({ log: ['error', 'warn'] });
  }
}

const prisma = globalThis._prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis._prismaClient = prisma;
}

export default prisma;
