// frontend/src/app/study/questions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, ArrowRight, BookOpen, Clock, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function StudyPage() {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [subjectParam, setSubjectParam] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sub = urlParams.get('subject') || 'Direito Constitucional';
    setSubjectParam(sub);
    fetchQuestion(sub);
    fetchStats(sub);
  }, []);

  const fetchStats = async (sub: string) => {
    try {
      const response = await api.get('/questions/stats');
      const subjectStat = response.data.find((s: any) => s.subject === sub);
      setStats(subjectStat || { totalAnswered: 0, currentLevel: 1 });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchQuestion = async (sub: string = subjectParam, forceAI = false) => {
    setLoading(true);
    setQuestion(null);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowExplanation(false);

    try {
      const useAI = forceAI || isAIMode;

      if (!useAI) {
        const response = await api.get('/questions', {
          params: { subject: sub, limit: 1 },
        });

        if (response.data && response.data.length > 0) {
          setQuestion(response.data[0]);
          setLoading(false);
          return;
        }
        setIsAIMode(true);
      }

      const response = await api.get('/questions/adaptive', {
        params: { topic: sub, level: stats?.currentLevel || 1 },
      });
      setQuestion(response.data);
    } catch (error) {
      console.error('Erro ao carregar questão:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedOption !== null && question) {
      try {
        await api.post("/questions/attempt", {
          questionId: question.id,
          chosenOption: selectedOption
        });
        setIsSubmitted(true);
        fetchStats(subjectParam);
      } catch (error) {
        console.error("Erro ao enviar resposta:", error);
        setIsSubmitted(true);
      }
    }
  };

  const getLevelTarget = (level: number) => {
    if (level <= 3) return 20; // Fácil
    if (level <= 7) return 35; // Médio
    return 50; // Difícil
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-bold text-muted-foreground italic">
          {isAIMode ? "A IA está gerando sua questão adaptativa..." : "Buscando próxima questão..."}
        </p>
      </div>
    );
  }

  const target = getLevelTarget(stats?.currentLevel || 1);
  const currentProgress = stats?.totalAnswered || 0;
  const progressPercent = Math.min(100, (currentProgress / target) * 100);
  const isMetaConcluida = currentProgress >= target;

  if (!question && !isMetaConcluida) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 gap-4">
        <p className="text-xl font-bold">Nenhuma questão encontrada.</p>
        <button 
          onClick={() => fetchQuestion()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (isMetaConcluida) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-8 animate-fade-in">
        <div className="relative">
          <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-xl"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Missão Cumprida!</h2>
          <p className="text-muted-foreground font-bold max-w-md mx-auto">
            Você completou o ciclo de {target} questões de <span className="text-primary">{subjectParam}</span> no nível {target === 20 ? "Fácil" : target === 35 ? "Médio" : "Difícil"}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-6 bg-card border-2 rounded-3xl">
             <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Resolvidas</p>
             <p className="text-2xl font-black">{currentProgress}</p>
          </div>
          <div className="p-6 bg-card border-2 rounded-3xl">
             <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Nível Atual</p>
             <p className="text-2xl font-black">{stats?.currentLevel || 1}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="w-full px-8 py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Voltar ao Dashboard
          </button>
          <button 
            onClick={() => {
              // Poderíamos incrementar o nível aqui se quiséssemos
              window.location.reload();
            }}
            className="w-full px-8 py-5 bg-muted text-muted-foreground rounded-2xl font-black uppercase italic tracking-widest hover:bg-muted/80 transition-all"
          >
            Estudar Mais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Progress Bar Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso no Nível {stats?.currentLevel || 1}</p>
            <h2 className="text-xl font-black italic tracking-tighter">Questão {currentProgress}/{target}</h2>
          </div>
          <div className="text-right">
             <span className={cn(
               "px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest border",
               target === 20 ? "bg-green-500/10 text-green-600 border-green-500/20" :
               target === 35 ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
               "bg-purple-500/10 text-purple-600 border-purple-500/20"
             )}>
               Nível: {target === 20 ? "Fácil" : target === 35 ? "Médio" : "Difícil"}
             </span>
          </div>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
           <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
           />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">{question.subject}</h1>
              {(question.id.startsWith('ai_') || isAIMode) && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-600 text-[9px] font-black uppercase rounded-full border border-indigo-500/20">
                  <Sparkles className="h-2 w-2" />
                  Gerado por IA
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
              {question.exam?.name || "Banco de Questões"} • {question.exam?.organization || "Geral"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAIMode(!isAIMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
              isAIMode ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-card border-border text-muted-foreground hover:border-primary/30"
            )}
          >
            <Sparkles className={cn("h-3 w-3", isAIMode ? "animate-pulse" : "")} />
            IA {isAIMode ? "ON" : "OFF"}
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <Clock className="h-3 w-3" />
            {question.difficulty}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="p-8 bg-card border rounded-[2rem] shadow-sm">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold uppercase tracking-widest bg-muted rounded-full">
            Questão {question.id.split('-')[0].toUpperCase()}
          </span>
          <p className="text-lg md:text-xl font-medium leading-relaxed">{question.text}</p>
        </div>

        <div className="space-y-3">
          {(question.options as string[]).map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === question.correctOption;
            
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
            <button 
              onClick={() => fetchQuestion()}
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-bold shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
            >
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
                {question.explanation || "Sem comentário disponível para esta questão."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
