-- Angel Partners: monthly partnerships (Paystack subscriptions), every giving
-- payment, and the Paystack plans created per currency and amount.

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GiftKind" AS ENUM ('MONTHLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "wallOptIn" BOOLEAN NOT NULL DEFAULT false,
    "paystackPlanCode" TEXT,
    "paystackCustomerCode" TEXT,
    "paystackSubscriptionCode" TEXT,
    "paystackEmailToken" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "reference" TEXT NOT NULL,
    "kind" "GiftKind" NOT NULL,
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "channel" TEXT,
    "paidAt" TIMESTAMP(3),
    "gatewayRaw" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GivingPlan" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "planCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GivingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_paystackSubscriptionCode_key" ON "Partner"("paystackSubscriptionCode");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "Partner_email_idx" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Gift_reference_key" ON "Gift"("reference");

-- CreateIndex
CREATE INDEX "Gift_status_idx" ON "Gift"("status");

-- CreateIndex
CREATE INDEX "Gift_paidAt_idx" ON "Gift"("paidAt");

-- CreateIndex
CREATE INDEX "Gift_partnerId_idx" ON "Gift"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "GivingPlan_planCode_key" ON "GivingPlan"("planCode");

-- CreateIndex
CREATE UNIQUE INDEX "GivingPlan_currency_amountMinor_key" ON "GivingPlan"("currency", "amountMinor");

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

