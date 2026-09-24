-- AlterTable
ALTER TABLE "Camp" DROP COLUMN "minFirstInstallmentPc",
ADD COLUMN     "minFirstInstallmentKobo" INTEGER NOT NULL DEFAULT 1000000;

