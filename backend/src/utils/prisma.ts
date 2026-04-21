import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('[PRISMA] DATABASE_URL or DIRECT_URL is not defined in environment variables!');
}

try {
  console.log('[PRISMA] Initializing connection pool...');
  const pool = new Pool({ 
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ 
    adapter,
    log: ['error', 'warn'] 
  });
  
  console.log('[PRISMA] Prisma Client initialized successfully.');
} catch (error: any) {
  console.error('[PRISMA] Initialization FAILED:', error.message);
  // Fallback para cliente sem adapter caso o erro seja no pool
  prisma = new PrismaClient({
    log: ['error', 'warn']
  });
}

export default prisma;
