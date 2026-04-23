// frontend/src/app/api/study/material/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
// @ts-ignore
import pdf from 'pdf-parse';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for AI processing

export async function POST(request: NextRequest) {
  console.log('--- Iniciando processamento de material (v1.1.1) ---');
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    console.log('Arquivo recebido:', file?.name, 'Tamanho:', file?.size);

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'Arquivo muito grande (máx 10MB)' }, { status: 400 });
    }

    // 1. Extrair texto do PDF
    console.log('Extraindo texto do PDF (stable)...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = await pdf(Buffer.from(arrayBuffer));
    const extractedText = pdfData.text.trim();
    console.log('Texto extraído com sucesso. Comprimento:', extractedText.length);

    if (extractedText.length < 50) {
      return NextResponse.json({ message: 'Texto insuficiente no PDF para análise.' }, { status: 400 });
    }

    // 2. Preparar contexto
    const context = extractedText.substring(0, 50000);

    // 3. Chamar IA para gerar conteúdo
    console.log('Chamando Groq AI...');
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      console.error('ERRO: GROQ_API_KEY não encontrada!');
      throw new Error('Configuração de IA ausente.');
    }

    const prompt = `Você é um tutor acadêmico especializado em síntese de materiais.
Com base no texto do PDF fornecido abaixo, gere conteúdo de estudo de alta qualidade.

REGRAS:
1. Gere até 8 flashcards (Frente/Verso).
2. Gere até 5 questões de múltipla escolha com 4 opções e explicação.
3. Use o idioma Português (Brasil).
4. Retorne APENAS um JSON no formato:
{
  "flashcards": [{"front": "...", "back": "..."}],
  "questions": [{"text": "...", "options": ["A","B","C","D"], "correctOption": 0, "explanation": "..."}]
}

TEXTO DO MATERIAL:
${context}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: "Você é um gerador de JSON puro." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Erro na resposta do Groq:', errText);
      throw new Error('IA indisponível no momento.');
    }

    const resData = await groqRes.json();
    const content = JSON.parse(resData.choices?.[0]?.message?.content || '{"flashcards":[], "questions":[]}');
    console.log('Conteúdo gerado pela IA:', content.flashcards?.length, 'flashcards,', content.questions?.length, 'questões');

    // 4. Criar um "Exame" específico para este PDF
    const materialTitle = file.name.replace('.pdf', '').substring(0, 50);
    console.log('Criando registro para o material:', materialTitle);
    
    const materialExam = await (prisma as any).exam.create({
      data: {
        name: `Material: ${materialTitle}`,
        organization: 'Upload Pessoal',
        area: 'Personalizado',
        level: 'Vários',
        status: 'Ativo'
      }
    });

    // 5. Salvar Flashcards
    console.log('Salvando flashcards...');
    const savedFlashcards = [];
    if (content.flashcards) {
      for (const fc of content.flashcards) {
        const saved = await (prisma as any).flashcard.create({
          data: {
            userId: authUser.id,
            cardType: 'classic',
            front: fc.front,
            back: fc.back,
            // Opcional: associar ao "exame" se tivermos um campo para isso futuramente
          }
        });
        savedFlashcards.push(saved);
      }
    }

    // 6. Salvar Questões
    console.log('Salvando questões...');
    const savedQuestions = [];
    if (content.questions) {
      for (const q of content.questions) {
        const saved = await (prisma as any).question.create({
          data: {
            text: q.text,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            subject: materialTitle,
            difficulty: 'Médio',
            examId: materialExam.id
          }
        });
        savedQuestions.push(saved);
      }
    }

    console.log('Processamento concluído com sucesso!');
    return NextResponse.json({
      message: 'Material processado com sucesso!',
      flashcardsCount: savedFlashcards.length,
      questionsCount: savedQuestions.length,
      examId: materialExam.id
    });

  } catch (error: any) {
    console.error('DETALHE DO ERRO NO SERVIDOR:', error);
    return NextResponse.json({ message: 'Erro ao processar PDF: ' + (error.message || 'Erro interno') }, { status: 500 });
  }
}
