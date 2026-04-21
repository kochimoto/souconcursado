import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Pre-flight check for Vercel logs
console.log('[PRE-FLIGHT] Initializing Prisma with Driver Adapter (Pure JS)...');
// Use a connection pool (standard pg library)
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('[PRE-FLIGHT] Using DB URL (masked):', dbUrl ? `${dbUrl.split('@')[0].split(':')[0]}:***@***` : 'MISSING');

const pool = new Pool({ 
  connectionString: dbUrl,
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
