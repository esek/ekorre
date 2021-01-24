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

INSERT INTO Posts (postname,utskott) VALUES ('Macapär','INFU');
INSERT INTO Posts (postname,utskott) VALUES ('Teknokrat','INFU');
INSERT INTO Posts (postname,utskott) VALUES ('Cophös','NOLLU');
INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s','2020-12-29','2020-12-30',2020);
INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s','2020-12-29',null,2021);

END TRANSACTION;