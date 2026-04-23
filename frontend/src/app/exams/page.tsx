"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Building2, ChevronRight, Briefcase, Loader2, X, Info, Target, Landmark, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

const STATES = [
  "Todos", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO", "Nacional"
];

export default function ExamsPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("Todos");
  const [filterState, setFilterState] = useState("Todos");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [filterState, filterArea]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post("/exams/sync");
      await fetchExams();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleGeneratePlan = async (examId: string) => {
    setGenerating(true);
    try {
      await api.post("/plans/generate", { examId });
      window.location.href = "/dashboard";
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = "/login";
      } else {
        alert("Erro ao gerar plano de estudos. Tente novamente.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get("/exams", {
        params: {
          state: filterState,
          area: filterArea
        }
      });
      setExams(response.data);
    } catch (error) {
      console.error("Erro ao carregar concursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => 
    searchTerm === "" || exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const areas = ["Todos", "Policial", "Jurídica", "Bancária", "Administrativa", "Vestibular"];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Concursos e Vestibulares</h1>
          <p className="text-muted-foreground font-medium italic">Editais reais e provas anteriores monitoradas.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border-2 border-border"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </button>

          <button 
            onClick={async () => {
              setSyncing(true);
              try {
                await api.post("/exams/sync-enem");
                await fetchExams();
              } catch (error) {
                console.error("Erro ao sincronizar Enem:", error);
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600/10 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600/20 transition-all border-2 border-indigo-600/20"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Sincronizar Enem
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome do concurso..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-card outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-card outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none cursor-pointer"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
            >
              {STATES.map(uf => (
                <option key={uf} value={uf}>{uf === "Todos" ? "Todos os Estados" : uf}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {areas.map(area => (
            <button 
              key={area}
              onClick={() => setFilterArea(area)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                filterArea === area 
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="font-bold text-muted-foreground">Carregando editais...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.length > 0 ? filteredExams.map((exam, i) => (
            <motion.div 
              key={exam.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedExam(exam)}
              className="group p-6 bg-card border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    exam.status === 'Aberto' ? 'bg-green-500/10 text-green-600' : 
                    exam.status === 'Previsto' ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-600'
                  }`}>
                    {exam.status}
                  </div>
                  <h3 className="text-xl font-black group-hover:text-primary transition-colors">{exam.name}</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {exam.organization}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {exam.state}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    {exam.area}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(exam.date).toLocaleDateString() || "À definir"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGeneratePlan(exam.id);
                  }}
                  disabled={generating}
                  className="flex-1 md:flex-none px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-black shadow-xl shadow-primary/20 group-hover:scale-105 transition-all disabled:opacity-50"
                 >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar Plano"}
                 </button>
                 <ChevronRight className="h-6 w-6 text-muted-foreground hidden md:block group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )) : (
            <div className="p-12 text-center bg-card border rounded-[2rem] border-dashed">
              <p className="text-muted-foreground font-bold">Nenhum concurso encontrado para os filtros selecionados.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExam(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-card border-l shadow-2xl rounded-[2.5rem] md:rounded-r-none flex flex-col overflow-hidden"
            >
              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedExam.status === 'Aberto' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      {selectedExam.status}
                    </div>
                    <h2 className="text-3xl font-black leading-tight">{selectedExam.name}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedExam(null)}
                    className="p-3 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-muted/30 rounded-3xl space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vagas Previstas</p>
                    <p className="text-2xl font-black text-primary">{selectedExam.vacancies || "---"}</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inscrição</p>
                    <p className="text-2xl font-black text-primary">{selectedExam.fee ? `R$ ${selectedExam.fee}` : "Grátis"}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="flex items-center gap-2 font-black text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Informações Gerais
                  </h4>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-bold">Banca Organizadora</span>
                      </div>
                      <span className="text-sm font-black">{selectedExam.organization}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-bold">Escolaridade</span>
                      </div>
                      <span className="text-sm font-black">{selectedExam.level}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-bold">Data da Prova</span>
                    </div>
                    <span className="text-sm font-black">
                      {selectedExam.examDate ? new Date(selectedExam.examDate).toLocaleDateString() : "A definir"}
                    </span>
                  </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-black text-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Matérias Exigidas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedExam.subjects as string[] || ["Conhecimentos Gerais", "Português", "Raciocínio Lógico"]).map(sub => (
                      <span key={sub} className="px-4 py-2 bg-muted rounded-xl text-xs font-bold border">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => handleGeneratePlan(selectedExam.id)}
                  disabled={generating}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-3xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Gerar Plano de Estudos"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
