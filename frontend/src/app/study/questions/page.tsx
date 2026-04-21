"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, ArrowRight, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleQuestion = {
  id: "1",
  text: "No que se refere aos direitos e garantias fundamentais previstos na Constituição Federal de 1988, assinale a opção correta:",
  options: [
    "O direito à vida é absoluto, não comportando exceções mesmo em caso de guerra declarada.",
    "A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre.",
    "A lei penal retroagirá sempre para beneficiar ou prejudicar o réu.",
    "É livre a manifestação do pensamento, sendo permitido o anonimato."
  ],
  correct: 1,
  explanation: "O Art. 5º, XI da CF/88 estabelece que a casa é asilo inviolável, permitindo a entrada sem consentimento apenas em casos específicos como flagrante delito, desastre, prestação de socorro ou, durante o dia, por determinação judicial."
};

export default function StudyPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
    }
  };

  const isCorrect = selectedOption === sampleQuestion.correct;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Direito Constitucional</h1>
            <p className="text-sm text-muted-foreground underline">TRE-Unificado / FGV</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          Questão 1 de 20
        </div>
      </div>

      <div className="space-y-8">
        <div className="p-8 bg-card border rounded-[2rem] shadow-sm">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold uppercase tracking-widest bg-muted rounded-full">Questão 42193</span>
          <p className="text-lg md:text-xl font-medium leading-relaxed">{sampleQuestion.text}</p>
        </div>

        <div className="space-y-3">
          {sampleQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === sampleQuestion.correct;
            
            let statusClasses = "border-border hover:border-primary/50 bg-card";
            if (isSubmitted) {
              if (isCorrectOption) statusClasses = "border-green-500 bg-green-500/5 ring-1 ring-green-500";
              else if (isSelected) statusClasses = "border-red-500 bg-red-500/5 ring-1 ring-red-500 opacity-80";
              else statusClasses = "border-border opacity-50";
            } else if (isSelected) {
              statusClasses = "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/5";
            }

            return (
              <motion.button
                key={index}
                whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                onClick={() => !isSubmitted && setSelectedOption(index)}
                disabled={isSubmitted}
                className={cn(
                  "w-full p-5 text-left rounded-2xl border transition-all flex items-start gap-4 group",
                  statusClasses
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm shrink-0",
                  isSelected && !isSubmitted ? "bg-primary border-primary text-primary-foreground" : 
                  isSubmitted && isCorrectOption ? "bg-green-500 border-green-500 text-white" :
                  isSubmitted && isSelected && !isCorrectOption ? "bg-red-500 border-red-500 text-white" : "text-muted-foreground border-muted"
                )}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-sm md:text-base font-medium leading-normal">{option}</span>
                
                {isSubmitted && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto shrink-0" />}
                {isSubmitted && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-500 ml-auto shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            {!isSubmitted ? (
               <button 
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="px-10 py-3.5 bg-primary text-primary-foreground rounded-full font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all disabled:scale-100 scale-100"
              >
                Responder
              </button>
            ) : (
              <button 
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2 px-6 py-3.5 bg-muted rounded-full font-bold hover:bg-muted/80 transition-all text-sm"
              >
                <Info className="h-4 w-4" />
                {showExplanation ? "Ocultar Comentário" : "Ver Comentário"}
              </button>
            )}
          </div>

          {isSubmitted && (
            <button className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-bold shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
              Próxima Questão
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-8 bg-muted/40 rounded-[2rem] border border-dashed border-muted-foreground/30"
            >
              <h4 className="font-bold flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Dica do Professor
              </h4>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base italic">
                {sampleQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
