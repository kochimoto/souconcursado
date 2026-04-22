// frontend/src/components/ClozeCard.tsx
"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Send } from "lucide-react";
import { motion } from "framer-motion";

interface ClozeCardProps {
  clozeText: string;
  onComplete: (isCorrect: boolean) => void;
}

export default function ClozeCard({ clozeText, onComplete }: ClozeCardProps) {
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setUserInput("");
    setSubmitted(false);
    setIsCorrect(false);
  }, [clozeText]);

  // Regex para capturar o conteúdo dentro de {{c1::...}}
  const clozeRegex = /\{\{c\d::(.*?)\}\}/g;
  const match = clozeRegex.exec(clozeText);
  const correctAnswer = match ? match[1] : "";

  // Divide o texto para exibir o que vem antes e depois da lacuna
  const parts = clozeText.split(/\{\{c\d::.*?\}\}/);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || !correctAnswer) return;

    const correct = userInput.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    onComplete(correct);
  };

  return (
    <div className="bg-card border-2 border-primary/20 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-primary/5 min-h-[24rem] flex flex-col justify-center">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="text-xl md:text-2xl font-medium leading-relaxed text-left">
          {parts[0]}
          <input
            type="text"
            autoFocus
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={submitted}
            className={`inline-block mx-2 px-3 py-1 border-b-4 bg-primary/5 outline-none transition-all text-center min-w-[150px] rounded-t-lg ${
              submitted 
                ? isCorrect 
                  ? "border-green-500 text-green-600 font-bold bg-green-500/5" 
                  : "border-red-500 text-red-600 font-bold bg-red-500/5"
                : "border-primary/40 focus:border-primary focus:bg-primary/10"
            }`}
            placeholder={submitted ? correctAnswer : "digite aqui..."}
          />
          {parts[1]}
        </div>

        {!submitted ? (
          <button 
            type="submit"
            disabled={!userInput.trim()}
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all mx-auto disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            Verificar Resposta
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-bold ${
              isCorrect ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            }`}
          >
            {isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            {isCorrect ? "Excelente! Você acertou." : `Quase! A resposta era: ${correctAnswer}`}
          </motion.div>
        )}
      </form>
    </div>
  );
}
