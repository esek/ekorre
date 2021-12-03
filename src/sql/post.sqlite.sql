BEGIN TRANSACTION;

CREATE TABLE "Posts" (
	"postname" TEXT NOT NULL,
	"utskott"	TEXT NOT NULL,
	"postType" TEXT NOT NULL,
	"spots" INT NOT NULL,
	"description" TEXT NOT NULL,
	"active" BOOLEAN NOT NULL,
	"interviewRequired" BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY("postname")
);

CREATE TABLE "PostHistory" (
	"refpost"	TEXT NOT NULL,
	"refuser"	TEXT NOT NULL,
	"start"	TIMESTAMP NOT NULL,
	"end"	TIMESTAMP,
	PRIMARY KEY("refpost","refuser","start"),
	FOREIGN KEY("refuser") REFERENCES "Users"("username"),
	FOREIGN KEY("refpost") REFERENCES "Posts"("postname")
);

INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Macapär','INFU','N',2,'Informationschefsslav',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Teknokrat','INFU','N',3,'Ljudperson',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Cophös','NOLLU','N',5,'Stressad',1,1);
INSERT INTO PostHistory (refpost,refuser,"start","end") VALUES ('Macapär','aa0000bb-s', 1577833200, 1609369200);
INSERT INTO PostHistory (refpost,refuser,"start","end") VALUES ('Macapär','aa0000bb-s', 1609369200, null);

END TRANSACTION;