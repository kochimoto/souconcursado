// frontend/src/lib/prisma.ts
// Prisma client singleton com conexão direta (sem PgBouncer) para evitar
// o erro "prepared statement does not exist" em ambientes serverless

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var _prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');

    // DIRECT_URL = conexão direta ao Postgres sem PgBouncer
    // Evita o erro "prepared statement does not exist" do pooler do Neon
    const connectionString =
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL;

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: ['error'] } as any);
  } catch (e) {
    console.error('[Prisma] Adapter failed, using default client:', e);
    return new PrismaClient({ log: ['error'] });
  }
}

const prisma = globalThis._prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis._prismaClient = prisma;
}

export default prisma;
