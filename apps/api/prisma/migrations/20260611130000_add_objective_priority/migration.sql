CREATE TYPE "ObjectivePriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNSPECIFIED');

ALTER TABLE "Objective"
ADD COLUMN "priority" "ObjectivePriority" NOT NULL DEFAULT 'UNSPECIFIED';
