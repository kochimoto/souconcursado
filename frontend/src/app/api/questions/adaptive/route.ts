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
  const count = parseInt(searchParams.get('count') || '1');
  const userId = authUser.id;

  try {
    const difficulty = level > 7 ? 'Difícil' : level > 4 ? 'Médio' : 'Fácil';

    // 1. Buscar IDs de questões já respondidas
    const attempts = await (prisma as any).attempt.findMany({
      where: { userId },
      select: { questionId: true }
    });
    const answeredIds = attempts.map((a: any) => a.questionId);

    // 2. Identificar se é Enem
    const exam = examId ? await (prisma as any).exam.findUnique({ where: { id: examId } }) : null;
    const isEnem = exam?.name?.toLowerCase().includes('enem') || topic.toLowerCase().includes('enem');

    // --- MODO ENEM (BIBLIOTECA + ESCOLHA IA) ---
    if (isEnem) {
      const baseWhere: any = {
        subject: { contains: topic, mode: 'insensitive' },
        id: { notIn: answeredIds }
      };
      if (examId) baseWhere.examId = examId;
      if (subtopic) {
        baseWhere.OR = [
          { topic: { contains: subtopic, mode: 'insensitive' } },
          { text: { contains: subtopic, mode: 'insensitive' } }
        ];
      }

      // Buscar pool de candidatos (até 100)
      let pool = await (prisma as any).question.findMany({
        where: baseWhere,
        take: 100
      });

      // Se pool estiver vazio, resetar o filtro de respondidas para não travar
      if (pool.length === 0) {
        delete baseWhere.id;
        pool = await (prisma as any).question.findMany({
          where: baseWhere,
          take: 100
        });
      }

      if (pool.length === 0) {
        return NextResponse.json({ message: 'Biblioteca Enem vazia.', exhausted: true }, { status: 404 });
      }

      // Escolha Inteligente via IA (se count > 1 ou useAI)
      const apiKey = process.env.GROQ_API_KEY?.trim();
      if (apiKey && (count > 1 || useAI)) {
        // Enviar apenas os primeiros 40 para não estourar o contexto do prompt
        const miniPool = pool.slice(0, 40);
        const poolSummary = miniPool.map((q: any, idx: number) => 
          `[ID:${idx}] Tópico:${q.topic || 'Geral'} | Texto:${q.text.substring(0, 100).replace(/\n/g, ' ')}...`
        ).join('\n');
        
        const prompt = `Você é um curador especialista em Enem. 
O estudante está no nível ${difficulty} (nível ${level}/10).
Selecione as ${Math.min(count, miniPool.length)} melhores questões do pool abaixo que se encaixem nesse nível e variem os sub-tópicos.
Retorne APENAS um JSON com os IDs numéricos escolhidos do pool: {"indices": [0, 5, 12, ...]}.

POOL:
${poolSummary}`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "system", content: "JSON puro." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });

        const resData = await groqRes.json();
        const { indices } = JSON.parse(resData.choices?.[0]?.message?.content || '{"indices": []}');
        
        if (indices && Array.isArray(indices) && indices.length > 0) {
          const selected = indices.map((i: number) => miniPool[i]).filter(Boolean);
          return NextResponse.json(count === 1 ? (selected[0] || pool[0]) : selected);
        }
      }

      // Fallback: Sorteio aleatório se a IA falhar
      const shuffled = pool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      return NextResponse.json(count === 1 ? selected[0] : selected);
    }

    // --- MODO CONCURSOS (GERAÇÃO EM LOTE SE BIBLIOTECA VAZIA) ---
    const concursoWhere: any = {
      subject: { contains: topic, mode: 'insensitive' },
      id: { notIn: answeredIds }
    };
    if (examId) concursoWhere.examId = examId;
    
    // Tentar pegar o que já existe no DB
    let dbQuestions = await (prisma as any).question.findMany({
      where: concursoWhere,
      take: count
    });

    if (dbQuestions.length >= count) {
      return NextResponse.json(count === 1 ? dbQuestions[0] : dbQuestions);
    }

    // Se faltar questões, gerar o restante via IA
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      if (dbQuestions.length > 0) return NextResponse.json(count === 1 ? dbQuestions[0] : dbQuestions);
      throw new Error('Configuração de IA ausente para concursos.');
    }

    const needed = count - dbQuestions.length;
    const examName = exam?.name || "Concursos Públicos";
    
    const prompt = `Gere ${needed} questões de múltipla escolha inéditas para o concurso "${examName}".
Tema: ${subtopic || topic}.
Nível de Dificuldade: ${difficulty}.
Garantia: Questões variadas, de alta qualidade e NUNCA repetidas.
O formato DEVE ser um JSON: {"questions": [{"text": "...", "options": ["A","B","C","D"], "correctOption": 0, "explanation": "..."}]}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: "JSON puro." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const resData = await groqRes.json();
    const { questions: aiQuestions } = JSON.parse(resData.choices?.[0]?.message?.content || '{"questions": []}');

    const savedQuestions = [];
    for (const q of aiQuestions) {
      const saved = await (prisma as any).question.create({
        data: {
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          subject: topic,
          topic: subtopic || null,
          difficulty: difficulty,
          examId: examId || (await (prisma as any).exam.findFirst())?.id,
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        }
      });
      savedQuestions.push(saved);
    }

    const finalBatch = [...dbQuestions, ...savedQuestions];
    return NextResponse.json(count === 1 ? finalBatch[0] : finalBatch);

  } catch (error: any) {
    console.error('[/api/questions/adaptive] Error:', error?.message);
    return NextResponse.json({ message: 'Erro ao organizar sessão de questões' }, { status: 500 });
  }
}
