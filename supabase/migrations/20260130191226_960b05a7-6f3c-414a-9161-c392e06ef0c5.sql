-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create complaints table (Reclamações)
CREATE TABLE public.reclamacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nota_rc INTEGER,
    nota_fs INTEGER,
    instalacao INTEGER,
    prazo DATE,
    cidade TEXT,
    tipo_reclamacao TEXT,
    respondido_em DATE,
    conclusao TEXT,
    observacoes TEXT,
    equipe_responsavel TEXT,
    data_visita DATE,
    arquivada BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reclamacoes
ALTER TABLE public.reclamacoes ENABLE ROW LEVEL SECURITY;

-- Reclamacoes policies
CREATE POLICY "Users can view all reclamacoes" 
ON public.reclamacoes FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert reclamacoes" 
ON public.reclamacoes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reclamacoes" 
ON public.reclamacoes FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Users can delete their own reclamacoes" 
ON public.reclamacoes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create APCL table (Ouvidorias)
CREATE TABLE public.apcl (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origem TEXT,
    nota_av INTEGER,
    nota_fs INTEGER,
    unidade_consumidora INTEGER,
    prazo_resposta DATE,
    cidade TEXT,
    data_visita DATE,
    visitado DATE,
    tratativa TEXT,
    cod INTEGER,
    equipe TEXT,
    devolutiva TEXT,
    observacoes TEXT,
    arquivada BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on apcl
ALTER TABLE public.apcl ENABLE ROW LEVEL SECURITY;

-- APCL policies
CREATE POLICY "Users can view all apcl" 
ON public.apcl FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert apcl" 
ON public.apcl FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update apcl" 
ON public.apcl FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Users can delete their own apcl" 
ON public.apcl FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reclamacoes_updated_at
BEFORE UPDATE ON public.reclamacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apcl_updated_at
BEFORE UPDATE ON public.apcl
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();