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
  const examId = searchParams.get('examId');
  const userId = authUser.id;

  try {
    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    // 1. Buscar IDs de questões já respondidas para este usuário
    const attempts = await (prisma as any).attempt.findMany({
      where: { userId },
      select: { questionId: true }
    });
    const answeredIds = attempts.map((a: any) => a.questionId);

    // --- MODO IA (GERAÇÃO) ---
    if (useAI) {
      const apiKey = process.env.GROQ_API_KEY?.trim();
      if (!apiKey) throw new Error('Configuração de IA (Groq) ausente.');

      // Tentar pegar o nome do concurso se tiver examId
      let examContext = "";
      if (examId) {
        const exam = await (prisma as any).exam.findUnique({ where: { id: examId } });
        if (exam) examContext = ` do concurso "${exam.name}"`;
      }

      const prompt = `Você é um especialista em concursos brasileiros. 
Gere UMA questão inédita sobre o tema: "${subtopic || topic}"${examContext}.
Dificuldade: ${difficulty} (nível ${level}/10).
A resposta DEVE ser um JSON no formato:
{
  "text": "Enunciado",
  "options": ["A", "B", "C", "D"],
  "correctOption": 0,
  "explanation": "Explicação detalhada",
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
          topic: subtopic || null,
          difficulty: content.difficulty || difficulty,
          examId: examId || (await (prisma as any).exam.findFirst())?.id, // Fallback para o primeiro se não houver
          id: `ai_${Date.now()}`
        }
      });
      return NextResponse.json(saved);
    }

    // --- MODO BIBLIOTECA (SELEÇÃO) ---
    let questions = [];
    
    // Filtro base: assunto, dificuldade e NÃO respondidas
    const baseWhere: any = {
      subject: { contains: topic, mode: 'insensitive' },
      difficulty: difficulty,
      id: { notIn: answeredIds }
    };

    if (examId) {
      baseWhere.examId = examId;
    }

    // Se tiver subtopico, tentamos um filtro mais específico
    if (subtopic) {
      questions = await (prisma as any).question.findMany({
        where: {
          ...baseWhere,
          OR: [
            { topic: { contains: subtopic, mode: 'insensitive' } },
            { text: { contains: subtopic, mode: 'insensitive' } }
          ]
        },
        include: { exam: true },
        take: 50
      });

      // Se não achar nada com subtopico E dificuldade exata, relaxamos a dificuldade
      if (questions.length === 0) {
        delete baseWhere.difficulty;
        questions = await (prisma as any).question.findMany({
          where: {
            ...baseWhere,
            OR: [
              { topic: { contains: subtopic, mode: 'insensitive' } },
              { text: { contains: subtopic, mode: 'insensitive' } }
            ]
          },
          include: { exam: true },
          take: 50
        });
      }
    } else {
      // "Mistura tudo" - apenas o assunto geral
      questions = await (prisma as any).question.findMany({
        where: baseWhere,
        include: { exam: true },
        take: 50
      });
    }

    // Se ainda estiver vazio, tentamos sem o filtro de "não respondidas" (resetar ciclo)
    if (questions.length === 0) {
      const resetWhere = { ...baseWhere };
      delete (resetWhere as any).id; // Remove o notIn
      
      if (subtopic) {
        (resetWhere as any).OR = [
          { topic: { contains: subtopic, mode: 'insensitive' } },
          { text: { contains: subtopic, mode: 'insensitive' } }
        ];
      }

      questions = await (prisma as any).question.findMany({
        where: resetWhere,
        include: { exam: true },
        take: 50
      });
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { 
          message: `Biblioteca esgotada para ${subtopic || topic}.`, 
          needsAI: true,
          exhausted: true 
        },
        { status: 404 }
      );
    }

    // Seleção aleatória do pool de 50
    const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
    return NextResponse.json(selectedQuestion);

  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json({ message: 'Erro na questão adaptativa' }, { status: 500 });
  }
}
