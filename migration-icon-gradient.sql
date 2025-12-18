-- Add icon and gradient columns to QuizPost table
-- This migration is idempotent and safe to run multiple times

DO $$ 
BEGIN
  -- Add icon column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'QuizPost' AND column_name = 'icon'
  ) THEN
    ALTER TABLE "QuizPost" ADD COLUMN "icon" TEXT DEFAULT 'Brain';
    RAISE NOTICE 'Added icon column to QuizPost';
  ELSE
    RAISE NOTICE 'icon column already exists on QuizPost';
  END IF;

  -- Add gradient column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'QuizPost' AND column_name = 'gradient'
  ) THEN
    ALTER TABLE "QuizPost" ADD COLUMN "gradient" TEXT DEFAULT 'from-purple-500 to-pink-500';
    RAISE NOTICE 'Added gradient column to QuizPost';
  ELSE
    RAISE NOTICE 'gradient column already exists on QuizPost';
  END IF;
END $$;
