
-- Create ride_locations table for real-time location tracking
CREATE TABLE public.ride_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('driver', 'patient')),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for ride_locations
CREATE POLICY "Users can view locations for their rides" 
  ON public.ride_locations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_locations.ride_id 
      AND (rides.patient_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own location" 
  ON public.ride_locations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" 
  ON public.ride_locations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable realtime for ride_locations
ALTER TABLE public.ride_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_locations;
