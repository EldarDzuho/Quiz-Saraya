-- Add isActive column to QuizPost table
-- This migration is idempotent and safe to run multiple times

DO $$ 
BEGIN
  -- Add isActive column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'QuizPost' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE "QuizPost" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added isActive column to QuizPost';
  ELSE
    RAISE NOTICE 'isActive column already exists on QuizPost';
  END IF;
END $$;
