"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  BarChart2, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  BookOpen,
  History,
  Loader2,
  Medal,
  Target
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    solved: 0,
    accuracy: 0,
    hours: 0,
    flashcards: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, plansRes] = await Promise.all([
        api.get("/questions/stats"),
        api.get("/plans/me")
      ]);
      
      setSubjectStats(statsRes.data);
      setPlans(plansRes.data);
      
      // Calculate overall stats
      const totalSolved = statsRes.data.reduce((acc: number, s: any) => acc + s.totalAnswered, 0);
      const totalCorrect = statsRes.data.reduce((acc: number, s: any) => acc + s.totalCorrect, 0);
      const avgAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
      
      setOverallStats({
        solved: totalSolved,
        accuracy: avgAccuracy,
        hours: plansRes.data.reduce((acc: number, p: any) => acc + (p.totalHours || 0), 0),
        flashcards: 0 // Will implement flashcard stats later
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Questões Resolvidas", value: overallStats.solved, icon: <CheckCircle2 className="text-green-500" /> },
    { label: "Taxa de Acerto", value: `${overallStats.accuracy}%`, icon: <TrendingUp className="text-blue-500" /> },
    { label: "Horas de Estudo", value: `${overallStats.hours}h`, icon: <Clock className="text-purple-500" /> },
    { label: "Flashcards Meta", value: "0/30", icon: <Zap className="text-yellow-500" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-bold text-muted-foreground">Carregando seus dados de aprovação...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
            E aí, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground font-bold mt-2">
            Sua meta para hoje: revisar os flashcards pendentes e bater 70% em Português.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 px-5 bg-card border-2 border-primary rounded-2xl flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Nível</p>
                <p className="text-xl font-black italic">{user?.level || 1}</p>
             </div>
          </div>
          <div className="p-2 px-5 bg-card border-2 border-yellow-500/30 rounded-2xl flex items-center gap-3">
             <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Medal className="h-5 w-5 text-white" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">XP</p>
                <p className="text-xl font-black italic">{user?.xp || 0}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-card border-2 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">{stat.icon}</div>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black italic tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <Link href="/study/questions" className="group">
              <div className="h-full p-8 bg-primary text-primary-foreground rounded-[3rem] hover:scale-[1.02] transition-all flex flex-col justify-between overflow-hidden relative shadow-2xl shadow-primary/20">
                <BookOpen className="h-20 w-20 mb-8 opacity-10 absolute -right-4 -top-4 rotate-12" />
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Praticar Questões</h3>
                  <p className="text-primary-foreground/80 font-bold text-sm leading-relaxed">Filtre por matéria e banca. <br/> Evolua seu nível real.</p>
                </div>
                <div className="flex items-center gap-2 mt-8 font-black uppercase italic text-xs tracking-widest border-t border-primary-foreground/20 pt-6">
                  Começar Agora <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
            <Link href="/study/flashcards" className="group">
              <div className="h-full p-8 bg-card border-4 border-indigo-600 text-indigo-600 rounded-[3rem] hover:scale-[1.02] transition-all flex flex-col justify-between overflow-hidden relative">
                <Zap className="h-20 w-20 mb-8 opacity-5 absolute -right-4 -top-4 rotate-12" />
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Flashcards</h3>
                  <p className="text-muted-foreground font-bold text-sm leading-relaxed">Repetição espaçada inteligente. <br/> Memorize e nunca mais esqueça.</p>
                </div>
                <div className="flex items-center gap-2 mt-8 font-black uppercase italic text-xs tracking-widest border-t border-indigo-600/10 pt-6">
                  Revisar Hoje <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* Ranking por Matéria */}
          <div className="p-8 bg-card border-2 rounded-[3.5rem] shadow-xl shadow-primary/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" />
                Desempenho por Matéria
              </h3>
            </div>
            <div className="grid gap-6">
              {subjectStats.length > 0 ? subjectStats.map((item, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.subject}</span>
                       <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                         item.currentLevel === 3 ? 'bg-yellow-500/10 text-yellow-600' : 
                         item.currentLevel === 2 ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-500'
                       }`}>
                          {item.levelLabel}
                       </span>
                    </div>
                    <span className="text-sm font-black italic">{item.accuracy}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex gap-0.5">
                     <div 
                      className="bg-primary h-full transition-all duration-1000" 
                      style={{ width: `${item.accuracy}%` }}
                     />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground">{item.totalAnswered} questões resolvidas</p>
                </div>
              )) : (
                <p className="text-muted-foreground font-bold text-center py-8 italic">Você ainda não resolveu questões suficentes para gerar estatísticas.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Study Plans */}
        <div className="space-y-8">
          <div className="p-8 bg-card border-2 rounded-[3.5rem] shadow-xl shadow-primary/5">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              Sua Jornada
            </h3>
            <div className="space-y-6">
              {plans.length > 0 ? plans.map((plan) => (
                <Link href={`/study/plan/${plan.id}`} key={plan.id}>
                  <div className="group p-5 bg-muted/30 rounded-[2rem] border-2 border-transparent hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-black uppercase italic tracking-tighter">{plan.exam.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">{plan.totalHours || 0}h</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-1000" 
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                       <p className="text-[9px] font-black uppercase text-primary italic tracking-widest">{plan.progress}% concluído</p>
                       <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all mr-2" />
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="p-6 text-center space-y-4">
                   <p className="text-sm text-muted-foreground font-bold italic">Nenhum plano ativo.</p>
                   <Link href="/exams">
                      <button className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                        Criar Primeiro Plano
                      </button>
                   </Link>
                </div>
              )}
            </div>
            {plans.length > 0 && (
              <Link href="/exams">
                <button className="w-full mt-8 py-4 bg-card border-2 border-primary text-primary rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-primary/5 transition-all">
                  Explorar Novos Concursos
                </button>
              </Link>
            )}
          </div>

          <div className="p-8 bg-card border-2 rounded-[3.5rem] shadow-xl shadow-primary/5 overflow-hidden relative">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6">Próxima Revisão</h3>
            <div className="space-y-4 relative z-10">
               <div className="p-4 bg-indigo-600/5 rounded-2xl border border-indigo-600/10">
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">Informática</p>
                  <p className="text-sm font-bold">Hardware e Redes</p>
                  <p className="text-xs text-muted-foreground mt-2">12 cartões hoje</p>
               </div>
            </div>
            <Zap className="h-24 w-24 text-indigo-600/5 absolute -right-6 -bottom-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
