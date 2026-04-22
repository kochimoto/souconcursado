// frontend/src/app/api/exams/sync/route.ts
// Endpoint de sincronização de concursos.
// Os concursos são gerenciados via seed/admin; este endpoint apenas confirma status.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({
    message: 'Concursos sincronizados com sucesso.',
    synced: 0,
  });
}
