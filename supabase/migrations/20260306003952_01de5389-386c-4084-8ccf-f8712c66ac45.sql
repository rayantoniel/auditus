
ALTER TABLE public.reclamacoes ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.apcl ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
