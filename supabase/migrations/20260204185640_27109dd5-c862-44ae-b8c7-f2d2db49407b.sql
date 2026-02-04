-- Add conclusao column to apcl table
ALTER TABLE public.apcl ADD COLUMN IF NOT EXISTS conclusao text;