CREATE TABLE IF NOT EXISTS "Files" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "folderLocation" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accessType" TEXT NOT NULL,
  "refuploader" TEXT NOT NULL,
  FOREIGN KEY("refuploader") REFERENCES "Users"("username")
);