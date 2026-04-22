// frontend/src/app/api/flashcards/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { topic } = await request.json();
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      throw new Error('GROQ_API_KEY não configurada');
    }

    const prompt = `Você é um especialista em concursos públicos brasileiros.
Gere 5 flashcards de alta qualidade sobre o tema: "${topic}".
Misture cartões clássicos (frente/verso) e cartões Cloze (lacunas).

A resposta DEVE ser um objeto JSON puro com esta estrutura:
{
  "flashcards": [
    {
      "cardType": "classic",
      "front": "Pergunta clara",
      "back": "Resposta concisa"
    },
    {
      "cardType": "cloze",
      "clozeText": "Texto com lacuna usando {{c1::resposta}} no meio.",
      "clozeAnswers": ["resposta"]
    }
  ]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Você é um gerador de flashcards para concursos em formato JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error ${response.status}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices?.[0]?.message?.content || '{"flashcards": []}');
    const generatedCards = content.flashcards || [];

    // Salvar no banco de dados de forma resiliente
    const savedCards = [];
    for (const card of generatedCards) {
      try {
        const saved = await (prisma as any).flashcard.create({
          data: {
            userId: authUser.id,
            cardType: card.cardType || 'classic',
            front: card.front || "",
            back: card.back || "",
            clozeText: card.clozeText || "",
            clozeAnswers: card.clozeAnswers || [],
            nextReview: new Date()
          }
        });
        savedCards.push(saved);
      } catch (err) {
        console.error('Erro ao salvar card individual:', err);
      }
    }

    if (savedCards.length === 0 && generatedCards.length > 0) {
      throw new Error('Falha ao salvar cartões no banco de dados');
    }

    return NextResponse.json({ 
      message: `${savedCards.length} flashcards gerados com sucesso!`,
      cards: savedCards 
    });

  } catch (error: any) {
    console.error('[/api/flashcards/generate] Error:', error?.message);
    return NextResponse.json(
      { message: 'Erro ao gerar flashcards', detail: error?.message },
      { status: 500 }
    );
  }
}
