
CREATE TABLE public.opcoes_campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  valor text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (categoria, valor)
);

ALTER TABLE public.opcoes_campos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view opcoes_campos"
ON public.opcoes_campos FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can insert opcoes_campos"
ON public.opcoes_campos FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone authenticated can delete opcoes_campos"
ON public.opcoes_campos FOR DELETE TO authenticated
USING (true);
