-- CreateEnum
CREATE TYPE "proposal_status" AS ENUM ('DRAFT', 'PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "resource_types" AS ENUM ('door', 'feature');

-- CreateEnum
CREATE TYPE "article_types" AS ENUM ('NEWS', 'INFORMATION');

-- CreateEnum
CREATE TYPE "nomination_responses" AS ENUM ('YES', 'NO', 'NOT_ANSWERED');

-- CreateEnum
CREATE TYPE "meeting_types" AS ENUM ('SM', 'SRG', 'SRA', 'SRI', 'OHM', 'HTM', 'VM', 'VTM', 'Extra');

-- CreateEnum
CREATE TYPE "activity_source" AS ENUM ('WEBSITE', 'ORBI', 'TEKNOLOGAPPEN', 'OTHER');

-- CreateEnum
CREATE TYPE "post_types" AS ENUM ('U', 'EA', 'N', 'EXACT_N');

-- CreateEnum
CREATE TYPE "utskott" AS ENUM ('CM', 'E6', 'ENU', 'FVU', 'INFU', 'KM', 'NOJU', 'NOLLU', 'OTHER', 'PENGU', 'SRE', 'STYRELSEN');

-- CreateEnum
CREATE TYPE "access_types" AS ENUM ('ADMIN', 'AUTHENTICATED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "emergency_contact_types" AS ENUM ('DAD', 'MOM', 'SIGNIFICANT_OTHER', 'BROTHER', 'SISTER', 'OTHER');

-- CreateEnum
CREATE TYPE "interview_request_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "individual_accesses" (
    "id" SERIAL NOT NULL,
    "ref_user" TEXT NOT NULL,
    "resource_type" "resource_types" NOT NULL,
    "resource" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "individual_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_accesses_log" (
    "id" SERIAL NOT NULL,
    "ref_grantor" TEXT NOT NULL,
    "ref_target" TEXT NOT NULL,
    "resource_type" "resource_types" NOT NULL,
    "resource" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "individual_accesses_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "photo_url" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "zip_code" TEXT,
    "website" TEXT,
    "luCard" TEXT,
    "date_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "post_accesses" (
    "id" SERIAL NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "resource_type" "resource_types" NOT NULL,
    "resource" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "post_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_accesses_log" (
    "id" SERIAL NOT NULL,
    "ref_grantor" TEXT NOT NULL,
    "ref_target" INTEGER NOT NULL,
    "resource_type" "resource_types" NOT NULL,
    "resource" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_accesses_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "sortPriority" INTEGER NOT NULL DEFAULT 0,
    "postname" TEXT NOT NULL,
    "email" TEXT,
    "utskott" "utskott" NOT NULL,
    "description" TEXT NOT NULL,
    "spots" INTEGER NOT NULL,
    "post_type" "post_types" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "interview_required" BOOLEAN NOT NULL DEFAULT false,
    "teknologappen_group_id" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_accesses" (
    "id" SERIAL NOT NULL,
    "ref_api_key" TEXT NOT NULL,
    "resource_type" "resource_types" NOT NULL,
    "resource" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "api_key_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "ref_creator" TEXT NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,
    "ref_article" INTEGER NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "article_type" "article_types" NOT NULL DEFAULT 'INFORMATION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ref_author" TEXT NOT NULL,
    "ref_last_update_by" TEXT NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electables" (
    "ref_post" INTEGER NOT NULL,
    "ref_election" INTEGER NOT NULL,

    CONSTRAINT "electables_pkey" PRIMARY KEY ("ref_election","ref_post")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "ref_creator" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "open" BOOLEAN NOT NULL DEFAULT false,
    "nominations_hidden" BOOLEAN NOT NULL DEFAULT false,
    "proposal_deadline" TIMESTAMP(3),

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations" (
    "answer" "nomination_responses" NOT NULL DEFAULT 'NOT_ANSWERED',
    "ref_user" TEXT NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "ref_election" INTEGER NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("ref_election","ref_post","ref_user")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "source_id" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "source" "activity_source" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "utskott" "utskott" NOT NULL,
    "image_url" TEXT,
    "location_title" TEXT,
    "location_link" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER,
    "price" INTEGER,
    "currency" TEXT,
    "activity_id" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "ref_user" TEXT NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "ref_election" INTEGER NOT NULL,
    "status" "proposal_status" NOT NULL DEFAULT 'ACCEPTED',
    "sent_at" TIMESTAMP(3),
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("ref_election","ref_post","ref_user")
);

-- CreateTable
CREATE TABLE "counter_candidacy_posts" (
    "ref_election" INTEGER NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counter_candidacy_posts_pkey" PRIMARY KEY ("ref_election","ref_post")
);

-- CreateTable
CREATE TABLE "counter_candidacies" (
    "ref_election" INTEGER NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "ref_user" TEXT NOT NULL,
    "answer" "nomination_responses" NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counter_candidacies_pkey" PRIMARY KEY ("ref_election","ref_post","ref_user")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "folder_location" TEXT NOT NULL,
    "accessType" "access_types" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ref_uploader" TEXT NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hehes" (
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ref_uploader" TEXT NOT NULL,
    "ref_file" TEXT NOT NULL,
    "cover_endpoint" TEXT NOT NULL,
    "cover_id" TEXT NOT NULL,

    CONSTRAINT "hehes_pkey" PRIMARY KEY ("year","number")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "type" "meeting_types" NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "ref_summons" TEXT,
    "ref_agenda" TEXT,
    "ref_documents" TEXT,
    "ref_late_documents" TEXT,
    "ref_protocol" TEXT,
    "ref_appendix" TEXT,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_histories" (
    "id" SERIAL NOT NULL,
    "ref_user" TEXT NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),

    CONSTRAINT "post_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "emergency_contact_types" NOT NULL,
    "phone" TEXT NOT NULL,
    "ref_user" TEXT NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "token" TEXT NOT NULL,
    "ref_user" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "login_providers" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "ref_user" TEXT NOT NULL,

    CONSTRAINT "login_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verify_info" (
    "id" SERIAL NOT NULL,
    "ref_user" TEXT NOT NULL,
    "verified_until" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verify_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_settings" (
    "ref_election" INTEGER NOT NULL,
    "default_duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "max_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "min_notice_minutes" INTEGER NOT NULL DEFAULT 1440,
    "freeze_at" TIMESTAMP(3),
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "notify_emails" TEXT[] DEFAULT ARRAY['vbordforande@esek.se', 'vbsekreterare@esek.se']::TEXT[],
    "last_summary_sent_at" TIMESTAMP(3),

    CONSTRAINT "interview_settings_pkey" PRIMARY KEY ("ref_election")
);

-- CreateTable
CREATE TABLE "interview_post_durations" (
    "ref_election" INTEGER NOT NULL,
    "ref_post" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,

    CONSTRAINT "interview_post_durations_pkey" PRIMARY KEY ("ref_election","ref_post")
);

-- CreateTable
CREATE TABLE "interview_windows" (
    "id" SERIAL NOT NULL,
    "ref_election" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "video_link" TEXT,
    "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "step_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_bookings" (
    "id" TEXT NOT NULL,
    "ref_election" INTEGER NOT NULL,
    "ref_user" TEXT NOT NULL,
    "ref_window" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "video_link" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "needs_admin_attention" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_requests" (
    "id" TEXT NOT NULL,
    "ref_election" INTEGER NOT NULL,
    "ref_user" TEXT NOT NULL,
    "ref_creator" TEXT NOT NULL,
    "ref_window" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "video_link" TEXT,
    "status" "interview_request_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "interview_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_no_slot_events" (
    "id" SERIAL NOT NULL,
    "ref_election" INTEGER NOT NULL,
    "ref_user" TEXT NOT NULL,
    "required_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_no_slot_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_luCard_key" ON "users"("luCard");

-- CreateIndex
CREATE INDEX "users_first_name_last_name_idx" ON "users"("first_name", "last_name");

-- CreateIndex
CREATE UNIQUE INDEX "posts_postname_key" ON "posts"("postname");

-- CreateIndex
CREATE UNIQUE INDEX "posts_teknologappen_group_id_key" ON "posts"("teknologappen_group_id");

-- CreateIndex
CREATE INDEX "posts_utskott_idx" ON "posts"("utskott");

-- CreateIndex
CREATE INDEX "articles_created_at_updated_at_idx" ON "articles"("created_at", "updated_at");

-- CreateIndex
CREATE INDEX "articles_article_type_idx" ON "articles"("article_type");

-- CreateIndex
CREATE INDEX "electables_ref_election_idx" ON "electables"("ref_election");

-- CreateIndex
CREATE UNIQUE INDEX "activities_source_source_id_key" ON "activities"("source", "source_id");

-- CreateIndex
CREATE INDEX "files_name_idx" ON "files"("name");

-- CreateIndex
CREATE INDEX "files_type_idx" ON "files"("type");

-- CreateIndex
CREATE UNIQUE INDEX "hehes_ref_file_key" ON "hehes"("ref_file");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_summons_key" ON "meetings"("ref_summons");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_agenda_key" ON "meetings"("ref_agenda");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_documents_key" ON "meetings"("ref_documents");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_late_documents_key" ON "meetings"("ref_late_documents");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_protocol_key" ON "meetings"("ref_protocol");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_appendix_key" ON "meetings"("ref_appendix");

-- CreateIndex
CREATE INDEX "meetings_year_number_idx" ON "meetings"("year", "number");

-- CreateIndex
CREATE INDEX "meetings_type_idx" ON "meetings"("type");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_type_number_year_key" ON "meetings"("type", "number", "year");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_contacts_id_ref_user_key" ON "emergency_contacts"("id", "ref_user");

-- CreateIndex
CREATE UNIQUE INDEX "verify_info_ref_user_key" ON "verify_info"("ref_user");

-- CreateIndex
CREATE INDEX "interview_windows_ref_election_starts_at_idx" ON "interview_windows"("ref_election", "starts_at");

-- CreateIndex
CREATE INDEX "interview_bookings_ref_window_starts_at_idx" ON "interview_bookings"("ref_window", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "interview_bookings_ref_election_ref_user_key" ON "interview_bookings"("ref_election", "ref_user");

-- CreateIndex
CREATE INDEX "interview_requests_ref_election_ref_user_status_idx" ON "interview_requests"("ref_election", "ref_user", "status");

-- CreateIndex
CREATE INDEX "interview_requests_ref_window_status_idx" ON "interview_requests"("ref_window", "status");

-- CreateIndex
CREATE INDEX "interview_no_slot_events_ref_election_created_at_idx" ON "interview_no_slot_events"("ref_election", "created_at");

-- AddForeignKey
ALTER TABLE "individual_accesses" ADD CONSTRAINT "individual_accesses_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_accesses_log" ADD CONSTRAINT "individual_accesses_log_ref_grantor_fkey" FOREIGN KEY ("ref_grantor") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_accesses_log" ADD CONSTRAINT "individual_accesses_log_ref_target_fkey" FOREIGN KEY ("ref_target") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_accesses" ADD CONSTRAINT "post_accesses_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_accesses_log" ADD CONSTRAINT "post_accesses_log_ref_grantor_fkey" FOREIGN KEY ("ref_grantor") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_accesses_log" ADD CONSTRAINT "post_accesses_log_ref_target_fkey" FOREIGN KEY ("ref_target") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_accesses" ADD CONSTRAINT "api_key_accesses_ref_api_key_fkey" FOREIGN KEY ("ref_api_key") REFERENCES "api_keys"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_ref_creator_fkey" FOREIGN KEY ("ref_creator") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_ref_article_fkey" FOREIGN KEY ("ref_article") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_ref_author_fkey" FOREIGN KEY ("ref_author") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_ref_last_update_by_fkey" FOREIGN KEY ("ref_last_update_by") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electables" ADD CONSTRAINT "electables_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electables" ADD CONSTRAINT "electables_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_ref_creator_fkey" FOREIGN KEY ("ref_creator") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter_candidacy_posts" ADD CONSTRAINT "counter_candidacy_posts_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter_candidacy_posts" ADD CONSTRAINT "counter_candidacy_posts_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter_candidacies" ADD CONSTRAINT "counter_candidacies_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter_candidacies" ADD CONSTRAINT "counter_candidacies_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counter_candidacies" ADD CONSTRAINT "counter_candidacies_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_ref_uploader_fkey" FOREIGN KEY ("ref_uploader") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hehes" ADD CONSTRAINT "hehes_ref_uploader_fkey" FOREIGN KEY ("ref_uploader") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hehes" ADD CONSTRAINT "hehes_ref_file_fkey" FOREIGN KEY ("ref_file") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_summons_fkey" FOREIGN KEY ("ref_summons") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_agenda_fkey" FOREIGN KEY ("ref_agenda") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_documents_fkey" FOREIGN KEY ("ref_documents") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_late_documents_fkey" FOREIGN KEY ("ref_late_documents") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_protocol_fkey" FOREIGN KEY ("ref_protocol") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_appendix_fkey" FOREIGN KEY ("ref_appendix") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_histories" ADD CONSTRAINT "post_histories_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_histories" ADD CONSTRAINT "post_histories_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_providers" ADD CONSTRAINT "login_providers_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verify_info" ADD CONSTRAINT "verify_info_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_settings" ADD CONSTRAINT "interview_settings_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_post_durations" ADD CONSTRAINT "interview_post_durations_ref_election_ref_post_fkey" FOREIGN KEY ("ref_election", "ref_post") REFERENCES "electables"("ref_election", "ref_post") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_windows" ADD CONSTRAINT "interview_windows_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_bookings" ADD CONSTRAINT "interview_bookings_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_bookings" ADD CONSTRAINT "interview_bookings_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_bookings" ADD CONSTRAINT "interview_bookings_ref_window_fkey" FOREIGN KEY ("ref_window") REFERENCES "interview_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_ref_creator_fkey" FOREIGN KEY ("ref_creator") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_ref_window_fkey" FOREIGN KEY ("ref_window") REFERENCES "interview_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_no_slot_events" ADD CONSTRAINT "interview_no_slot_events_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_no_slot_events" ADD CONSTRAINT "interview_no_slot_events_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

