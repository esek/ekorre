BEGIN TRANSACTION;

CREATE TABLE "Posts" (
	"postname" TEXT NOT NULL,
	"utskott"	TEXT NOT NULL,
	PRIMARY KEY("postname")
);

CREATE TABLE "PostHistory" (
	"refpost"	TEXT NOT NULL,
	"refuser"	TEXT NOT NULL,
	"start"	TEXT NOT NULL,
	"end"	TEXT,
	"period" INT,
	PRIMARY KEY("refpost","refuser","period"),
	FOREIGN KEY("refuser") REFERENCES "Users"("username"),
	FOREIGN KEY("refpost") REFERENCES "Posts"("postname")
);

END TRANSACTION;