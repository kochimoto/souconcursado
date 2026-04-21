// Using the ISOLATED client generated in src/generated/client 
// to bypass monorepo resolution ambiguities on Vercel.
import { PrismaClient } from '../generated/client';

console.log('[PRE-FLIGHT] DATABASE_URL Check:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');
console.log('[PRE-FLIGHT] Engine Type Check: Forced Library');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;
