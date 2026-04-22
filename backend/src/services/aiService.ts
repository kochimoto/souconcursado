// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAdaptiveQuestion = async (userLevel: number, topic: string) => {
  const prompt = `
    Você é um especialista em concursos públicos brasileiros.
    Gere uma questão de múltipla escolha inédita sobre o tema: "${topic}".
    O nível de dificuldade deve ser adaptado para um usuário de nível ${userLevel} (em uma escala de 1 a 10).
    
    A resposta deve estar em formato JSON rigoroso com a seguinte estrutura:
    {
      "title": "Título curto da questão",
      "content": "O enunciado completo da questão",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": "A opção exata que está correta",
      "explanation": "Uma explicação detalhada do porquê esta opção está correta",
      "difficulty": ${userLevel > 7 ? '"Difícil"' : userLevel > 4 ? '"Médio"' : '"Fácil"'},
      "subject": "${topic}"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Limpar markdown se houver
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro ao gerar questão com IA:", error);
    throw new Error("Falha na geração de questão por IA");
  }
};
