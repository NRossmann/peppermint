-- CreateTable
CREATE TABLE "TicketState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TicketState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketState_name_key" ON "TicketState"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TicketState_slug_key" ON "TicketState"("slug");

-- Seed default states
INSERT INTO "TicketState" ("id", "name", "slug", "color", "order", "isResolved") VALUES
('7f9cfb1d-9f80-44c7-9ef8-4b60b4f27111', 'Needs Support', 'needs_support', 'bg-yellow-500', 0, false),
('5ce3ecf7-f9a5-4e30-a071-95435c50a648', 'In Progress', 'in_progress', 'bg-blue-500', 1, false),
('a396f2ce-5e30-42b0-b9ab-ffcb37ecf1ef', 'In Review', 'in_review', 'bg-purple-500', 2, false),
('8cfd8191-e2f2-4eca-96fe-b8585ff1cf08', 'On Hold', 'hold', 'bg-orange-500', 3, false),
('7e3719d0-63cb-42a3-a732-f711b1af12be', 'Done', 'done', 'bg-green-500', 4, true);

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "stateId" TEXT;

-- Migrate existing ticket data
UPDATE "Ticket"
SET "stateId" = CASE
  WHEN "status"::text = 'in_progress' THEN '5ce3ecf7-f9a5-4e30-a071-95435c50a648'
  WHEN "status"::text = 'in_review' THEN 'a396f2ce-5e30-42b0-b9ab-ffcb37ecf1ef'
  WHEN "status"::text = 'hold' THEN '8cfd8191-e2f2-4eca-96fe-b8585ff1cf08'
  WHEN "status"::text = 'done' OR "isComplete" = true THEN '7e3719d0-63cb-42a3-a732-f711b1af12be'
  ELSE '7f9cfb1d-9f80-44c7-9ef8-4b60b4f27111'
END;

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "stateId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "TicketState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop legacy columns
ALTER TABLE "Ticket" DROP COLUMN "isComplete";
ALTER TABLE "Ticket" DROP COLUMN "status";

-- DropEnum
DROP TYPE "TicketStatus";
