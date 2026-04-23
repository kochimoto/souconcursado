// frontend/src/app/study/questions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, ArrowRight, BookOpen, Clock, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";

const getLevelTarget = (level: number) => {
  if (level <= 3) return 20; // Fácil
  if (level <= 7) return 35; // Médio
  return 50; // Difícil
};

export default function StudyPage() {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [subjectParam, setSubjectParam] = useState("");
  const [subtopicParam, setSubtopicParam] = useState("");
  const [showTimerModal, setShowTimerModal] = useState(true);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const target = getLevelTarget(stats?.currentLevel || 1);
  const currentProgress = stats?.totalAnswered || 0;
  const progressPercent = Math.min(100, (currentProgress / target) * 100);
  const isMetaConcluida = currentProgress >= target;

  useEffect(() => {
    if (startTime && !isMetaConcluida) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(diffInSeconds);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isMetaConcluida]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const displaySeconds = elapsedSeconds % 60;

  const saveStudyTime = async () => {
    if (!startTime) return;
    try {
      const total = Math.max(1, Math.floor(elapsedSeconds / 60));
      await api.post("/study/track", { minutes: total });
    } catch (err) {
      console.error("Erro ao salvar tempo:", err);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sub = urlParams.get('subject') || 'Direito Constitucional';
    const subtopic = urlParams.get('subtopic') || "";
    setSubjectParam(sub);
    setSubtopicParam(subtopic);
    fetchQuestion(sub, false, subtopic);
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

  const fetchQuestion = async (sub: string = subjectParam, forceAI = false, subtopic: string = subtopicParam) => {
    setLoading(true);
    setQuestion(null);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowExplanation(false);

    try {
      const useAI = forceAI || isAIMode;

      const response = await api.get('/questions/adaptive', {
        params: { 
          topic: sub, 
          level: stats?.currentLevel || 1,
          subtopic: subtopic,
          useAI: useAI
        },
      });
      setQuestion(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar questão:', error);
      if (error.response?.status === 404) {
        setQuestion({ 
          error: true, 
          message: error.response.data.message || "Fim das questões nesta categoria.",
          needsAI: error.response.data.needsAI
        });
      }
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



  if (question?.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 gap-6 max-w-lg mx-auto">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-bold uppercase italic tracking-tighter">Biblioteca Esgotada</p>
          <p className="text-muted-foreground font-medium italic">
            Não encontramos mais questões de <span className="text-primary">{subtopicParam || subjectParam}</span> na nossa biblioteca oficial.
          </p>
        </div>
        
        {question.needsAI && (
          <div className="p-6 bg-indigo-600/5 border-2 border-indigo-600/10 rounded-3xl space-y-4">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Deseja que a nossa IA gere questões inéditas para você continuar estudando este tópico?</p>
            <button 
              onClick={() => {
                setIsAIMode(true);
                fetchQuestion(subjectParam, true, subtopicParam);
              }}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Ativar IA e Gerar Questão
            </button>
          </div>
        )}
        
        <Link href="/dashboard" className="text-xs font-bold text-muted-foreground underline uppercase tracking-widest hover:text-primary transition-colors">
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

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
            onClick={() => {
              saveStudyTime();
              window.location.href = "/dashboard";
            }}
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
      {/* Timer Selection Modal */}
      <AnimatePresence>
        {showTimerModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border-4 border-primary/10 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Meta de Tempo</h2>
              <p className="text-muted-foreground font-bold mb-8">Quanto tempo você dedicará às questões agora?</p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[15, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => setTargetMinutes(min)}
                    className={cn(
                      "py-6 rounded-3xl text-xl font-black italic border-4 transition-all",
                      targetMinutes === min ? "bg-primary border-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-105" : "bg-muted border-transparent text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    {min} min
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  setStartTime(Date.now());
                  setShowTimerModal(false);
                }}
                className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-black uppercase italic tracking-widest text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Iniciar Sessão
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Bar Header */}
      <div className="space-y-4">
        {startTime && (
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/20 animate-pulse">
              Tempo: {elapsedMinutes}:{displaySeconds.toString().padStart(2, '0')} / {targetMinutes}:00
            </div>
          </div>
        )}
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
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">
                {subtopicParam || question.subject}
              </h1>
              {(isAIMode || subtopicParam !== "") && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-600 text-[9px] font-black uppercase rounded-full border border-indigo-500/20">
                  <Sparkles className="h-2 w-2" />
                  Biblioteca • Adaptativa
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
        <div className="p-8 bg-card border rounded-[2rem] shadow-sm space-y-6">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold uppercase tracking-widest bg-muted rounded-full">
            Questão {question.id.split('-')[0].toUpperCase()}
          </span>
          
          <div className="space-y-6">
            {question.text.split(/(!\[.*?\]\(.*?\))/g).map((part: string, i: number) => {
              const match = part.match(/!\[.*?\]\((.*?)\)/);
              if (match) {
                return (
                  <div key={i} className="relative rounded-2xl overflow-hidden border-2 border-muted my-4">
                    <img 
                      src={match[1]} 
                      alt="Imagem da questão"
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                  </div>
                );
              }
              return (
                <p key={i} className="text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                  {part}
                </p>
              );
            })}
          </div>
          
          {question.files && Array.isArray(question.files) && question.files.length > 0 && (
            <div className="grid gap-4 mt-6">
              {(question.files as string[]).map((url, idx) => {
                // Evita duplicar se já foi extraído do texto via regex
                if (question.text.includes(url)) return null;
                return (
                  <div key={idx} className="relative rounded-2xl overflow-hidden border-2 border-muted group">
                    <img 
                      src={url} 
                      alt={`Imagem complementar ${idx + 1}`}
                      className="w-full h-auto object-contain max-h-[500px] hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                );
              })}
            </div>
          )}
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
                {showExplanation ? "Ocultar Dica" : "Ver Dica do Professor"}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative p-8 bg-gradient-to-br from-card to-muted/20 rounded-[2.5rem] border-2 border-primary/10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="h-24 w-24 text-primary" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-black italic uppercase tracking-tighter text-lg leading-none">Dica do Especialista</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Análise Técnica da Questão</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base font-medium">
                    {question.explanation || "Esta questão exige uma análise detalhada do contexto apresentado e a aplicação direta dos conceitos da matéria. Foque na interpretação correta dos termos-chave."}
                  </p>
                  
                  {question.id.startsWith('ai_') && (
                    <div className="pt-4 border-t border-dashed border-primary/20">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                        Explicação gerada por inteligência artificial para este tópico.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
