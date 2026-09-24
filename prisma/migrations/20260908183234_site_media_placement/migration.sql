-- CreateEnum
CREATE TYPE "MediaPlacement" AS ENUM ('HERO_GALLERY', 'CAMP_CARDS');

-- DropIndex
DROP INDEX "HeroMedia_isActive_sortOrder_idx";

-- AlterTable
ALTER TABLE "HeroMedia" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "placement" "MediaPlacement" NOT NULL DEFAULT 'HERO_GALLERY',
ADD COLUMN     "subtitle" TEXT,
ALTER COLUMN "videoUrl" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "HeroMedia_placement_isActive_sortOrder_idx" ON "HeroMedia"("placement", "isActive", "sortOrder");
