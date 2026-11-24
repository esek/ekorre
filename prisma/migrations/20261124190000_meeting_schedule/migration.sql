-- CreateEnum
CREATE TYPE "meeting_schedule_status" AS ENUM ('DRAFT', 'LIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "meeting_item_status" AS ENUM ('PENDING', 'ACTIVE', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "meeting_schedules" (
    "id" SERIAL NOT NULL,
    "ref_meeting" INTEGER NOT NULL,
    "scheduled_start" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "status" "meeting_schedule_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_items" (
    "id" SERIAL NOT NULL,
    "ref_schedule" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planned_seconds" INTEGER,
    "actual_start" TIMESTAMP(3),
    "actual_seconds" INTEGER,
    "status" "meeting_item_status" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "meeting_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_item_posts" (
    "id" SERIAL NOT NULL,
    "ref_item" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "spots" INTEGER,
    "planned_seconds" INTEGER,
    "actual_start" TIMESTAMP(3),
    "actual_seconds" INTEGER,
    "status" "meeting_item_status" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "meeting_item_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_breaks" (
    "id" SERIAL NOT NULL,
    "ref_schedule" INTEGER NOT NULL,
    "after_item_position" INTEGER NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "label" TEXT,

    CONSTRAINT "meeting_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_schedules_ref_meeting_key" ON "meeting_schedules"("ref_meeting");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_items_ref_schedule_position_key" ON "meeting_items"("ref_schedule", "position");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_item_posts_ref_item_position_key" ON "meeting_item_posts"("ref_item", "position");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_breaks_ref_schedule_after_item_position_key" ON "meeting_breaks"("ref_schedule", "after_item_position");

-- AddForeignKey
ALTER TABLE "meeting_schedules" ADD CONSTRAINT "meeting_schedules_ref_meeting_fkey" FOREIGN KEY ("ref_meeting") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_items" ADD CONSTRAINT "meeting_items_ref_schedule_fkey" FOREIGN KEY ("ref_schedule") REFERENCES "meeting_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_item_posts" ADD CONSTRAINT "meeting_item_posts_ref_item_fkey" FOREIGN KEY ("ref_item") REFERENCES "meeting_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_breaks" ADD CONSTRAINT "meeting_breaks_ref_schedule_fkey" FOREIGN KEY ("ref_schedule") REFERENCES "meeting_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
