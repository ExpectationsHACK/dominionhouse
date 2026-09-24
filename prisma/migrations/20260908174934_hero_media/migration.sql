-- CreateTable
CREATE TABLE "HeroMedia" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeroMedia_isActive_sortOrder_idx" ON "HeroMedia"("isActive", "sortOrder");
