
-- Criar tabela para armazenar valores por KM por tipo de carro
CREATE TABLE public.km_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_type TEXT NOT NULL, -- 'common' ou 'accessibility'
  price_per_km DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir valores padrão
INSERT INTO public.km_pricing (car_type, price_per_km) VALUES 
('common', 2.50),
('accessibility', 3.00);

-- Adicionar coluna para valor personalizado por KM na tabela drivers
ALTER TABLE public.drivers ADD COLUMN custom_price_per_km DECIMAL(10,2) NULL;

-- Adicionar coluna para indicar se o carro tem acessibilidade
ALTER TABLE public.drivers ADD COLUMN has_accessibility BOOLEAN DEFAULT false;

-- Habilitar RLS na tabela km_pricing
ALTER TABLE public.km_pricing ENABLE ROW LEVEL SECURITY;

-- Criar políticas para km_pricing
CREATE POLICY "Admin can view km pricing" 
  ON public.km_pricing 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

CREATE POLICY "Admin can update km pricing" 
  ON public.km_pricing 
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

CREATE POLICY "Admin can insert km pricing" 
  ON public.km_pricing 
  FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_km_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER km_pricing_updated_at
  BEFORE UPDATE ON public.km_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_km_pricing_updated_at();

-- Habilitar realtime para a tabela km_pricing
ALTER TABLE public.km_pricing REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.km_pricing;
