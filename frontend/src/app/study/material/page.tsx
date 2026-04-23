// frontend/src/app/study/material/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileUp, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Layers, 
  ArrowRight,
  AlertCircle,
  FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";

export default function MaterialPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing" | "success">("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ flashcards: 8, questions: 5 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      if (selected.size > 10 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 10MB.");
        return;
      }
      setFile(selected);
      setError(null);
    } else {
      setError("Por favor, selecione um arquivo PDF válido.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStep("uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("flashcardCount", counts.flashcards.toString());
    formData.append("questionCount", counts.questions.toString());

    try {
      // Começamos o upload
      const response = await api.post("/study/material", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.progress && progressEvent.progress > 0.9) {
             setStep("analyzing");
          }
        }
      });

      setResult(response.data);
      setStep("success");
    } catch (err: any) {
      console.error("Erro no upload:", err);
      const msg = err.response?.data?.message || "O servidor demorou muito para responder ou o arquivo é incompatível.";
      setError(msg);
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 animate-fade-in">
      <div className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Sparkles className="h-3 w-3" />
          IA Academy
        </div>
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
          Meus Materiais de Estudo
        </h1>
        <p className="text-muted-foreground font-bold max-w-2xl italic">
          Suba seus PDFs, resumos ou apostilas e deixe nossa IA criar flashcards e questões personalizadas para você.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div 
              className={cn(
                "relative group cursor-pointer border-4 border-dashed rounded-[3rem] p-12 transition-all flex flex-col items-center justify-center text-center gap-6",
                file ? "border-primary/40 bg-primary/5" : "border-muted hover:border-primary/20 hover:bg-muted/30"
              )}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input 
                type="file" 
                id="fileInput" 
                className="hidden" 
                accept=".pdf"
                onChange={handleFileChange}
              />
              
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                file ? "bg-primary text-white scale-110 shadow-2xl shadow-primary/20" : "bg-muted text-muted-foreground group-hover:scale-110"
              )}>
                {file ? <FileText className="h-10 w-10" /> : <FileUp className="h-10 w-10" />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-tight">
                  {file ? file.name : "Clique para selecionar seu PDF"}
                </h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  PDF (máximo 10MB)
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest animate-shake">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            {file && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-card border-2 rounded-[2.5rem] shadow-xl space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                        <Layers className="h-3 w-3" />
                        Flashcards
                      </label>
                      <span className="text-xl font-black italic">{counts.flashcards}</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="20" 
                      value={counts.flashcards}
                      onChange={(e) => setCounts({...counts, flashcards: parseInt(e.target.value)})}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight text-center">Quantos cartões de memória você deseja?</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                        <BookOpen className="h-3 w-3" />
                        Questões
                      </label>
                      <span className="text-xl font-black italic">{counts.questions}</span>
                    </div>
                    <input 
                      type="range" 
                      min="3" 
                      max="15" 
                      value={counts.questions}
                      onChange={(e) => setCounts({...counts, questions: parseInt(e.target.value)})}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight text-center">Quantas questões de múltipla escolha?</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className="w-full py-6 bg-primary text-primary-foreground rounded-3xl font-black uppercase italic tracking-widest text-lg shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                >
                  Começar Análise Inteligente
                  <Sparkles className="h-5 w-5" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {(step === "uploading" || step === "analyzing") && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-8"
          >
            <div className="relative">
              <div className="w-32 h-32 border-4 border-primary/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter animate-bounce">
                {step === "uploading" ? "Enviando material..." : "A IA está lendo seu documento..."}
              </h3>
              <p className="text-muted-foreground font-bold italic">
                {step === "uploading" 
                  ? "Estamos preparando seu arquivo para análise." 
                  : "Extraindo conceitos chave e criando conteúdo de estudo."}
              </p>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="p-10 bg-card border-4 border-green-500/20 rounded-[3rem] text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Material Processado!</h2>
                <p className="text-muted-foreground font-bold italic">
                  A análise foi concluída com sucesso. Veja o que criamos para você:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-muted rounded-3xl space-y-1">
                  <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                    <Layers className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Flashcards</span>
                  </div>
                  <p className="text-3xl font-black tracking-tighter">{result?.flashcardsCount}</p>
                </div>
                <div className="p-6 bg-muted rounded-3xl space-y-1">
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Questões</span>
                  </div>
                  <p className="text-3xl font-black tracking-tighter">{result?.questionsCount}</p>
                </div>
              </div>

              <div className="grid gap-3 pt-4">
                <Link 
                  href={`/study/questions?subject=Meus Materiais&examId=${result?.examId}`}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase italic tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  Estudar Questões do PDF
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/study/flashcards"
                  className="w-full py-5 bg-card border-2 border-primary/20 text-primary rounded-2xl font-black uppercase italic tracking-widest text-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                  Revisar Flashcards Novos
                  <Layers className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <button 
              onClick={() => setStep("idle")}
              className="w-full text-xs font-bold text-muted-foreground underline uppercase tracking-widest hover:text-primary transition-colors text-center"
            >
              Analisar Outro Documento
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
        <div className="p-8 bg-card border-2 rounded-[2.5rem] space-y-4">
           <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <FileSearch className="h-6 w-6 text-blue-600" />
           </div>
           <h4 className="font-black italic uppercase tracking-tight">Leitura Inteligente</h4>
           <p className="text-xs text-muted-foreground font-bold leading-relaxed">Nossa IA lê PDFs complexos e identifica os conceitos fundamentais automaticamente.</p>
        </div>
        <div className="p-8 bg-card border-2 rounded-[2.5rem] space-y-4">
           <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <Layers className="h-6 w-6 text-indigo-600" />
           </div>
           <h4 className="font-black italic uppercase tracking-tight">Revisão Ativa</h4>
           <p className="text-xs text-muted-foreground font-bold leading-relaxed">Transformamos tópicos passivos em flashcards ativos para melhor memorização.</p>
        </div>
        <div className="p-8 bg-card border-2 rounded-[2.5rem] space-y-4">
           <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-green-600" />
           </div>
           <h4 className="font-black italic uppercase tracking-tight">Personalização</h4>
           <p className="text-xs text-muted-foreground font-bold leading-relaxed">As questões geradas focam no conteúdo específico do SEU material de estudo.</p>
        </div>
      </div>
    </div>
  );
}
