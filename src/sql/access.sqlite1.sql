CREATE TABLE "Access" (
	"refname"	TEXT,
	"refresource"	INTEGER,
	PRIMARY KEY("refname","refresource"),
	FOREIGN KEY("refname") REFERENCES "Posts"("postname") ON UPDATE RESTRICT,
	FOREIGN KEY("refname") REFERENCES "Users"("username") ON UPDATE RESTRICT,
	FOREIGN KEY("refresource") REFERENCES "AccessResources"("id")
);

INSERT INTO Access VALUES('Macapär', 1);
INSERT INTO Access VALUES('Macapär', 2);
INSERT INTO Access VALUES('Macapär', 4);
INSERT INTO Access VALUES('Ordförande', 1);

INSERT INTO Access VALUES('aa0000bb-s', 1);
INSERT INTO Access VALUES('aa0000bb-s', 3);