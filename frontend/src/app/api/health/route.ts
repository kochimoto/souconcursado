// frontend/src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'next-route-handler',
    timestamp: new Date().toISOString(),
  });
}
