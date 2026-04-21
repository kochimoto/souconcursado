const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const examCount = await prisma.exam.count();
  const flashcardCount = await prisma.flashcard.count();
  const planCount = await prisma.studyPlan.count();
  
  console.log({
    userCount,
    examCount,
    flashcardCount,
    planCount
  });
  
  if (examCount === 0) {
    console.log("Database has no Exams. Seeding some...");
    await prisma.exam.create({
      data: {
        name: "PM-BA Soldado 2024",
        organization: "FCC",
        area: "Policial",
        state: "BA",
        level: "Médio",
        status: "Aberto",
        date: new Date("2024-12-15"),
        vacancies: 2000,
        fee: 90,
        subjects: ["Português", "Matemática", "Direito Constitucional", "Geografia da Bahia"]
      }
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
