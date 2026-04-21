import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Pre-flight check for Vercel logs
console.log('[PRE-FLIGHT] Initializing Prisma with Driver Adapter (Pure JS)...');
console.log('[PRE-FLIGHT] DATABASE_URL Check:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');

// Use a connection pool (standard pg library)
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with the adapter
// This satisfies the "engine type client requires either 'adapter' or 'accelerate'" error
const prisma = new PrismaClient({ 
  adapter,
  log: ['error', 'warn'] 
});

export default prisma;
