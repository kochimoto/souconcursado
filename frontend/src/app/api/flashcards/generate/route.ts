// frontend/src/app/api/flashcards/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return unauthorized();

  try {
    const { topic, quantity = 5 } = await request.json();
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({ message: 'GROQ_API_KEY não configurada na Vercel.' }, { status: 500 });
    }

    const prompt = `Você é um especialista em concursos públicos brasileiros.
Gere ${quantity} flashcards de alta qualidade sobre o tema: "${topic}".
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

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Você é um assistente que gera apenas JSON de flashcards." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      throw new Error(`Groq API Error (${groqRes.status}): ${errorText}`);
    }

    const data = await groqRes.json();
    const content = JSON.parse(data.choices?.[0]?.message?.content || '{"flashcards": []}');
    const generatedCards = content.flashcards || [];

    const savedCards = [];
    for (const card of generatedCards) {
      try {
        // Define a revisão para 5 minutos atrás para garantir que apareça na hora
        const immediateReview = new Date(Date.now() - 300000);

        // @ts-ignore
        const saved = await prisma.flashcard.create({
          data: {
            userId: authUser.id,
            cardType: card.cardType || 'classic',
            front: card.front || "",
            back: card.back || "",
            clozeText: card.clozeText || "",
            // Garante que clozeAnswers seja um JSON válido ou array vazio
            clozeAnswers: Array.isArray(card.clozeAnswers) ? card.clozeAnswers : [],
            nextReview: immediateReview
          }
        });
        savedCards.push(saved);
      } catch (dbError: any) {
        console.error('Erro ao salvar card no banco:', dbError.message);
      }
    }

    return NextResponse.json({ 
      message: `${savedCards.length} flashcards gerados!`,
      cards: savedCards 
    });

  } catch (error: any) {
    console.error('[/api/flashcards/generate] Erro Fatal:', error.message);
    return NextResponse.json(
      { message: 'Erro na geração', detail: error.message },
      { status: 500 }
    );
  }
}
