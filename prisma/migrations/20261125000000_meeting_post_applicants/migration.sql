-- AlterTable
ALTER TABLE "meeting_item_posts" ADD COLUMN "applicants" INTEGER;
ALTER TABLE "meeting_item_posts" ADD COLUMN "presentation_seconds" INTEGER NOT NULL DEFAULT 120;
