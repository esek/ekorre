/*
  Warnings:

  - You are about to drop the column `year` on the `meetings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[type,number,date]` on the table `meetings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `meetings` table without a default value. This is not possible if the table is not empty.

  Varningar hanterade genom att:
  - `date` läggs till och fylls med data från `year` innan `year` tas bort.
*/
-- DropIndex
DROP INDEX IF EXISTS "meetings_type_number_year_key";

-- DropIndex
DROP INDEX IF EXISTS "meetings_year_number_idx";

-- DropIndex
DROP INDEX IF EXISTS "meetings_type_idx";


-- AlterTable
ALTER TABLE "meetings" ADD COLUMN "date" DATE;
UPDATE "meetings" 
SET "date" = TO_DATE("year" || '-01-01', 'YYYY-MM-DD')
WHERE "year" IS NOT NULL;
ALTER TABLE "meetings" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "meetings" DROP COLUMN "year";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_date_type_idx" ON "meetings"("date", "type");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_date_number_idx" ON "meetings"("date", "number");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "meetings_type_number_date_key" ON "meetings"("type", "number", "date");
