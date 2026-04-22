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
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      console.error('[/api/questions/adaptive] Erro: GROQ_API_KEY não encontrada.');
      throw new Error('Configuração de IA (Groq) ausente.');
    }

    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    const prompt = `Você é um especialista em concursos públicos brasileiros.
Gere UMA questão de múltipla escolha inédita sobre o tema: "${topic}".
Dificuldade: ${difficulty} (nível de usuário ${level}/10).

A resposta DEVE ser estritamente um JSON no formato abaixo, sem nenhum texto antes ou depois:
{
  "id": "ai_${Date.now()}",
  "text": "Enunciado completo da questão",
  "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "correctOption": 0,
  "explanation": "Explicação detalhada do porquê a resposta está correta",
  "difficulty": "${difficulty}",
  "subject": "${topic}",
  "exam": { "name": "Questão Gerada por IA", "organization": "Groq Llama 3" }
}

Importante: correctOption deve ser o índice (0-3) da opção correta.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Você é um assistente que gera questões de concursos em formato JSON puro." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[/api/questions/adaptive] Groq API Error:', response.status, JSON.stringify(errorData));
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Groq retornou uma resposta vazia');
    }

    const question = JSON.parse(content);
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json(
      { message: 'Erro ao gerar questão com Groq', detail: error?.message },
      { status: 500 }
    );
  }
}
