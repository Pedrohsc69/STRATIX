ALTER TABLE "User"
ADD CONSTRAINT "User_non_director_requires_company_and_department"
CHECK (
  "role" = 'DIRECTOR'
  OR ("companyId" IS NOT NULL AND "departmentId" IS NOT NULL)
);

ALTER TABLE "User"
ADD CONSTRAINT "User_without_company_cannot_have_department"
CHECK (
  "companyId" IS NOT NULL
  OR "departmentId" IS NULL
);
