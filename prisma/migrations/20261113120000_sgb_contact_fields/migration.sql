ALTER TABLE "sgb_registrations" ADD COLUMN "country" TEXT;
ALTER TABLE "sgb_registrations" ADD COLUMN "email" TEXT;
ALTER TABLE "sgb_registrations" ALTER COLUMN "age" DROP NOT NULL;
