
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
  patient?: {
    full_name: string;
    phone: string;
  } | null;
}

export const useRideMatching = (driverId?: string, isOnline: boolean = false) => {
  const { toast } = useToast();
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available rides
  const fetchAvailableRides = async () => {
    try {
      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          patient:profiles!rides_patient_id_fkey(full_name, phone)
        `)
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedRides: RideRequest[] = (rides || []).map(ride => ({
        ...ride,
        patient: Array.isArray(ride.patient) ? ride.patient[0] : ride.patient
      }));
      
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
            message: 'Um motorista aceitou sua corrida e está a caminho!',
          });
      }

      toast({
        title: "Corrida Aceita",
        description: "Você aceitou a corrida com sucesso!",
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

  // Calculate distance and price
  const calculateRidePrice = async (pickup: string, destination: string, carType: 'common' | 'accessibility') => {
    try {
      // Get pricing from database
      const { data: pricing, error: pricingError } = await supabase
        .from('km_pricing')
        .select('price_per_km')
        .eq('car_type', carType)
        .single();

      if (pricingError) throw pricingError;

      // For now, we'll use a simple estimation
      // In a real implementation, you'd use Mapbox Directions API
      const estimatedDistance = 10; // km (placeholder)
      const estimatedPrice = estimatedDistance * pricing.price_per_km;

      return {
        distance: estimatedDistance,
        price: estimatedPrice
      };
    } catch (error) {
      console.error('Error calculating price:', error);
      return null;
    }
  };

  // Real-time updates for new ride requests
  useEffect(() => {
    if (!isOnline) return;

    fetchAvailableRides();

    const channel = supabase
      .channel('ride-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rides'
      }, (payload) => {
        const newRide = payload.new as any;
        if (newRide.status === 'pending' && !newRide.driver_id) {
          // Show notification for new ride request
          toast({
            title: "Nova Corrida Disponível",
            description: `Corrida de ${newRide.pickup_address} para ${newRide.destination_address}`,
          });
          
          fetchAvailableRides();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides'
      }, () => {
        fetchAvailableRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline]);

  return {
    availableRides,
    loading,
    acceptRide,
    calculateRidePrice,
    fetchAvailableRides
  };
};
