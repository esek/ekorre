BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"ref"	TEXT,
	"resourcetype"	TEXT,
	"resource"	TEXT,
	PRIMARY KEY("ref","resouce"),
	FOREIGN KEY("ref") REFERENCES "Posts"("postname")
);

CREATE TABLE "IndividualAccess" (
	"ref"	TEXT,
	"resourcetype"	TEXT,
	"resource"	TEXT,
	PRIMARY KEY("ref","resource")
	FOREIGN KEY("ref") REFERENCES "Users"("username")
);

END TRANSACTION;