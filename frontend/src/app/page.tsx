"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, Zap, Shield, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      icon: <Target className="h-6 w-6 text-blue-500" />,
      title: "Base de Questões Real",
      description: "Milhares de questões de provas anteriores organizadas por matéria e banca."
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Repetição Espaçada",
      description: "Sistema inteligente de flashcards que foca no que você tem mais dificuldade."
    },
    {
      icon: <Shield className="h-6 w-6 text-green-500" />,
      title: "Cronograma Adaptativo",
      description: "Plano de estudos que se ajusta automaticamente ao seu ritmo e desempenho."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px]" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide uppercase bg-primary/10 text-primary rounded-full">
              Sua aprovação começa aqui
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Estude de forma <br />
              <span className="gradient-text">Inteligente e Estratégica</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
              A plataforma definitiva para concursos públicos no Brasil. Foco em questões reais, 
              análise de desempenho e evolução contínua.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <button className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-primary/25 flex items-center gap-2">
                  Começar Agora Grátis
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/exams">
                <button className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-bold text-lg hover:bg-secondary/80 transition-colors">
                  Ver Concursos Ativos
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">50k+</p>
              <p className="text-sm text-muted-foreground">Questões Resolvidas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">10k+</p>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">95%</p>
              <p className="text-sm text-muted-foreground">Taxa de Satisfação</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">Acompanhamento</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher o Sou Concursado?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Nossa metodologia é baseada em dados reais e ciência da aprendizagem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Pronto para ser aprovado?</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-lg mx-auto">
            Junte-se a milhares de estudantes que já estão transformando sua rotina de estudos.
          </p>
          <Link href="/register">
            <button className="px-10 py-4 bg-white text-primary rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-2xl">
              Criar Conta Gratuita
            </button>
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/40 rounded-full blur-[100px]" />
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Sou Concursado. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
