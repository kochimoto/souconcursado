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
  const subtopic = searchParams.get('subtopic');
  const level = parseInt(searchParams.get('level') || '1');
  const useAI = searchParams.get('useAI') === 'true';

  try {
    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    // --- MODO IA (GERAÇÃO) ---
    if (useAI) {
      const apiKey = process.env.GROQ_API_KEY?.trim();
      if (!apiKey) throw new Error('Configuração de IA (Groq) ausente.');

      const prompt = `Você é um especialista em concursos brasileiros. 
Gere UMA questão inédita sobre o tema: "${subtopic || topic}".
Dificuldade: ${difficulty} (nível ${level}/10).
A resposta DEVE ser um JSON no formato:
{
  "text": "Enunciado",
  "options": ["A", "B", "C", "D"],
  "correctOption": 0,
  "explanation": "Explicação",
  "difficulty": "${difficulty}",
  "subject": "${topic}"
}`;

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "JSON puro." }, { role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });

      const data = await groqRes.json();
      const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      
      const saved = await (prisma as any).question.create({
        data: {
          text: content.text,
          options: content.options,
          correctOption: content.correctOption,
          explanation: content.explanation,
          subject: content.subject || topic,
          difficulty: content.difficulty || difficulty,
          id: `ai_${Date.now()}`
        }
      });
      return NextResponse.json(saved);
    }

    // --- MODO BIBLIOTECA (SELEÇÃO) ---
    let questions = [];
    
    if (subtopic) {
      questions = await (prisma as any).question.findMany({
        where: {
          OR: [
            { text: { contains: subtopic, mode: 'insensitive' } },
            { subject: { contains: subtopic, mode: 'insensitive' } }
          ],
          difficulty: difficulty
        },
        include: { exam: true },
        take: 50
      });
    }

    if (questions.length === 0) {
      questions = await (prisma as any).question.findMany({
        where: {
          subject: { contains: topic, mode: 'insensitive' },
          difficulty: difficulty
        },
        include: { exam: true },
        take: 50
      });
    }

    if (questions.length === 0) {
       questions = await (prisma as any).question.findMany({
        where: { subject: { contains: topic, mode: 'insensitive' } },
        include: { exam: true },
        take: 50
      });
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { message: 'Biblioteca vazia para este tema.', needsAI: true },
        { status: 404 }
      );
    }

    const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
    return NextResponse.json(selectedQuestion);

  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json({ message: 'Erro na questão adaptativa' }, { status: 500 });
  }
}
