
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RideRequest {
  id: string;
  patient_id: string;
  pickup_address: string;
  destination_address: string;
  pickup_date: string;
  pickup_time: string;
  estimated_price: number;
  status: string;
  scheduled_for?: string;
  patient?: {
    full_name: string;
    phone: string;
  } | null;
}

export const useRideMatching = (driverId?: string, isOnline: boolean = false) => {
  const { toast } = useToast();
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available rides including scheduled ones
  const fetchAvailableRides = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          patient:profiles!rides_patient_id_fkey(full_name, phone)
        `)
        .is('driver_id', null)
        .eq('status', 'pending')
        .or(`scheduled_for.is.null,scheduled_for.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedRides: RideRequest[] = (rides || []).map(ride => ({
        ...ride,
        patient: Array.isArray(ride.patient) ? ride.patient[0] : ride.patient
      }));
      
      console.log('Available rides fetched:', transformedRides);
      setAvailableRides(transformedRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  // Accept a ride
  const acceptRide = async (rideId: string) => {
    if (!driverId || !isOnline) {
      toast({
        title: "Não é possível aceitar",
        description: "Você precisa estar online para aceitar corridas.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_id: driverId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .is('driver_id', null); // Ensure ride is still available

      if (error) throw error;

      // Create notification for patient
      const ride = availableRides.find(r => r.id === rideId);
      if (ride) {
        await supabase
          .from('notifications')
          .insert({
            user_id: ride.patient_id,
            title: 'Corrida Aceita',
            message: `Um motorista aceitou sua corrida ${ride.scheduled_for ? 'agendada' : ''} e está a caminho!`,
          });
      }

      toast({
        title: "Corrida Aceita",
        description: `Você aceitou a corrida ${ride?.scheduled_for ? 'agendada' : ''} com sucesso! Dirija-se ao local de coleta.`,
      });

      fetchAvailableRides();
      return true;
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a corrida. Ela pode já ter sido aceita por outro motorista.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calculate distance and price using Mapbox
  const calculateRidePrice = async (pickup: string, destination: string, carType: 'common' | 'accessibility') => {
    try {
      console.log('Calculating ride price for:', { pickup, destination, carType });
      
      const { data, error } = await supabase.functions.invoke('calculate-ride-price', {
        body: {
          pickup_address: pickup,
          destination_address: destination,
          car_type: carType
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Price calculation result:', data);
      return data;
    } catch (error) {
      console.error('Error calculating price:', error);
      return null;
    }
  };

  // Real-time updates for new ride requests (both immediate and scheduled)
  useEffect(() => {
    if (!isOnline) return;

    fetchAvailableRides();

    // Subscribe to real-time ride updates
    const ridesChannel = supabase
      .channel('ride-requests-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rides'
      }, (payload) => {
        const newRide = payload.new as any;
        console.log('New ride request received:', newRide);
        
        if (newRide.status === 'pending' && !newRide.driver_id) {
          const isScheduled = newRide.scheduled_for && new Date(newRide.scheduled_for) > new Date();
          
          // Show notification for new ride request
          toast({
            title: isScheduled ? "Nova Corrida Agendada Disponível" : "Nova Corrida Disponível",
            description: `${isScheduled ? 'Agendamento' : 'Corrida'} de ${newRide.pickup_address} para ${newRide.destination_address}`,
            duration: 8000,
          });
          
          // Play notification sound (optional)
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(e => console.log('Could not play notification sound'));
          
          fetchAvailableRides();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides'
      }, (payload) => {
        console.log('Ride updated:', payload);
        fetchAvailableRides();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'rides'
      }, () => {
        fetchAvailableRides();
      })
      .subscribe();

    // Also listen for profile status changes to update ride availability
    const profileChannel = supabase
      .channel('driver-status-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${driverId}`
      }, (payload) => {
        const updatedProfile = payload.new as any;
        console.log('Driver profile updated:', updatedProfile);
        
        if (updatedProfile.status === 'approved') {
          toast({
            title: "Perfil Aprovado!",
            description: "Agora você pode receber corridas em tempo real!",
          });
          fetchAvailableRides();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ridesChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [isOnline, driverId]);

  // Fetch rides periodically for scheduled rides that become available
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      fetchAvailableRides();
    }, 30000); // Check every 30 seconds for scheduled rides

    return () => clearInterval(interval);
  }, [isOnline]);

  return {
    availableRides,
    loading,
    acceptRide,
    calculateRidePrice,
    fetchAvailableRides
  };
};
