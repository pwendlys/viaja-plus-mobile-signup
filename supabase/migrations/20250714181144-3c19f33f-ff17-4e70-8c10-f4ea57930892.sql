
-- Remover as políticas RLS existentes para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Remover as políticas RLS existentes para patients
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own data" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own data" ON public.patients;

-- Criar novas políticas mais permissivas para profiles
CREATE POLICY "Allow profile creation for registration" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view their own profile or admin can view all" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com')
  );

CREATE POLICY "Users can update their own profile or admin can update all" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com')
  );

-- Criar novas políticas mais permissivas para patients
CREATE POLICY "Allow patient data creation for registration" 
  ON public.patients 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view their own patient data or admin can view all" 
  ON public.patients 
  FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com')
  );

CREATE POLICY "Users can update their own patient data or admin can update all" 
  ON public.patients 
  FOR UPDATE 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = 'adm@adm.com')
  );
