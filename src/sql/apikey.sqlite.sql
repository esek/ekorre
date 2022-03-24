CREATE TABLE "ApiKeys" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"key"	TEXT NOT NULL UNIQUE,
	"createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"refcreator" TEXT NOT NULL,
	FOREIGN KEY("refcreator") REFERENCES "Users"("username")
)