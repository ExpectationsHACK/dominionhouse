-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('AGE_18_25', 'AGE_26_35', 'AGE_36_50', 'AGE_51_70');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED');

-- CreateEnum
CREATE TYPE "HowHeard" AS ENUM ('SOCIAL_MEDIA', 'MEMBER_OR_PARTNER', 'THROUGH_A_FRIEND', 'THROUGH_EMAIL', 'THROUGH_SMS');

-- AlterTable
ALTER TABLE "Registrant" ADD COLUMN     "ageGroup" "AgeGroup",
ADD COLUMN     "bringingChildren" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "children5to11" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "childrenUnder5" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "howHeard" "HowHeard",
ADD COLUMN     "maritalStatus" "MaritalStatus";
