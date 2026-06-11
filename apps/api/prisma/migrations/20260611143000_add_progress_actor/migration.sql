ALTER TABLE "ProgressOKR"
ADD COLUMN "actorId" TEXT;

CREATE INDEX "ProgressOKR_actorId_idx" ON "ProgressOKR"("actorId");

ALTER TABLE "ProgressOKR"
ADD CONSTRAINT "ProgressOKR_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
