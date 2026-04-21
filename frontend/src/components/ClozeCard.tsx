"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Send } from "lucide-react";
import { motion } from "framer-motion";

interface ClozeCardProps {
  clozeText: string;
  answers: string[];
  onComplete: (isCorrect: boolean) => void;
}

export default function ClozeCard({ clozeText, answers, onComplete }: ClozeCardProps) {
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(answers.length).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  // Split text by "_____"
  const parts = clozeText.split("_____");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;

    const newResults = userAnswers.map((ans, i) => 
      ans.trim().toLowerCase() === answers[i].trim().toLowerCase()
    );
    
    setResults(newResults);
    setSubmitted(true);
    
    const allCorrect = newResults.every(r => r === true);
    onComplete(allCorrect);
  };

  return (
    <div className="bg-card border-2 border-primary/20 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-primary/5 min-h-[24rem] flex flex-col justify-center">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="text-xl md:text-2xl font-medium leading-relaxed text-left">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <input
                  type="text"
                  value={userAnswers[i]}
                  onChange={(e) => {
                    const newAns = [...userAnswers];
                    newAns[i] = e.target.value;
                    setUserAnswers(newAns);
                  }}
                  disabled={submitted}
                  className={`inline-block mx-2 px-3 py-1 border-b-2 bg-transparent outline-none transition-all text-center min-w-[120px] ${
                    submitted 
                      ? results[i] 
                        ? "border-green-500 text-green-600 font-bold" 
                        : "border-red-500 text-red-600 font-bold"
                      : "border-primary/40 focus:border-primary"
                  }`}
                  placeholder={submitted ? answers[i] : "preecha aqui"}
                />
              )}
            </span>
          ))}
        </div>

        {!submitted ? (
          <button 
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all mx-auto"
          >
            <Send className="h-5 w-5" />
            Verificar Resposta
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-bold ${
              results.every(r => r === true) 
                ? "bg-green-500/10 text-green-600" 
                : "bg-red-500/10 text-red-600"
            }`}
          >
            {results.every(r => r === true) ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
            {results.every(r => r === true) ? "Excelente! Você acertou tudo." : "Quase lá! Veja as respostas acima."}
          </motion.div>
        )}
      </form>
    </div>
  );
}
