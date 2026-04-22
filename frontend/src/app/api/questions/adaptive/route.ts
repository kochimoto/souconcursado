// frontend/src/app/api/questions/adaptive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'Direito Constitucional';
  const level = parseInt(searchParams.get('level') || '1');

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.error('[/api/questions/adaptive] Erro: GEMINI_API_KEY não encontrada.');
      throw new Error('Configuração de IA ausente.');
    }

    // DIAGNÓSTICO: Listar modelos disponíveis para esta chave
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      console.log('[/api/questions/adaptive] Modelos disponíveis para esta chave:', 
        listData.models?.map((m: any) => m.name).join(', ') || 'Nenhum modelo listado');
    } catch (e) {
      console.error('[/api/questions/adaptive] Falha ao listar modelos');
    }

    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    const prompt = `Você é um especialista em concursos públicos brasileiros.
Gere UMA questão de múltipla escolha sobre: "${topic}".
Nível de dificuldade: ${difficulty} (nível ${level}/10).

Responda SOMENTE com JSON válido, sem markdown, sem \`\`\`:
{
  "id": "ai_${Date.now()}",
  "text": "Enunciado completo da questão",
  "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "correctOption": 0,
  "explanation": "Explicação detalhada da resposta correta",
  "difficulty": "${difficulty}",
  "subject": "${topic}",
  "exam": { "name": "Questão Gerada por IA", "organization": "Gemini" }
}

correctOption deve ser o índice (0-3) da opção correta.`;

    // Usando gemini-pro por ser o mais compatível universalmente
    const modelName = "gemini-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[/api/questions/adaptive] Erro na API (${response.status}):`, JSON.stringify(errorData));
      
      // Se der 404, vamos tentar retornar uma mensagem mais útil
      if (response.status === 404) {
        return NextResponse.json({ 
          message: `O modelo ${modelName} não foi encontrado. Verifique se a API Generative Language está ativa no seu projeto do Google.`,
          detail: errorData 
        }, { status: 404 });
      }

      throw new Error(`Gemini API error ${response.status}: ${errorData.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[/api/questions/adaptive] Resposta sem texto:', JSON.stringify(data));
      throw new Error('IA retornou uma estrutura de resposta inesperada');
    }

    // Tentar limpar markdown se a IA colocar
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    const question = JSON.parse(jsonStr);
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json(
      { message: 'Erro ao gerar questão com IA', detail: error?.message },
      { status: 500 }
    );
  }
}
