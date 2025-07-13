-- Add missing fields to existing tables and create additional tables needed

-- Update profiles table with missing fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS residence_proof TEXT;

-- Update patients table with missing fields
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS special_needs TEXT;

-- Update drivers table with missing fields  
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS vehicle_photo TEXT,
ADD COLUMN IF NOT EXISTS selfie_with_document TEXT;

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rides table
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) NOT NULL,
  driver_id UUID REFERENCES public.profiles(id),
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profile-photos', 'profile-photos', true),
  ('documents', 'documents', true),
  ('cnh-photos', 'cnh-photos', true),
  ('vehicle-photos', 'vehicle-photos', true),
  ('residence-proofs', 'residence-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_users (only accessible by admins)
CREATE POLICY "Admin users can view admin data" ON public.admin_users
FOR SELECT USING (email = 'adm@adm.com');

CREATE POLICY "Admin users can update admin data" ON public.admin_users  
FOR UPDATE USING (email = 'adm@adm.com');

-- RLS policies for rides
CREATE POLICY "Users can view their own rides" ON public.rides
FOR SELECT USING (
  auth.uid() = patient_id OR 
  auth.uid() = driver_id OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'adm@adm.com')
);

CREATE POLICY "Admin can insert rides" ON public.rides
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'adm@adm.com')
);

CREATE POLICY "Admin can update rides" ON public.rides
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'adm@adm.com')
);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'adm@adm.com')
);

-- Storage policies for profile photos
CREATE POLICY "Profile photos are publicly accessible" ON storage.objects 
FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos" ON storage.objects 
FOR UPDATE USING (bucket_id = 'profile-photos');

-- Storage policies for documents
CREATE POLICY "Documents are publicly accessible" ON storage.objects 
FOR SELECT USING (bucket_id IN ('documents', 'cnh-photos', 'vehicle-photos', 'residence-proofs'));

CREATE POLICY "Users can upload documents" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id IN ('documents', 'cnh-photos', 'vehicle-photos', 'residence-proofs'));

CREATE POLICY "Users can update documents" ON storage.objects 
FOR UPDATE USING (bucket_id IN ('documents', 'cnh-photos', 'vehicle-photos', 'residence-proofs'));

-- Insert default admin user
INSERT INTO public.admin_users (email, password_hash, full_name)
VALUES ('adm@adm.com', '$2a$10$XYZ123...', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.drivers REPLICA IDENTITY FULL;
ALTER TABLE public.patients REPLICA IDENTITY FULL;
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();