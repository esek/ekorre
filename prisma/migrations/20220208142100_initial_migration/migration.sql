-- CreateEnum
CREATE TYPE "AccessMappingType" AS ENUM ('QUERY', 'MUTATION', 'PAGE');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('DOOR', 'WEB');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('NEWS', 'INFORMATION');

-- CreateEnum
CREATE TYPE "NominationResponse" AS ENUM ('ACCEPTED', 'REJECTED', 'PENDING');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('SM', 'VM', 'VTM', 'HTM');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('EA', 'EXACT_N');

-- CreateTable
CREATE TABLE "AccessMapping" (
    "id" SERIAL NOT NULL,
    "type" "AccessMappingType" NOT NULL,
    "name" TEXT NOT NULL,
    "page" TEXT,
    "refResource" TEXT NOT NULL,

    CONSTRAINT "AccessMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessResource" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resouceType" "ResourceType" NOT NULL,

    CONSTRAINT "AccessResource_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "IndividualAccess" (
    "id" SERIAL NOT NULL,
    "refUser" TEXT NOT NULL,
    "refResource" TEXT NOT NULL,

    CONSTRAINT "IndividualAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "photoUrl" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "zipCode" TEXT,
    "website" TEXT,
    "dateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFuncUser" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "PostAccess" (
    "id" SERIAL NOT NULL,
    "refPost" TEXT NOT NULL,
    "refResource" TEXT NOT NULL,

    CONSTRAINT "PostAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "slug" TEXT NOT NULL,
    "postname" TEXT NOT NULL,
    "utskott" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "spots" INTEGER NOT NULL,
    "postType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "interviewRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refArticle" INTEGER NOT NULL,

    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "type" "ArticleType" NOT NULL DEFAULT E'INFORMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refAuthor" TEXT NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Electable" (
    "id" SERIAL NOT NULL,
    "refPost" TEXT NOT NULL,
    "refElection" INTEGER NOT NULL,

    CONSTRAINT "Electable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Election" (
    "id" SERIAL NOT NULL,
    "refCreator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "open" BOOLEAN NOT NULL DEFAULT false,
    "nominationsHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" SERIAL NOT NULL,
    "response" "NominationResponse" NOT NULL DEFAULT E'PENDING',
    "refUser" TEXT NOT NULL,
    "refPost" TEXT NOT NULL,

    CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" SERIAL NOT NULL,
    "refUser" TEXT NOT NULL,
    "refElection" INTEGER NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "folderLocation" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refUploader" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeHe" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refUploader" TEXT NOT NULL,
    "refFile" TEXT NOT NULL,

    CONSTRAINT "HeHe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" SERIAL NOT NULL,
    "type" "MeetingType" NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "refSummons" TEXT NOT NULL,
    "refDocuments" TEXT NOT NULL,
    "refLateDocuments" TEXT NOT NULL,
    "refProtocol" TEXT NOT NULL,
    "refAppendix" TEXT NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostHistory" (
    "id" SERIAL NOT NULL,
    "refUser" TEXT NOT NULL,
    "refPost" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "refUser" TEXT NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "token" TEXT NOT NULL,
    "refUser" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessMapping_type_name_page_key" ON "AccessMapping"("type", "name", "page");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTag_tag_key" ON "ArticleTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HeHe_refFile_key" ON "HeHe"("refFile");

-- CreateIndex
CREATE UNIQUE INDEX "HeHe_number_year_key" ON "HeHe"("number", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_refSummons_key" ON "Meeting"("refSummons");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_refDocuments_key" ON "Meeting"("refDocuments");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_refLateDocuments_key" ON "Meeting"("refLateDocuments");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_refProtocol_key" ON "Meeting"("refProtocol");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_refAppendix_key" ON "Meeting"("refAppendix");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_type_number_year_key" ON "Meeting"("type", "number", "year");

-- AddForeignKey
ALTER TABLE "AccessMapping" ADD CONSTRAINT "AccessMapping_refResource_fkey" FOREIGN KEY ("refResource") REFERENCES "AccessResource"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualAccess" ADD CONSTRAINT "IndividualAccess_refResource_fkey" FOREIGN KEY ("refResource") REFERENCES "AccessResource"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualAccess" ADD CONSTRAINT "IndividualAccess_refUser_fkey" FOREIGN KEY ("refUser") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAccess" ADD CONSTRAINT "PostAccess_refResource_fkey" FOREIGN KEY ("refResource") REFERENCES "AccessResource"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAccess" ADD CONSTRAINT "PostAccess_refPost_fkey" FOREIGN KEY ("refPost") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_refArticle_fkey" FOREIGN KEY ("refArticle") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_refAuthor_fkey" FOREIGN KEY ("refAuthor") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Electable" ADD CONSTRAINT "Electable_refPost_fkey" FOREIGN KEY ("refPost") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Electable" ADD CONSTRAINT "Electable_refElection_fkey" FOREIGN KEY ("refElection") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Election" ADD CONSTRAINT "Election_refCreator_fkey" FOREIGN KEY ("refCreator") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_refUser_fkey" FOREIGN KEY ("refUser") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_refPost_fkey" FOREIGN KEY ("refPost") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_refUser_fkey" FOREIGN KEY ("refUser") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_refElection_fkey" FOREIGN KEY ("refElection") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_refUploader_fkey" FOREIGN KEY ("refUploader") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeHe" ADD CONSTRAINT "HeHe_refUploader_fkey" FOREIGN KEY ("refUploader") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeHe" ADD CONSTRAINT "HeHe_refFile_fkey" FOREIGN KEY ("refFile") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_refSummons_fkey" FOREIGN KEY ("refSummons") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_refDocuments_fkey" FOREIGN KEY ("refDocuments") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_refLateDocuments_fkey" FOREIGN KEY ("refLateDocuments") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_refProtocol_fkey" FOREIGN KEY ("refProtocol") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_refAppendix_fkey" FOREIGN KEY ("refAppendix") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHistory" ADD CONSTRAINT "PostHistory_refUser_fkey" FOREIGN KEY ("refUser") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHistory" ADD CONSTRAINT "PostHistory_refPost_fkey" FOREIGN KEY ("refPost") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_refUser_fkey" FOREIGN KEY ("refUser") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_refUser_fkey" FOREIGN KEY ("refUser") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
