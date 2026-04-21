import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let _prisma: PrismaClient | null = null;

export const getPrisma = () => {
  if (_prisma) return _prisma;

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  try {
    console.log('[PRISMA] Initializing Lazy Connection...');
    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({ 
      adapter,
      log: ['error', 'warn'] 
    });
  } catch (error: any) {
    console.error('[PRISMA] Initialization FAILED:', error.message);
    _prisma = new PrismaClient({
      log: ['error', 'warn']
    });
  }

  return _prisma;
};

const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const instance = getPrisma();
    return (instance as any)[prop];
  }
});

export default prisma;
