CREATE TABLE IF NOT EXISTS "Files" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "folderLocation" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accessType" TEXT NOT NULL,
  "refuploader" TEXT NOT NULL,
  FOREIGN KEY("refuploader") REFERENCES "Users"("username")
);

INSERT INTO Files (id, name, type, folderLocation, accessType, refUploader) VALUES ('c703198a20f148f392061060f651fdb3.png', 'esek.png', 'image', '/c703198a20f148f392061060f651fdb3.png', 'public', 'aa0000bb-s');
INSERT INTO Files (id, name, type, folderLocation, accessType, refUploader) VALUES ('6f837f0400bd1eb70f3648fc31343ecc', 'textfiler', 'folder', '/6f837f0400bd1eb70f3648fc31343ecc', 'public', 'aa0000bb-s');
INSERT INTO Files (id, name, type, folderLocation, accessType, refUploader) VALUES ('098f6bcd4621d373cade4e832627b4f6.txt', 'text.txt', 'text', '/6f837f0400bd1eb70f3648fc31343ecc/098f6bcd4621d373cade4e832627b4f6.txt', 'authenticated', 'aa0000bb-s');