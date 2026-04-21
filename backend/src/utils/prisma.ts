import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let _prisma: PrismaClient | null = null;

export const getPrisma = () => {
  if (_prisma) return _prisma;

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  try {
    console.log('[PRISMA] Initializing Adapter Connection...');
    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Usando cast para 'any' para evitar conflito de tipos entre @types/pg e o esperado pelo adaptador
    const adapter = new PrismaPg(pool as any);
    
    _prisma = new PrismaClient({ 
      adapter: adapter as any,
      log: ['error', 'warn'] 
    });
  } catch (error: any) {
    console.error('[PRISMA] Adapter Initialization FAILED:', error.message);
    // Fallback para cliente padrão se o adaptador falhar
    _prisma = new PrismaClient({
      log: ['error', 'warn']
    });
  }

  return _prisma;
};

// Proxy para garantir inicialização preguiçosa sem quebrar as importações estáticas
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const instance = getPrisma();
    return (instance as any)[prop];
  }
});

export default prisma;
