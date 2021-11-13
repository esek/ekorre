CREATE TABLE IF NOT EXISTS "Meetings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "number" INTEGER,
  "year" INTEGER NOT NULL,
  "refsummons" TEXT,
  "refdocuments" TEXT,
  "reflateDocuments" TEXT,
  "refprotocol" TEXT,
  FOREIGN KEY("refsummons") REFERENCES "Files"("id"),
  FOREIGN KEY("refdocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("reflateDocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("refprotocol") REFERENCES "Files"("id"),
);