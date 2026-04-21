import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Exams
  const exam1 = await prisma.exam.create({
    data: {
      name: 'PM-BA 2024',
      organization: 'FCC',
      area: 'Policial',
      state: 'BA',
      level: 'Médio',
      status: 'Aberto',
      date: new Date('2024-12-15'),
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      name: 'TRE-Unificado 2024',
      organization: 'FGV',
      area: 'Jurídica',
      state: 'Nacional',
      level: 'Superior',
      status: 'Previsto',
    },
  });

  // Create Questions
  await prisma.question.create({
    data: {
      text: 'Qual a principal função do Poder Legislativo?',
      options: ['Legislar e fiscalizar', 'Executar leis', 'Julgar crimes', 'Administrar o Estado'],
      correctOption: 0,
      explanation: 'O Poder Legislativo tem como funções típicas legislar e fiscalizar o Executivo.',
      subject: 'Direito Constitucional',
      topic: 'Poderes',
      difficulty: 'Fácil',
      examId: exam2.id,
    },
  });

  await prisma.question.create({
    data: {
      text: 'O que é um software de código aberto?',
      options: ['Pago', 'Grátis sempre', 'Acesso ao código-fonte permitido', 'Somente para Windows'],
      correctOption: 2,
      explanation: 'Open source permite que qualquer um acesse, modifique e distribua o código.',
      subject: 'Informática',
      topic: 'Software',
      difficulty: 'Fácil',
      examId: exam1.id,
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
