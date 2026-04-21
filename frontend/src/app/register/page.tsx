"use client";

import { useState } from "react";
import { GraduationCap, Mail, Lock, User, MapPin, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BRAZILIAN_STATES, POPULAR_EXAMS } from "@/lib/data";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    state: "",
    targetExam: "",
    selectedExam: POPULAR_EXAMS[0],
    customExam: "",
    alreadyTaken: "Sim"
  });
  const [subjectLevels, setSubjectLevels] = useState<Record<string, number>>({
    "Português": 1,
    "Matemática/RLM": 1,
    "Informática": 1,
    "Direito Constitucional": 1,
    "Direito Administrativo": 1
  });
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setError("");

    const finalExam = formData.selectedExam === "Outros" ? formData.customExam : formData.selectedExam;

    try {
      const response = await api.post("/auth/register", {
        ...formData,
        targetExam: finalExam,
        alreadyTaken: formData.alreadyTaken === "Sim",
        subjectLevels
      });
      login(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  };

  const subjects = Object.keys(subjectLevels);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card p-8 rounded-3xl border shadow-xl shadow-primary/5"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            {step === 3 ? "Seu Nível Inicial" : "Comece sua jornada"}
          </h1>
          <p className="text-muted-foreground">
            {step === 3 ? "Como está seu conhecimento nestas áreas?" : "Escolha o plano para sua aprovação"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {step === 1 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    required 
                    placeholder="João Silva" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    required 
                    placeholder="seu@email.com" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <select 
                    required 
                    className="w-full px-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  >
                    <option value="">UF</option>
                    {BRAZILIAN_STATES.map(s => (
                      <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Sua cidade" 
                    className="w-full px-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Qual concurso você deseja prestar?</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.selectedExam}
                  onChange={(e) => setFormData({...formData, selectedExam: e.target.value})}
                >
                  {POPULAR_EXAMS.map(e => <option key={e}>{e}</option>)}
                  <option value="Outros">Outros concurso...</option>
                </select>
                
                {formData.selectedExam === "Outros" && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                    <input 
                      type="text" 
                      required 
                      placeholder="Nome do concurso" 
                      className="w-full px-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20" 
                      value={formData.customExam}
                      onChange={(e) => setFormData({...formData, customExam: e.target.value})}
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Já prestou concurso antes?</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.alreadyTaken}
                  onChange={(e) => setFormData({...formData, alreadyTaken: e.target.value})}
                >
                  <option>Sim</option>
                  <option>Não</option>
                </select>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
              {subjects.map((sub) => (
                <div key={sub} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium">{sub}</span>
                    <span className="text-primary font-bold">
                      {subjectLevels[sub] === 1 ? "Iniciante" : subjectLevels[sub] === 2 ? "Intermediário" : "Avançado"}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    value={subjectLevels[sub]} 
                    onChange={(e) => setSubjectLevels({...subjectLevels, [sub]: parseInt(e.target.value)})}
                    className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              ))}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : step < 3 ? "Próximo Passo" : "Finalizar Cadastro"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
          
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="w-full text-sm text-muted-foreground hover:underline">
              Voltar
            </button>
          )}
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-muted-foreground">Já tem uma conta? </span>
          <Link href="/login" className="text-primary font-bold hover:underline">
            Faça login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
