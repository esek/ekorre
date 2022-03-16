-- CreateTable
CREATE TABLE "login_providers" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ref_user" TEXT NOT NULL,

    CONSTRAINT "login_providers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "login_providers" ADD CONSTRAINT "login_providers_ref_user_fkey" FOREIGN KEY ("ref_user") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
