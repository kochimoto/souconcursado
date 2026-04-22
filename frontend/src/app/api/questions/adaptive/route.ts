// frontend/src/app/api/questions/adaptive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
      throw new Error('Configuração de IA (Groq) ausente.');
    }

    // Busca ou cria um concurso genérico para as questões de IA
    let aiExam = await (prisma as any).exam.findFirst({
      where: { name: "Simulado Sou Concursado" }
    });

    if (!aiExam) {
      aiExam = await (prisma as any).exam.create({
        data: {
          name: "Simulado Sou Concursado",
          organization: "Inteligência Artificial",
          area: "Geral",
          level: "Superior",
          status: "Gerada por IA"
        }
      });
    }

    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    const prompt = `Você é um especialista em concursos públicos brasileiros.
Gere UMA questão de múltipla escolha inédita sobre o tema: "${topic}".
Dificuldade: ${difficulty} (nível de usuário ${level}/10).

A resposta DEVE ser estritamente um JSON no formato abaixo, sem nenhum texto antes ou depois:
{
  "text": "Enunciado completo da questão",
  "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "correctOption": 0,
  "explanation": "Explicação detalhada do porquê a resposta está correta",
  "difficulty": "${difficulty}",
  "subject": "${topic}"
}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    if (!groqRes.ok) {
      throw new Error(`Groq API Error: ${groqRes.status}`);
    }

    const data = await groqRes.json();
    const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    
    // Salva a questão no banco de dados para que o progresso funcione
    const savedQuestion = await (prisma as any).question.create({
      data: {
        text: content.text,
        options: content.options,
        correctOption: content.correctOption,
        explanation: content.explanation,
        subject: content.subject || topic,
        difficulty: content.difficulty || difficulty,
        examId: aiExam.id
      },
      include: {
        exam: true
      }
    });

    return NextResponse.json(savedQuestion);
  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json(
      { message: 'Erro ao gerar questão com Groq', detail: error?.message },
      { status: 500 }
    );
  }
}
