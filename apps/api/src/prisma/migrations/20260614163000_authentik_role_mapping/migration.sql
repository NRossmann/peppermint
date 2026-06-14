ALTER TABLE "Role"
ADD COLUMN "authentikGroupName" TEXT;

CREATE UNIQUE INDEX "Role_authentikGroupName_key"
ON "Role"("authentikGroupName");
