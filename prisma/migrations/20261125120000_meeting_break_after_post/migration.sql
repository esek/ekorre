-- AlterTable
ALTER TABLE "meeting_breaks" ADD COLUMN "after_post_position" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX "meeting_breaks_ref_schedule_after_item_position_key";

-- CreateIndex
CREATE UNIQUE INDEX "meeting_breaks_ref_schedule_after_item_position_after_post__key" ON "meeting_breaks"("ref_schedule", "after_item_position", "after_post_position");
