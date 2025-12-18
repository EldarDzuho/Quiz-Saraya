-- Migration: Add Central Account System Integration
-- Date: 2025-12-15
-- Description: Adds User table and accountId fields for central account system integration

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add indexes for User table
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_accountId_idx" ON "User"("accountId");

-- Add accountId columns to existing tables
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "playerEmail" TEXT;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "accountId" TEXT;

ALTER TABLE "ScoreEntry" ADD COLUMN IF NOT EXISTS "accountId" TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS "Attempt_accountId_idx" ON "Attempt"("accountId");
CREATE INDEX IF NOT EXISTS "ScoreEntry_accountId_idx" ON "ScoreEntry"("accountId");
