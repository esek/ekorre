BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Users" (
	"username"	TEXT NOT NULL,
	"passwordHash" TEXT NOT NULL,
	"salt" TEXT NOT NULL,
	"name"	TEXT NOT NULL,
	"lastname"	TEXT NOT NULL,
	"class"	TEXT NOT NULL,
	"datejoined" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("username")
);

-- Alla lösenord är test men olika hash pga salt.
INSERT INTO "Users" ("username","passwordHash","salt","name","lastname","class") 
VALUES ('aa0000bb-s','Y8IUptOZ0LI3sUUP6JVNtOZiNaIblxTTXBIJ4JIBFzr/PZgFoGHM0ua7hVFCb3yFSlyV/DI0/G/br7cU9qG4Ag==',
'Z1w2IPe1l9nCKwWM6RV+PA==','Emil','Blennow','E19');
INSERT INTO "Users" ("username","passwordHash","salt","name","lastname","class")
VALUES ('bb1111cc-s','Os3+GcPpLwK+PWF9mei/dstvdawQGpT0C4wP1oebTBp5JVooisVLpOJK4/ja2lsVuTLJlC6BKKJTWgummBXXtA==',
'MNuYPYgl6wy9GlDjYKpMiw==','Leif','Persson','E16');
INSERT INTO "Users" ("username","passwordHash","salt","name","lastname","class")
VALUES ('no0000oh-s','lQFpDvvCGSVywE3PTjpTUSzwWYfGwlE4MxJ/dGZp0YRe7N/U8zKUx6NWA2aGWD7p/c090lpWYDIEcuXnaiFz5Q==',
'zXr+8b22sOLTvi/Zstu9Zw==','Lena','Handén','BME19');
COMMIT;
