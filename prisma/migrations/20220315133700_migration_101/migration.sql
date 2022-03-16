/*
  Warnings:

  - You are about to drop the `AccessMapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccessResource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArticleTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Electable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Election` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmergencyContact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HeHe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IndividualAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Meeting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Nomination` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordReset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proposal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "access_mapping_types" AS ENUM ('QUERY', 'MUTATION', 'PAGE');

-- CreateEnum
CREATE TYPE "resource_types" AS ENUM ('DOOR', 'WEB');

-- CreateEnum
CREATE TYPE "article_types" AS ENUM ('NEWS', 'INFORMATION');

-- CreateEnum
CREATE TYPE "nomination_responses" AS ENUM ('YES', 'NO', 'NO_ANSWER');

-- CreateEnum
CREATE TYPE "meeting_types" AS ENUM ('SM', 'HTM', 'VM', 'VTM', 'Extra');

-- CreateEnum
CREATE TYPE "post_types" AS ENUM ('U', 'EA', 'N', 'EXACT_N');

-- CreateEnum
CREATE TYPE "utskott" AS ENUM ('CM', 'KM', 'INFU', 'E6', 'NOJU', 'NOLLU', 'SRE', 'ENU', 'FVU', 'STYRELSEN', 'OTHER');

-- CreateEnum
CREATE TYPE "access_types" AS ENUM ('ADMIN', 'AUTHENTICATED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "emergency_contact_types" AS ENUM ('DAD', 'MOM', 'SIGNIFICANT_OTHER', 'BROTHER', 'SISTER', 'OTHER');

-- DropForeignKey
ALTER TABLE "AccessMapping" DROP CONSTRAINT "AccessMapping_refResource_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_refAuthor_fkey";

-- DropForeignKey
ALTER TABLE "ArticleTag" DROP CONSTRAINT "ArticleTag_refArticle_fkey";

-- DropForeignKey
ALTER TABLE "Electable" DROP CONSTRAINT "Electable_refElection_fkey";

-- DropForeignKey
ALTER TABLE "Electable" DROP CONSTRAINT "Electable_refPost_fkey";

-- DropForeignKey
ALTER TABLE "Election" DROP CONSTRAINT "Election_refCreator_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyContact" DROP CONSTRAINT "EmergencyContact_refUser_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_refUploader_fkey";

-- DropForeignKey
ALTER TABLE "HeHe" DROP CONSTRAINT "HeHe_refFile_fkey";

-- DropForeignKey
ALTER TABLE "HeHe" DROP CONSTRAINT "HeHe_refUploader_fkey";

-- DropForeignKey
ALTER TABLE "IndividualAccess" DROP CONSTRAINT "IndividualAccess_refResource_fkey";

-- DropForeignKey
ALTER TABLE "IndividualAccess" DROP CONSTRAINT "IndividualAccess_refUser_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_refAppendix_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_refDocuments_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_refLateDocuments_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_refProtocol_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_refSummons_fkey";

-- DropForeignKey
ALTER TABLE "Nomination" DROP CONSTRAINT "Nomination_refPost_fkey";

-- DropForeignKey
ALTER TABLE "Nomination" DROP CONSTRAINT "Nomination_refUser_fkey";

-- DropForeignKey
ALTER TABLE "PasswordReset" DROP CONSTRAINT "PasswordReset_refUser_fkey";

-- DropForeignKey
ALTER TABLE "PostAccess" DROP CONSTRAINT "PostAccess_refPost_fkey";

-- DropForeignKey
ALTER TABLE "PostAccess" DROP CONSTRAINT "PostAccess_refResource_fkey";

-- DropForeignKey
ALTER TABLE "PostHistory" DROP CONSTRAINT "PostHistory_refPost_fkey";

-- DropForeignKey
ALTER TABLE "PostHistory" DROP CONSTRAINT "PostHistory_refUser_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_refElection_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_refUser_fkey";

-- DropTable
DROP TABLE "AccessMapping";

-- DropTable
DROP TABLE "AccessResource";

-- DropTable
DROP TABLE "Article";

-- DropTable
DROP TABLE "ArticleTag";

-- DropTable
DROP TABLE "Electable";

-- DropTable
DROP TABLE "Election";

-- DropTable
DROP TABLE "EmergencyContact";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "HeHe";

-- DropTable
DROP TABLE "IndividualAccess";

-- DropTable
DROP TABLE "Meeting";

-- DropTable
DROP TABLE "Nomination";

-- DropTable
DROP TABLE "PasswordReset";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "PostAccess";

-- DropTable
DROP TABLE "PostHistory";

-- DropTable
DROP TABLE "Proposal";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "AccessMappingType";

-- DropEnum
DROP TYPE "ArticleType";

-- DropEnum
DROP TYPE "MeetingType";

-- DropEnum
DROP TYPE "NominationResponse";

-- DropEnum
DROP TYPE "PostType";

-- DropEnum
DROP TYPE "ResourceType";

-- CreateTable
CREATE TABLE "access_mappings" (
    "id" SERIAL NOT NULL,
    "type" "access_mapping_types" NOT NULL,
    "name" TEXT NOT NULL,
    "page" TEXT,
    "ref_resource" TEXT NOT NULL,

    CONSTRAINT "access_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_resources" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resource_type" "resource_types" NOT NULL,

    CONSTRAINT "access_resources_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "individual_accesses" (
    "id" SERIAL NOT NULL,
    "ref_user" TEXT NOT NULL,
    "ref_resource" TEXT NOT NULL,

    CONSTRAINT "individual_accesses_pkey" PRIMARY KEY ("id")
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
    "date_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_func_user" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "post_accesses" (
    "id" SERIAL NOT NULL,
    "ref_post" TEXT NOT NULL,
    "ref_resource" TEXT NOT NULL,

    CONSTRAINT "post_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "slug" TEXT NOT NULL,
    "postname" TEXT NOT NULL,
    "utskott" "utskott" NOT NULL,
    "description" TEXT NOT NULL,
    "spots" INTEGER NOT NULL,
    "post_type" "post_types" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "interview_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refArticle" INTEGER NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "article_type" "article_types" NOT NULL DEFAULT E'INFORMATION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ref_author" TEXT NOT NULL,
    "ref_last_update_by" TEXT NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electables" (
    "ref_post" TEXT NOT NULL,
    "ref_election" INTEGER NOT NULL,

    CONSTRAINT "electables_pkey" PRIMARY KEY ("ref_election","ref_post")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" SERIAL NOT NULL,
    "ref_creator" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "open" BOOLEAN NOT NULL DEFAULT false,
    "nominations_hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominations" (
    "answer" "nomination_responses" NOT NULL DEFAULT E'NO_ANSWER',
    "ref_user" TEXT NOT NULL,
    "ref_post" TEXT NOT NULL,
    "ref_election" INTEGER NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("ref_election","ref_post","ref_user")
);

-- CreateTable
CREATE TABLE "proposals" (
    "ref_user" TEXT NOT NULL,
    "ref_post" TEXT NOT NULL,
    "ref_election" INTEGER NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("ref_election","ref_post","ref_user")
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

    CONSTRAINT "hehes_pkey" PRIMARY KEY ("year","number")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "type" "meeting_types" NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "ref_summons" TEXT,
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
    "ref_post" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),

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

-- CreateIndex
CREATE UNIQUE INDEX "access_mappings_type_name_page_key" ON "access_mappings"("type", "name", "page");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_first_name_last_name_idx" ON "users"("first_name", "last_name");

-- CreateIndex
CREATE UNIQUE INDEX "posts_postname_key" ON "posts"("postname");

-- CreateIndex
CREATE INDEX "posts_utskott_idx" ON "posts"("utskott");

-- CreateIndex
CREATE UNIQUE INDEX "article_tags_tag_key" ON "article_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_created_at_updated_at_idx" ON "articles"("created_at", "updated_at");

-- CreateIndex
CREATE INDEX "articles_article_type_idx" ON "articles"("article_type");

-- CreateIndex
CREATE INDEX "electables_ref_election_idx" ON "electables"("ref_election");

-- CreateIndex
CREATE INDEX "files_name_idx" ON "files"("name");

-- CreateIndex
CREATE INDEX "files_type_idx" ON "files"("type");

-- CreateIndex
CREATE UNIQUE INDEX "hehes_ref_file_key" ON "hehes"("ref_file");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_ref_summons_key" ON "meetings"("ref_summons");

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

-- AddForeignKey
ALTER TABLE "access_mappings" ADD CONSTRAINT "access_mappings_ref_resource_fkey" FOREIGN KEY ("ref_resource") REFERENCES "access_resources"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_accesses" ADD CONSTRAINT "individual_accesses_ref_resource_fkey" FOREIGN KEY ("ref_resource") REFERENCES "access_resources"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_accesses" ADD CONSTRAINT "individual_accesses_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_accesses" ADD CONSTRAINT "post_accesses_ref_resource_fkey" FOREIGN KEY ("ref_resource") REFERENCES "access_resources"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_accesses" ADD CONSTRAINT "post_accesses_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_refArticle_fkey" FOREIGN KEY ("refArticle") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_ref_author_fkey" FOREIGN KEY ("ref_author") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_ref_last_update_by_fkey" FOREIGN KEY ("ref_last_update_by") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electables" ADD CONSTRAINT "electables_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electables" ADD CONSTRAINT "electables_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_ref_creator_fkey" FOREIGN KEY ("ref_creator") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_ref_election_fkey" FOREIGN KEY ("ref_election") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_ref_uploader_fkey" FOREIGN KEY ("ref_uploader") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hehes" ADD CONSTRAINT "hehes_ref_uploader_fkey" FOREIGN KEY ("ref_uploader") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hehes" ADD CONSTRAINT "hehes_ref_file_fkey" FOREIGN KEY ("ref_file") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_ref_summons_fkey" FOREIGN KEY ("ref_summons") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "post_histories" ADD CONSTRAINT "post_histories_ref_post_fkey" FOREIGN KEY ("ref_post") REFERENCES "posts"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
