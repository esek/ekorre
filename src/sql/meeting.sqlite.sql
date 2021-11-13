CREATE TABLE IF NOT EXISTS "Meetings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "refsummons" TEXT,
  "refdocuments" TEXT,
  "reflateDocuments" TEXT,
  "refprotocol" TEXT,
  FOREIGN KEY("refsummons") REFERENCES "Files"("id"),
  FOREIGN KEY("refdocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("reflateDocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("refprotocol") REFERENCES "Files"("id")
);

INSERT INTO Meetings (type, year) VALUES ('VM', 2020);
INSERT INTO Meetings (type, number, year) VALUES ('SM', 1, 1962);
INSERT INTO Meetings (type, number, year) VALUES ('Extra', 1, 2050);