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
	"start"	DATE NOT NULL,
	"end"	DATE,
	"period" INT,
	PRIMARY KEY("refpost","refuser","period"),
	FOREIGN KEY("refuser") REFERENCES "Users"("username"),
	FOREIGN KEY("refpost") REFERENCES "Posts"("postname")
);

INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Macapär','INFU','N',2,'Informationschefsslav',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Teknokrat','INFU','N',3,'Ljudperson',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Cophös','NOLLU','N',5,'Stressad',1,1);
-- Dessa bör ha JS-dates istället
-- INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s','2020-12-29','2020-12-30',2020);
-- INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s','2020-12-29',null,2021);

END TRANSACTION;