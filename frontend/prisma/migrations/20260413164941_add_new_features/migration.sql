-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "examDate" TIMESTAMP(3),
ADD COLUMN     "fee" DOUBLE PRECISION,
ADD COLUMN     "inscriptionEnd" TIMESTAMP(3),
ADD COLUMN     "inscriptionStart" TIMESTAMP(3),
ADD COLUMN     "subjects" JSONB,
ADD COLUMN     "vacancies" INTEGER;

-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN     "cardType" TEXT NOT NULL DEFAULT 'classic',
ADD COLUMN     "clozeAnswers" JSONB,
ADD COLUMN     "clozeText" TEXT;

-- AlterTable
ALTER TABLE "StudyPlan" ADD COLUMN     "weeklySchedule" JSONB;

-- CreateTable
CREATE TABLE "SubjectStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "totalAnswered" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectStat_userId_subject_key" ON "SubjectStat"("userId", "subject");

-- AddForeignKey
ALTER TABLE "SubjectStat" ADD CONSTRAINT "SubjectStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
