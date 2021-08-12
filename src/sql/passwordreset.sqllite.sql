CREATE TABLE
IF NOT EXISTS "PasswordReset"
(
  "token" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "time" NUMBER NOT NULL,
);