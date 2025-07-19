
-- Adicionar novos campos na tabela withdrawal_requests para controle de prazos
ALTER TABLE public.withdrawal_requests 
ADD COLUMN payment_due_date timestamp with time zone,
ADD COLUMN payment_completed_at timestamp with time zone,
ADD COLUMN payment_method text;

-- Criar função para calcular automaticamente a data limite (7 dias) quando o status for aprovado
CREATE OR REPLACE FUNCTION public.set_payment_due_date()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Se o status mudou para 'approved' e não tinha data limite ainda
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.payment_due_date IS NULL THEN
    NEW.payment_due_date = NOW() + INTERVAL '7 days';
  END IF;
  
  -- Se o status mudou para 'completed', registrar a data de conclusão
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.payment_completed_at IS NULL THEN
    NEW.payment_completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para a função
CREATE TRIGGER set_payment_due_date_trigger
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_due_date();

-- Adicionar índices para melhorar performance nas consultas
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_driver_id ON public.withdrawal_requests(driver_id);
CREATE INDEX idx_withdrawal_requests_payment_due_date ON public.withdrawal_requests(payment_due_date);
