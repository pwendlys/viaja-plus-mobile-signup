
-- Adicionar campos para melhor rastreamento de documentos rejeitados
ALTER TABLE public.profiles 
ADD COLUMN rejected_documents TEXT[], -- Array de documentos específicos rejeitados
ADD COLUMN resubmission_count INTEGER DEFAULT 0, -- Contador de reenvios
ADD COLUMN last_resubmission_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para histórico de documentos
CREATE TABLE public.document_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'residence_proof', 'cnh_front', 'cnh_back', etc.
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  version INTEGER DEFAULT 1
);

-- Habilitar RLS na tabela document_history
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios documentos
CREATE POLICY "Users can view their own document history"
ON public.document_history
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários inserirem apenas seus próprios documentos
CREATE POLICY "Users can insert their own document history"
ON public.document_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para admin ver todos os documentos
CREATE POLICY "Admin can view all document history"
ON public.document_history
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'
));

-- Política para admin atualizar status dos documentos
CREATE POLICY "Admin can update document history"
ON public.document_history
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'adm@adm.com'
));
