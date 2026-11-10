-- Angel Partners interest form on the Give page: who wants to partner and
-- how, before any payment. Additive only.

-- CreateEnum
CREATE TYPE "MonthlyCommitment" AS ENUM ('WILLING', 'NEEDS_CLARITY');

-- CreateEnum
CREATE TYPE "GiveMoreAnswer" AS ENUM ('YES', 'POSSIBLY', 'NO');

-- CreateEnum
CREATE TYPE "LongTermCommitment" AS ENUM ('COMMITTED', 'START_AND_GROW', 'NEEDS_CLARITY');

-- CreateTable
CREATE TABLE "PartnerInterest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthday" DATE,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "country" TEXT,
    "monthly" "MonthlyCommitment" NOT NULL,
    "giveMore" "GiveMoreAnswer" NOT NULL,
    "moreAmount" TEXT,
    "startMonth" TEXT,
    "longTerm" "LongTermCommitment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerInterest_createdAt_idx" ON "PartnerInterest"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerInterest_email_idx" ON "PartnerInterest"("email");
