CREATE TABLE "sgb_registrations" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sgb_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sgb_registrations_phone_key" ON "sgb_registrations"("phone");
