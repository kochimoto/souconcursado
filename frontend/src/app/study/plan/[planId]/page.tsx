"use client";

import { useState, useEffect, use } from "react";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  RefreshCcw,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

export default function StudyPlanDetails({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"progress" | "schedule">("progress");

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/plans/${planId}`);
      setPlan(response.data);
    } catch (error) {
      console.error("Erro ao buscar plano:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncProgress = async () => {
    setSyncing(true);
    try {
      const response = await api.post(`/plans/${planId}/sync`);
      setPlan(response.data.plan);
      if (response.data.levelUps.length > 0) {
        alert(`Parabéns! Você subiu de nível em: ${response.data.levelUps.map((l: any) => l.subject).join(", ")}`);
      }
    } catch (error) {
       console.error("Erro ao sincronizar progresso:", error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-bold text-muted-foreground italic">Organizando seu plano personalizado...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-bold">Plano não encontrado.</p>
        <Link href="/dashboard" className="text-primary underline font-bold italic">Voltar ao Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in mb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black uppercase italic text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{plan.exam.name}</h1>
            <p className="text-muted-foreground font-bold">Plano personalizado baseado no seu nível e desempenho real.</p>
          </div>
        </div>
        <button 
          onClick={syncProgress}
          disabled={syncing}
          className="flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-3xl font-black uppercase italic text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.05] transition-all disabled:opacity-50"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Sincronizar Progresso
        </button>
      </div>

      {/* Main Progress Bar */}
      <div className="p-8 bg-card border-4 border-primary/10 rounded-[3rem] shadow-2xl shadow-primary/5">
        <div className="flex justify-between items-end mb-4">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Progresso Geral</p>
              <h2 className="text-3xl font-black italic tracking-tighter">{Math.round(plan.progress)}%</h2>
           </div>
           <div className="flex gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                 <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase italic tracking-widest border border-green-500/20">{plan.status}</span>
              </div>
           </div>
        </div>
        <div className="w-full bg-muted h-4 rounded-full overflow-hidden">
           <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${plan.progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="bg-primary h-full shadow-[0_0_20px_rgba(var(--primary),0.5)]"
           />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
         <button 
           onClick={() => setActiveTab("progress")}
           className={`px-8 py-4 font-black uppercase italic text-sm tracking-tighter transition-all relative ${
             activeTab === "progress" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
           }`}
         >
           Tópicos de Estudo
           {activeTab === "progress" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
         </button>
         <button 
           onClick={() => setActiveTab("schedule")}
           className={`px-8 py-4 font-black uppercase italic text-sm tracking-tighter transition-all relative ${
             activeTab === "schedule" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
           }`}
         >
           Cronograma Semanal
           {activeTab === "schedule" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
         </button>
      </div>

      {activeTab === "progress" ? (
        <div className="grid gap-4">
          {(plan.contentBlocks as any[]).map((block, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-card border-2 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    block.userLevel === 3 ? 'bg-yellow-500/10 text-yellow-600' : 
                    block.userLevel === 2 ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-500'
                  }`}>
                    {block.userLevel === 1 ? "Iniciante" : block.userLevel === 2 ? "Intermediário" : "Avançado"}
                  </span>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">{block.subject}</h3>
                </div>
                
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {block.weeklyHours}h/semana
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Target className="h-4 w-4" />
                      Foco: {block.difficulty}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {block.correctAnswers}/{block.totalAnswers} acertos
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <Link href={`/study/questions?subject=${block.subject}&difficulty=${block.difficulty}`}>
                    <button className="flex-1 md:flex-none px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                       Estudar Agora
                    </button>
                 </Link>
                 <div className="p-2 bg-muted rounded-full">
                    {block.status === 'done' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
           <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0 mt-1" />
              <div>
                 <p className="font-black uppercase italic text-sm text-yellow-700 tracking-tighter">Foco na Constância</p>
                 <p className="text-xs text-yellow-700 font-bold leading-relaxed mt-1">Este cronograma ajusta a dificuldade das matérias nas semanas finais para maximizar sua retenção perto da prova.</p>
              </div>
           </div>

           {[1, 2, 3, 4].map((week) => (
             <div key={week} className="space-y-4">
                <h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                   <span className="w-10 h-10 bg-muted rounded-full flex items-center justify-center not-italic font-bold text-sm">{week}ª</span>
                   Semana
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {(plan.weeklySchedule as any[]).filter(s => s.week === week).map((item, j) => (
                     <div key={j} className="p-5 bg-card border-2 rounded-3xl hover:border-primary/20 transition-all group">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-2">{item.subject}</p>
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold">{item.hours}h</span>
                           </div>
                           <span className="text-[9px] font-black uppercase italic px-2 py-0.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              {item.targetDifficulty}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
