-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('POWER_4_LEADER', 'TEAM_LEADER', 'TEAM_COORDINATOR', 'CAPTAIN', 'DIRECTOR', 'MINISTER', 'CAMPUS_PASTOR', 'PASTOR', 'LIGHTHOUSE_PASTOR', 'DIRECTOR_OF_MISSION', 'SENIOR_PASTOR');
ALTER TABLE "public"."Registrant" ALTER COLUMN "position" DROP DEFAULT;
ALTER TABLE "Registrant" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TABLE "Room" ALTER COLUMN "minPosition" TYPE "Position_new" USING ("minPosition"::text::"Position_new");
ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "public"."Position_old";
ALTER TABLE "Registrant" ALTER COLUMN "position" SET DEFAULT 'POWER_4_LEADER';
COMMIT;

-- AlterTable
ALTER TABLE "Registrant" ALTER COLUMN "position" SET DEFAULT 'POWER_4_LEADER';

