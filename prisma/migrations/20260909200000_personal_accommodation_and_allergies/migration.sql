-- AlterTable
ALTER TABLE "Registrant" DROP COLUMN "accommodationNeeded",
DROP COLUMN "dietaryNotes",
DROP COLUMN "roomPreference",
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "wantsPersonalAccommodation" BOOLEAN NOT NULL DEFAULT false;

