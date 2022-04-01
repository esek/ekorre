BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Users" (
	"username"	TEXT NOT NULL,

	"passwordHash" TEXT NOT NULL,
	"passwordSalt" TEXT NOT NULL,

	"firstName"	TEXT NOT NULL,
	"lastName"	TEXT NOT NULL,

	"photoUrl" TEXT,

	"email" TEXT NOT NULL,
	"phone" TEXT,
	"address" TEXT,
	"zipCode" TEXT,
	"website" TEXT,

	"class"	TEXT NOT NULL,
	"dateJoined" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY("username")
);


-- Alla lösenord är test men olika hash pga salt.
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email") 
VALUES ('aa0000bb-s','Y8IUptOZ0LI3sUUP6JVNtOZiNaIblxTTXBIJ4JIBFzr/PZgFoGHM0ua7hVFCb3yFSlyV/DI0/G/br7cU9qG4Ag==',
'Z1w2IPe1l9nCKwWM6RV+PA==','Emil','Blennow','E19', "aa0000bb-s@student.lu.se");
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email")
VALUES ('bb1111cc-s','Os3+GcPpLwK+PWF9mei/dstvdawQGpT0C4wP1oebTBp5JVooisVLpOJK4/ja2lsVuTLJlC6BKKJTWgummBXXtA==',
'MNuYPYgl6wy9GlDjYKpMiw==','Leif','Persson','E16','aa0000bb-s@student.lu.se');
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email")
VALUES ('no0000oh-s','lQFpDvvCGSVywE3PTjpTUSzwWYfGwlE4MxJ/dGZp0YRe7N/U8zKUx6NWA2aGWD7p/c090lpWYDIEcuXnaiFz5Q==',
'zXr+8b22sOLTvi/Zstu9Zw==','Lena','Handén','BME19','aa0000bb-s@student.lu.se');

END TRANSACTION;
