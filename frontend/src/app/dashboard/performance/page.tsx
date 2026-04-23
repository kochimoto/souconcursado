"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  BarChart2, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  Target,
  Loader2,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

export default function PerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, profileRes] = await Promise.all([
        api.get("/questions/stats"),
        api.get("/auth/profile").catch(() => ({ data: null }))
      ]);
      setSubjectStats(statsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados de performance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-bold text-muted-foreground italic tracking-widest uppercase text-[10px]">Analisando seu desempenho...</p>
      </div>
    );
  }

  const totalSolved = subjectStats.reduce((acc: number, s: any) => acc + s.totalAnswered, 0);
  const totalCorrect = subjectStats.reduce((acc: number, s: any) => acc + s.totalCorrect, 0);
  const avgAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  const studyHours = Math.round(((profile?.studyTimeMinutes || 0) / 60) * 10) / 10;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12 animate-fade-in mb-20">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black uppercase italic text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Análise de Performance</h1>
          <p className="text-muted-foreground font-bold italic tracking-tight">Visão detalhada do seu progresso por matéria e tempo de estudo.</p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-8 bg-card border-2 border-primary/20 rounded-[3rem] shadow-xl shadow-primary/5">
           <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                 <Target className="h-6 w-6 text-primary" />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Taxa de Acerto</p>
           </div>
           <p className="text-4xl font-black italic tracking-tighter">{avgAccuracy}%</p>
        </div>
        <div className="p-8 bg-card border-2 border-green-500/20 rounded-[3rem] shadow-xl shadow-green-500/5">
           <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-500/10 rounded-2xl">
                 <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Questões</p>
           </div>
           <p className="text-4xl font-black italic tracking-tighter">{totalSolved}</p>
        </div>
        <div className="p-8 bg-card border-2 border-purple-500/20 rounded-[3rem] shadow-xl shadow-purple-500/5">
           <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl">
                 <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Tempo Total</p>
           </div>
           <p className="text-4xl font-black italic tracking-tighter">{studyHours}h</p>
        </div>
      </div>

      {/* Detailed Subject Stats */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <BarChart2 className="h-6 w-6 text-primary" />
          Desempenho por Matéria
        </h3>
        <div className="grid gap-6">
          {subjectStats.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-8 bg-card border-2 rounded-[2.5rem] hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
                 <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                       <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">{item.subject}</h4>
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.currentLevel === 3 ? 'bg-yellow-500/10 text-yellow-600' : 
                          item.currentLevel === 2 ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          Nível {item.levelLabel}
                       </span>
                    </div>
                    <div className="flex gap-8">
                       <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Acertos</p>
                          <p className="text-lg font-black italic">{item.totalCorrect}/{item.totalAnswered}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Precisão</p>
                          <p className="text-lg font-black italic text-primary">{item.accuracy}%</p>
                       </div>
                    </div>
                 </div>
                 <div className="w-full md:w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-1000" 
                      style={{ width: `${item.accuracy}%` }}
                    />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
