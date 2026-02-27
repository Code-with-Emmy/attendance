-- Add employee profile fields to user
ALTER TABLE "User"
ADD COLUMN "phone" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "bio" TEXT;
