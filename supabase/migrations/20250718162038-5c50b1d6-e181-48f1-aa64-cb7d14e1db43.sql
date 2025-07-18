
-- Criar tabela para mensagens de chat entre paciente e motorista
CREATE TABLE public.ride_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'driver')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para solicitações de cancelamento
CREATE TABLE public.ride_cancellation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  response_reason TEXT,
  responded_by UUID,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- RLS para mensagens de chat
ALTER TABLE public.ride_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages for their rides" 
  ON public.ride_chat_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_chat_messages.ride_id 
      AND (rides.patient_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can send chat messages for their rides" 
  ON public.ride_chat_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_chat_messages.ride_id 
      AND (rides.patient_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

-- RLS para solicitações de cancelamento
ALTER TABLE public.ride_cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cancellation requests for their rides" 
  ON public.ride_cancellation_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_cancellation_requests.ride_id 
      AND (rides.patient_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Patients can create cancellation requests for their rides" 
  ON public.ride_cancellation_requests 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = requested_by AND
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_cancellation_requests.ride_id 
      AND rides.patient_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can respond to cancellation requests" 
  ON public.ride_cancellation_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_cancellation_requests.ride_id 
      AND rides.driver_id = auth.uid()
    )
  );

-- Admin pode ver e gerenciar tudo
CREATE POLICY "Admin can manage all chat messages" 
  ON public.ride_chat_messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = 'adm@adm.com'
    )
  );

CREATE POLICY "Admin can manage all cancellation requests" 
  ON public.ride_cancellation_requests 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = 'adm@adm.com'
    )
  );
