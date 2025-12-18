-- Migration: Add Device Tracking and Enhanced Analytics
-- Run this in Supabase Studio SQL Editor
-- Safe to run multiple times (idempotent)

-- Step 1: Add deviceHash to Attempt table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Attempt' AND column_name = 'deviceHash') THEN
        ALTER TABLE "Attempt" ADD COLUMN "deviceHash" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Step 2: Add indexes for Attempt.deviceHash (if not exists)
CREATE INDEX IF NOT EXISTS "Attempt_quizPostId_deviceHash_idx" ON "Attempt"("quizPostId", "deviceHash");
CREATE INDEX IF NOT EXISTS "Attempt_deviceHash_idx" ON "Attempt"("deviceHash");

-- Step 3: Complete rewrite of ScoreEntry table
-- First, drop the old table (backup data if needed!)
DROP TABLE IF EXISTS "ScoreEntry" CASCADE;

-- Recreate ScoreEntry with new schema
CREATE TABLE "ScoreEntry" (
    "id" TEXT NOT NULL,
    "quizPostId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreEntry_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on attemptId
CREATE UNIQUE INDEX "ScoreEntry_attemptId_key" ON "ScoreEntry"("attemptId");

-- Add all indexes per spec
CREATE INDEX "ScoreEntry_quizPostId_createdAt_idx" ON "ScoreEntry"("quizPostId", "createdAt");
CREATE INDEX "ScoreEntry_quizPostId_deviceHash_idx" ON "ScoreEntry"("quizPostId", "deviceHash");
CREATE INDEX "ScoreEntry_quizPostId_emailHash_idx" ON "ScoreEntry"("quizPostId", "emailHash");
CREATE INDEX "ScoreEntry_deviceHash_idx" ON "ScoreEntry"("deviceHash");
CREATE INDEX "ScoreEntry_emailHash_idx" ON "ScoreEntry"("emailHash");

-- Add foreign keys
ALTER TABLE "ScoreEntry" ADD CONSTRAINT "ScoreEntry_quizPostId_fkey" FOREIGN KEY ("quizPostId") REFERENCES "QuizPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScoreEntry" ADD CONSTRAINT "ScoreEntry_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Add unique constraint on Question order (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Question_quizPostId_order_key" ON "Question"("quizPostId", "order");

-- Step 5: Add unique constraint on Choice order (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Choice_questionId_order_key" ON "Choice"("questionId", "order");

-- Done! All schema changes applied.
