// backend/src/services/aiService.ts

export const generateAdaptiveQuestion = async (userLevel: number, topic: string) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não configurada');
  }

  const difficulty = userLevel > 7 ? 'Difícil' : userLevel > 4 ? 'Médio' : 'Fácil';
  const prompt = `Gere uma questão de múltipla escolha inédita sobre o tema: "${topic}". Dificuldade: ${difficulty}. Retorne APENAS o JSON.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Erro na Groq:', error);
    throw error;
  }
};
