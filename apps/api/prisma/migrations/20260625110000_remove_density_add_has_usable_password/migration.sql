ALTER TABLE "User"
ADD COLUMN "hasUsablePassword" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "UserSettings"
DROP COLUMN "density";

DROP TYPE "InterfaceDensity";
