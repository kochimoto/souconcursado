// frontend/src/app/api/study/material/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PDFParse } from 'pdf-parse';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for AI processing

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') || 'both'; // 'flashcards', 'questions', or 'both'

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'Arquivo muito grande (máx 10MB)' }, { status: 400 });
    }

    // 1. Extrair texto do PDF
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
    await parser.load();
    const textResult = await parser.getText();
    const extractedText = textResult.text.trim();

    if (extractedText.length < 50) {
      return NextResponse.json({ message: 'Texto insuficiente no PDF para análise.' }, { status: 400 });
    }

    // 2. Preparar contexto (truncar se for absurdamente grande, ex: > 50k chars)
    const context = extractedText.substring(0, 50000);

    // 3. Chamar IA para gerar conteúdo
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) throw new Error('Configuração de IA ausente.');

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

    const resData = await groqRes.json();
    const content = JSON.parse(resData.choices?.[0]?.message?.content || '{"flashcards":[], "questions":[]}');

    // 4. Garantir que o "Exame" de materiais existe
    let materialExam = await (prisma as any).exam.findFirst({
      where: { name: 'Meus Materiais' }
    });

    if (!materialExam) {
      materialExam = await (prisma as any).exam.create({
        data: {
          name: 'Meus Materiais',
          organization: 'Upload Pessoal',
          area: 'Personalizado',
          level: 'Vários',
          status: 'Ativo'
        }
      });
    }

    // 5. Salvar Flashcards
    const savedFlashcards = [];
    if (content.flashcards) {
      for (const fc of content.flashcards) {
        const saved = await (prisma as any).flashcard.create({
          data: {
            userId: authUser.id,
            cardType: 'classic',
            front: fc.front,
            back: fc.back
          }
        });
        savedFlashcards.push(saved);
      }
    }

    // 6. Salvar Questões
    const savedQuestions = [];
    if (content.questions) {
      for (const q of content.questions) {
        const saved = await (prisma as any).question.create({
          data: {
            text: q.text,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            subject: 'Meus Materiais',
            difficulty: 'Médio',
            examId: materialExam.id
          }
        });
        savedQuestions.push(saved);
      }
    }

    return NextResponse.json({
      message: 'Material processado com sucesso!',
      flashcardsCount: savedFlashcards.length,
      questionsCount: savedQuestions.length,
      examId: materialExam.id
    });

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ message: 'Erro ao processar PDF: ' + error.message }, { status: 500 });
  }
}
