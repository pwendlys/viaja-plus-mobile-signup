
-- Criar tabela para dados bancários dos motoristas
CREATE TABLE public.driver_bank_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_number TEXT,
  agency TEXT,
  pix_key TEXT,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

-- Criar tabela para controle de saldo dos motoristas
CREATE TABLE public.driver_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_withdrawn DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

-- Criar tabela para solicitações de saque
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações de período de saque
CREATE TABLE public.withdrawal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para avaliações de pacientes pelos motoristas
CREATE TABLE public.patient_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.driver_bank_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para driver_bank_data
CREATE POLICY "Drivers can manage their own bank data" 
  ON public.driver_bank_data 
  FOR ALL 
  USING (auth.uid() = driver_id);

CREATE POLICY "Admin can view all bank data" 
  ON public.driver_bank_data 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Políticas RLS para driver_balance
CREATE POLICY "Drivers can view their own balance" 
  ON public.driver_balance 
  FOR SELECT 
  USING (auth.uid() = driver_id);

CREATE POLICY "Admin can manage all balances" 
  ON public.driver_balance 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Políticas RLS para withdrawal_requests
CREATE POLICY "Drivers can create their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (auth.uid() = driver_id);

CREATE POLICY "Admin can manage all withdrawal requests" 
  ON public.withdrawal_requests 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Políticas RLS para withdrawal_settings
CREATE POLICY "Everyone can view withdrawal settings" 
  ON public.withdrawal_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage withdrawal settings" 
  ON public.withdrawal_settings 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Políticas RLS para patient_ratings
CREATE POLICY "Drivers can create ratings for their rides" 
  ON public.patient_ratings 
  FOR INSERT 
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can view ratings related to them" 
  ON public.patient_ratings 
  FOR SELECT 
  USING (auth.uid() = patient_id OR auth.uid() = driver_id OR EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'));

-- Habilitar realtime para as novas tabelas
ALTER TABLE public.driver_bank_data REPLICA IDENTITY FULL;
ALTER TABLE public.driver_balance REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_settings REPLICA IDENTITY FULL;
ALTER TABLE public.patient_ratings REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.driver_bank_data;
ALTER publication supabase_realtime ADD TABLE public.driver_balance;
ALTER publication supabase_realtime ADD TABLE public.withdrawal_requests;
ALTER publication supabase_realtime ADD TABLE public.withdrawal_settings;
ALTER publication supabase_realtime ADD TABLE public.patient_ratings;

-- Criar função para atualizar saldo após corrida concluída
CREATE OR REPLACE FUNCTION update_driver_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.actual_price IS NOT NULL THEN
        INSERT INTO public.driver_balance (driver_id, available_balance, total_earned)
        VALUES (NEW.driver_id, NEW.actual_price, NEW.actual_price)
        ON CONFLICT (driver_id) 
        DO UPDATE SET 
            available_balance = driver_balance.available_balance + NEW.actual_price,
            total_earned = driver_balance.total_earned + NEW.actual_price,
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar saldo automaticamente
CREATE TRIGGER update_driver_balance_trigger
    AFTER UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_balance();
