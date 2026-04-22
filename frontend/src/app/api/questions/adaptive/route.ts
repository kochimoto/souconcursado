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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
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

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error ${response.status}: ${errorData.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('IA retornou resposta vazia');

    const question = JSON.parse(text);
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json(
      { message: 'Erro ao gerar questão com IA', detail: error?.message },
      { status: 500 }
    );
  }
}
