-- People imported from an outside registration list (the LARK form) arrive
-- without a gender or emergency contact; they add them in their camp profile.
ALTER TABLE "Registrant" ALTER COLUMN "gender" DROP NOT NULL;
ALTER TABLE "Registrant" ALTER COLUMN "emergencyName" DROP NOT NULL;
ALTER TABLE "Registrant" ALTER COLUMN "emergencyPhone" DROP NOT NULL;

-- Where an imported registrant came from, e.g. 'LARK form'.
ALTER TABLE "Registrant" ADD COLUMN "importedFrom" TEXT;
