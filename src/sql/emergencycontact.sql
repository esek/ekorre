CREATE TABLE IF NOT EXISTS "EmergencyContacts" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
	"refuser" TEXT NOT NULL,
  FOREIGN KEY("refuser") REFERENCES "Users"("username")
);