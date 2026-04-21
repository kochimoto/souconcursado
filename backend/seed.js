const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding data...");
  
  // 1. Create Sample Exams
  const exams = [
    {
      name: "Polícia Federal - Agente 2024",
      organization: "Cebraspe",
      area: "Policial",
      state: "Nacional",
      level: "Superior",
      status: "Previsto",
      date: new Date("2024-11-20"),
      vacancies: 500,
      fee: 180,
      subjects: ["Português", "Informática", "Direito Constitucional", "Contabilidade"]
    },
    {
      name: "TSE Unificado 2024",
      organization: "FGV",
      area: "Jurídica",
      state: "Nacional",
      level: "Superior",
      status: "Aberto",
      date: new Date("2024-12-08"),
      vacancies: 395,
      fee: 130,
      subjects: ["Direito Eleitoral", "Direito Administrativo", "Português", "Informática"]
    },
    {
      name: "BNB - Analista Bancário",
      organization: "Cesgranrio",
      area: "Bancária",
      state: "BA",
      level: "Médio",
      status: "Encerrado",
      date: new Date("2024-04-28"),
      vacancies: 410,
      fee: 65,
      subjects: ["Conhecimentos Bancários", "Matemática", "Português"]
    }
  ];

  for (const exam of exams) {
    await prisma.exam.upsert({
      where: { name: exam.name },
      update: {},
      create: exam
    });
  }

  // 2. Create Sample Flashcards (General knowledge if no user yet, or for all)
  const flashcards = [
    {
      front: "Qual o prazo para impetrar Mandado de Segurança?",
      back: "120 dias a contar da ciência do ato.",
      subject: "Direito Constitucional",
      difficulty: "easy"
    },
    {
      cardType: "cloze",
      clozeText: "O Princípio da _____ exige que a Administração Pública seja transparente.",
      clozeAnswers: ["Publicidade"],
      subject: "Direito Administrativo",
      difficulty: "medium"
    }
  ];

  // We need a userId to create flashcards. Let's find the first user.
  const user = await prisma.user.findFirst();
  if (user) {
    for (const card of flashcards) {
      await prisma.flashcard.create({
        data: {
          ...card,
          userId: user.id
        }
      });
      console.log(`Flashcard created for user ${user.email}`);
    }
  } else {
    console.log("No user found to assign flashcards. Please register first.");
  }

  console.log("Seed complete!");
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
