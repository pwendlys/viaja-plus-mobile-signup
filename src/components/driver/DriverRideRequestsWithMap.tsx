
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Clock, Zap } from "lucide-react";
import { useRideMatching } from "@/hooks/useRideMatching";
import { useRealTimeLocation } from "@/hooks/useRealTimeLocation";
import RideRequestCard from "@/components/RideRequestCard";
import MapboxMap from "@/components/MapboxMap";
import ActiveRideManager from "@/components/driver/ActiveRideManager";
import { supabase } from "@/integrations/supabase/client";

interface DriverRideRequestsWithMapProps {
  driverData: any;
  isOnline?: boolean;
}

const DriverRideRequestsWithMap: React.FC<DriverRideRequestsWithMapProps> = ({ 
  driverData, 
  isOnline = false 
}) => {
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<any | null>(null);
  
  const { availableRides, loading, acceptRide } = useRideMatching(driverData?.id, isOnline);
  const { currentLocation, startTracking, stopTracking } = useRealTimeLocation({
    userId: driverData?.id,
    rideId: currentRideId || undefined,
    trackLocation: isOnline && !!currentRideId
  });

  useEffect(() => {
    fetchActiveRides();
    
    // Set up real-time subscription for active rides
    const subscription = supabase
      .channel('driver-active-rides')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides',
        filter: `driver_id=eq.${driverData?.id}`
      }, () => {
        console.log('Active rides updated, refreshing...');
        fetchActiveRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [driverData?.id]);

  useEffect(() => {
    if (isOnline && currentRideId) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [isOnline, currentRideId]);

  const fetchActiveRides = async () => {
    if (!driverData?.id) return;

    try {
      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          patient:patient_id(full_name, phone)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveRides(rides || []);
      
      // Set current ride for tracking
      const currentRide = rides?.find(r => r.status === 'accepted' || r.status === 'in_progress');
      if (currentRide) {
        setCurrentRideId(currentRide.id);
        setActiveRide(currentRide);
      } else {
        setCurrentRideId(null);
        setActiveRide(null);
      }
    } catch (error) {
      console.error('Error fetching active rides:', error);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    const success = await acceptRide(rideId);
    if (success) {
      setCurrentRideId(rideId);
      fetchActiveRides();
    }
  };

  const handleRideCompleted = () => {
    setCurrentRideId(null);
    setActiveRide(null);
    fetchActiveRides();
  };

  const getDriverCarType = () => {
    return driverData?.drivers?.[0]?.has_accessibility ? 'accessibility' : 'common';
  };

  // Separate immediate and scheduled rides
  const immediateRides = availableRides.filter(ride => !ride.scheduled_for);
  const scheduledRides = availableRides.filter(ride => ride.scheduled_for);

  // Prepare map markers
  const mapMarkers = [];
  if (currentLocation) {
    mapMarkers.push({
      id: 'driver',
      coordinates: [currentLocation.lng, currentLocation.lat],
      type: 'driver' as const,
    });
  }

  // Se há uma corrida ativa, mostrar o componente de gerenciamento
  if (activeRide) {
    return (
      <ActiveRideManager
        ride={activeRide}
        driverLocation={currentLocation}
        onRideCompleted={handleRideCompleted}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa - Sua Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <MapboxMap
            center={currentLocation ? [currentLocation.lng, currentLocation.lat] : undefined}
            markers={mapMarkers}
            className="w-full h-64 rounded-lg"
          />
          {currentLocation && (
            <div className="mt-2 text-sm text-gray-600">
              📍 Sua localização: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso de Status Offline */}
      {!isOnline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <WifiOff className="w-5 h-5" />
              <p className="font-medium">Você está offline</p>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Ative o status online no topo da página para receber e aceitar corridas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Corridas Imediatas Disponíveis */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Corridas Imediatas</h2>
          <Badge variant="secondary">{immediateRides.length}</Badge>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Carregando corridas...</div>
          </div>
        ) : immediateRides.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhuma corrida imediata disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {immediateRides.map((ride) => (
              <RideRequestCard
                key={ride.id}
                ride={ride}
                onAccept={handleAcceptRide}
                isOnline={isOnline}
                driverType={getDriverCarType()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Corridas Agendadas Disponíveis */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold">Corridas Agendadas</h2>
          <Badge variant="secondary">{scheduledRides.length}</Badge>
        </div>
        
        {scheduledRides.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhuma corrida agendada disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scheduledRides.map((ride) => (
              <RideRequestCard
                key={ride.id}
                ride={ride}
                onAccept={handleAcceptRide}
                isOnline={isOnline}
                driverType={getDriverCarType()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRideRequestsWithMap;
