BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"ref"	TEXT,
	"refResource"	INTEGER,
	PRIMARY KEY("ref","refResource"),
	FOREIGN KEY("ref") REFERENCES "Posts"("postname"),
	FOREIGN KEY("refResource") REFERENCES "Resources"("id")
);

CREATE TABLE "IndividualAccess" (
	"ref"	TEXT,
	"refResource"	INTEGER,
	PRIMARY KEY("ref","refResource"),
	FOREIGN KEY("ref") REFERENCES "Users"("username"),
	FOREIGN KEY("refResource") REFERENCES "Resources"("id")
);

INSERT INTO PostAccess VALUES('Macapär', 1);
INSERT INTO PostAccess VALUES('Macapär', 2);
INSERT INTO PostAccess VALUES('Macapär', 4);
INSERT INTO PostAccess VALUES('Ordförande', 1);

INSERT INTO IndividualAccess VALUES('aa0000bb-s', 1);
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 3);

END TRANSACTION;