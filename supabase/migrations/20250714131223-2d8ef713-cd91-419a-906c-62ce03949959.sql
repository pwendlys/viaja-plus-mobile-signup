
-- Criar tabela para endereços favoritos dos pacientes
CREATE TABLE public.patient_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para contatos de emergência
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para avaliações de motoristas
CREATE TABLE public.driver_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas extras na tabela rides para agendamento e status
ALTER TABLE public.rides ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rides ADD COLUMN rating_id UUID REFERENCES driver_ratings(id);
ALTER TABLE public.rides ADD COLUMN estimated_price DECIMAL(10,2);
ALTER TABLE public.rides ADD COLUMN actual_price DECIMAL(10,2);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.patient_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para patient_favorites
CREATE POLICY "Patients can manage their own favorites" 
  ON public.patient_favorites 
  FOR ALL 
  USING (auth.uid() = patient_id);

-- Políticas RLS para emergency_contacts
CREATE POLICY "Patients can manage their own emergency contacts" 
  ON public.emergency_contacts 
  FOR ALL 
  USING (auth.uid() = patient_id);

-- Políticas RLS para driver_ratings
CREATE POLICY "Patients can create ratings for their rides" 
  ON public.driver_ratings 
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can view ratings related to them" 
  ON public.driver_ratings 
  FOR SELECT 
  USING (auth.uid() = patient_id OR auth.uid() = driver_id OR EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Permitir que pacientes criem suas próprias corridas
CREATE POLICY "Patients can create their own rides" 
  ON public.rides 
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

-- Habilitar realtime para as novas tabelas
ALTER TABLE public.patient_favorites REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_contacts REPLICA IDENTITY FULL;
ALTER TABLE public.driver_ratings REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.patient_favorites;
ALTER publication supabase_realtime ADD TABLE public.emergency_contacts;
ALTER publication supabase_realtime ADD TABLE public.driver_ratings;
