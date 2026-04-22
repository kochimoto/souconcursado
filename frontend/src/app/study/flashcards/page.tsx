"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RotateCcw, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import api from "@/lib/api";
import ClozeCard from "@/components/ClozeCard";

export default function FlashcardsPage() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ todayReviews: 0, dailyGoal: 30, totalCards: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showRatings, setShowRatings] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [dueRes, statsRes] = await Promise.all([
        api.get("/flashcards/due"),
        api.get("/flashcards/stats")
      ]);
      setCards(dueRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraCards = async () => {
    setLoading(true);
    try {
      const response = await api.get("/flashcards/all");
      // Filtra os que já foram revisados hoje (opcional, ou apenas pega todos)
      setCards(response.data.slice(0, 30)); 
      setSessionFinished(false);
      setCurrentCardIdx(0);
    } catch (error) {
      console.error("Erro ao carregar extras:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[currentCardIdx];

  const handleRate = async (rating: "easy" | "medium" | "hard") => {
    if (!currentCard) return;
    
    try {
      await api.patch("/flashcards/review", {
        id: currentCard.id,
        rating
      });
      
      // Update stats locally
      setStats((prev: any) => ({ ...prev, todayReviews: prev.todayReviews + 1 }));

      // Advance to next card
      if (currentCardIdx < cards.length - 1) {
        setIsFlipped(false);
        setShowRatings(false);
        setCurrentCardIdx(prev => prev + 1);
      } else {
        // Finished the current stack
        setCards([]);
        setSessionFinished(true);
      }
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
    }
  };

  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-bold text-muted-foreground">Preparando sua revisão...</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    try {
      await api.post("/flashcards/generate", { topic: genTopic });
      setShowGenModal(false);
      setGenTopic("");
      fetchInitialData(); // Reload
    } catch (error) {
      console.error("Erro ao gerar:", error);
      alert("Erro ao gerar flashcards. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const metaAtingida = stats.todayReviews >= stats.dailyGoal;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            {metaAtingida ? <Sparkles className="h-12 w-12 text-primary" /> : <Zap className="h-12 w-12 text-yellow-500" />}
          </div>
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1 rounded-full border-2 border-background">
            {stats.todayReviews}/{stats.dailyGoal}
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black">{metaAtingida ? "Meta Batida!" : "Quase lá!"}</h2>
          <p className="text-muted-foreground font-bold max-w-sm">
            {metaAtingida 
              ? "Você atingiu sua meta diária de 30 cartões! Conhecimento consolidado com sucesso." 
              : `Você revisou ${stats.todayReviews} cartões hoje. Sua meta é chegar em ${stats.dailyGoal}.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {!metaAtingida && stats.totalCards > stats.todayReviews && (
            <button 
              onClick={fetchExtraCards}
              className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5" />
              Praticar Novos Cartões
            </button>
          )}
          
          <button 
            onClick={() => setShowGenModal(true)}
            className="w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Gerar com IA
          </button>

          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="w-full px-8 py-4 bg-muted text-muted-foreground rounded-2xl font-black hover:bg-muted/80 transition-all"
          >
            Voltar ao Dashboard
          </button>
        </div>

        {/* Modal Simples de Geração */}
        <AnimatePresence>
          {showGenModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border-2 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Gerar Flashcards por IA</h3>
                <p className="text-sm text-muted-foreground font-bold mb-6">Qual assunto você deseja memorizar agora?</p>
                
                <input 
                  type="text"
                  placeholder="Ex: Hardware e Redes"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-6 py-4 bg-muted rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold mb-6"
                />

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowGenModal(false)}
                    className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={generating || !genTopic.trim()}
                    className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "Gerando..." : "Gerar Agora"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-12 animate-fade-in text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Revisão Diária</h1>
          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <span className={metaAtingida ? "text-green-500" : "text-primary"}>
              Meta: {stats.todayReviews}/{stats.dailyGoal}
            </span>
            <span className="opacity-20">•</span>
            <span>Total: {stats.totalCards} cards</span>
          </div>
        </div>
        
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden max-w-[200px]">
          <div 
            className={`h-full transition-all duration-1000 ${metaAtingida ? "bg-green-500" : "bg-primary"}`}
            style={{ width: `${Math.min(100, (stats.todayReviews / stats.dailyGoal) * 100)}%` }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="relative min-h-[24rem] w-full perspective-1000">
        {currentCard?.cardType === "cloze" ? (
          <ClozeCard 
            clozeText={currentCard.clozeText}
            answers={currentCard.clozeAnswers}
            onComplete={() => setShowRatings(true)}
          />
        ) : (
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full h-[24rem] preserve-3d cursor-pointer"
            onClick={() => {
              if (!showRatings) {
                setIsFlipped(!isFlipped);
                if (!isFlipped) setShowRatings(true);
              }
            }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-card border-2 border-primary/20 rounded-[3rem] p-12 flex flex-col items-center justify-center shadow-2xl shadow-primary/5">
              <Zap className="h-10 w-10 text-primary mb-8 opacity-20" />
              <p className="text-2xl font-black leading-tight italic uppercase tracking-tighter">{currentCard?.front}</p>
              <p className="absolute bottom-10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Toque para revelar</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-primary text-primary-foreground rounded-[3rem] p-12 flex flex-col items-center justify-center shadow-2xl shadow-primary/20" style={{ transform: "rotateY(180deg)" }}>
              <p className="text-xl font-bold leading-relaxed">{currentCard?.back}</p>
              <p className="absolute bottom-10 text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest">Como foi o desempenho?</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Rating Controls */}
      <AnimatePresence>
        {showRatings && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4"
          >
            <button 
              onClick={() => handleRate("hard")}
              className="flex flex-col items-center gap-2 p-6 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-3xl border border-red-500/20 transition-all font-black uppercase italic tracking-tighter text-xs"
            >
              <AlertCircle className="h-6 w-6" />
              Difícil
              <span className="text-[9px] font-bold opacity-60 normal-case tracking-normal">Rever em 1 min</span>
            </button>
            <button 
              onClick={() => handleRate("medium")}
              className="flex flex-col items-center gap-2 p-6 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 rounded-3xl border border-yellow-500/20 transition-all font-black uppercase italic tracking-tighter text-xs"
            >
              <RotateCcw className="h-6 w-6" />
              Médio
              <span className="text-[9px] font-bold opacity-60 normal-case tracking-normal">Rever em 1 dia</span>
            </button>
            <button 
              onClick={() => handleRate("easy")}
              className="flex flex-col items-center gap-2 p-6 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-3xl border border-green-500/20 transition-all font-black uppercase italic tracking-tighter text-xs"
            >
              <CheckCircle2 className="h-6 w-6" />
              Fácil
              <span className="text-[9px] font-bold opacity-60 normal-case tracking-normal">Rever em 4 dias</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden max-w-[200px]">
          <div 
            className="bg-primary h-full transition-all duration-500" 
            style={{ width: `${((currentCardIdx + 1) / cards.length) * 100}%` }}
          />
        </div>
        <span className="font-bold">Cartão {currentCardIdx + 1}/{cards.length}</span>
      </div>

      {/* Tailwind helper for 3D */}
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
