import prisma from './src/utils/prisma';

async function seed() {
  console.log("Seeding data for Sou Concursado...");
  
  try {
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
        name: "TJ-SP Escrevente 2024",
        organization: "Vunesp",
        area: "Jurídica",
        state: "SP",
        level: "Médio",
        status: "Aberto",
        date: new Date("2024-09-08"),
        vacancies: 572,
        fee: 81,
        subjects: ["Direito Penal", "Direito Processual", "Português", "Matemática"]
      }
    ];

    for (const examData of exams) {
      await prisma.exam.upsert({
        where: { id: examData.name }, // This is a hack since we don't have unique name, but ok for seed
        update: {},
        create: examData
      }).catch(async () => {
         // If id-based upsert fails, just create
         await prisma.exam.create({ data: examData });
      });
    }
    console.log("Exams seeded!");

    // 2. Sample User to assign flashcards to
    const user = await prisma.user.findFirst();
    if (user) {
      console.log(`Assigning sample flashcards to ${user.email}`);
      const flashcards = [
        {
          userId: user.id,
          front: "O que é o Princípio da Eficiência?",
          back: "Dever da administração de atuar com celeridade e perfeição técnica.",
          cardType: "classic"
        },
        {
          userId: user.id,
          clozeText: "O Mandado de Segurança deve ser impetrado em até _____ dias.",
          clozeAnswers: ["120"],
          cardType: "cloze"
        }
      ];

      for (const card of flashcards) {
        await prisma.flashcard.create({ data: card });
      }
      console.log("Flashcards seeded!");
    } else {
      console.log("No user found. Skip flashcard seeding.");
    }

  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
