
import { NextRequest, NextResponse } from 'next/server';
import { syncEnemQuestions } from '@/lib/enemSync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const years = body.years || [2023, 2022, 2021, 2020];

    const syncedCount = await syncEnemQuestions(years);

    return NextResponse.json({
      message: 'Sincronização do Enem concluída com sucesso.',
      syncedCount
    });
  } catch (error: any) {
    console.error('[/api/exams/sync-enem] Error:', error.message);
    return NextResponse.json(
      { message: 'Erro na sincronização do Enem', detail: error.message },
      { status: 500 }
    );
  }
}
