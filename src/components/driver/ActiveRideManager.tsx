
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, CheckCircle, Phone, MessageCircle, Map } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MapboxMap from '@/components/MapboxMap';
import FullScreenNavigationMap from '@/components/driver/FullScreenNavigationMap';
import { useRealTimeLocation } from '@/hooks/useRealTimeLocation';

interface ActiveRideManagerProps {
  ride: any;
  driverLocation: { lat: number; lng: number } | null;
  onRideCompleted: () => void;
}

const ActiveRideManager: React.FC<ActiveRideManagerProps> = ({
  ride,
  driverLocation,
  onRideCompleted
}) => {
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(ride.status);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [isNearPickup, setIsNearPickup] = useState(false);
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);

  const { currentLocation, startTracking, stopTracking } = useRealTimeLocation({
    userId: ride.driver_id,
    rideId: ride.id,
    trackLocation: true
  });

  useEffect(() => {
    geocodeAddresses();
    startTracking();
    
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    checkProximity();
  }, [driverLocation, pickupCoords, destinationCoords, currentStatus]);

  const geocodeAddresses = async () => {
    try {
      // Geocodificar endereço de coleta
      const pickupResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(ride.pickup_address)}.json?access_token=${await getMapboxToken()}&country=BR`
      );
      const pickupData = await pickupResponse.json();
      
      if (pickupData.features && pickupData.features.length > 0) {
        const coords = pickupData.features[0].center;
        setPickupCoords([coords[0], coords[1]]);
      }

      // Geocodificar endereço de destino
      const destResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(ride.destination_address)}.json?access_token=${await getMapboxToken()}&country=BR`
      );
      const destData = await destResponse.json();
      
      if (destData.features && destData.features.length > 0) {
        const coords = destData.features[0].center;
        setDestinationCoords([coords[0], coords[1]]);
      }
    } catch (error) {
      console.error('Error geocoding addresses:', error);
    }
  };

  const getMapboxToken = async () => {
    try {
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      return data.token;
    } catch (error) {
      console.error('Error getting Mapbox token:', error);
      return '';
    }
  };

  const checkProximity = () => {
    if (!driverLocation) return;

    if (currentStatus === 'accepted' && pickupCoords) {
      const distance = calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        pickupCoords[1],
        pickupCoords[0]
      );
      setIsNearPickup(distance < 0.5); // 500 metros
    }

    if (currentStatus === 'in_progress' && destinationCoords) {
      const distance = calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        destinationCoords[1],
        destinationCoords[0]
      );
      setIsNearDestination(distance < 0.5); // 500 metros
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startRide = async () => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ride.id);

      if (error) throw error;

      setCurrentStatus('in_progress');
      setShowFullScreenMap(false);
      
      // Notificar paciente
      await supabase
        .from('notifications')
        .insert({
          user_id: ride.patient_id,
          title: 'Corrida Iniciada',
          message: 'O motorista chegou e a corrida foi iniciada!',
        });

      toast({
        title: "Corrida Iniciada",
        description: "Agora siga para o destino do paciente.",
      });
    } catch (error) {
      console.error('Error starting ride:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a corrida.",
        variant: "destructive",
      });
    }
  };

  const completeRide = async () => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          status: 'completed',
          actual_price: ride.estimated_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', ride.id);

      if (error) throw error;

      setShowFullScreenMap(false);

      // Notificar paciente
      await supabase
        .from('notifications')
        .insert({
          user_id: ride.patient_id,
          title: 'Corrida Finalizada',
          message: 'Sua corrida foi finalizada com sucesso!',
        });

      toast({
        title: "Corrida Finalizada",
        description: `R$ ${ride.estimated_price} foi adicionado ao seu saldo.`,
      });

      onRideCompleted();
    } catch (error) {
      console.error('Error completing ride:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a corrida.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Indo buscar paciente</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">Corrida em andamento</Badge>;
      default:
        return <Badge>{currentStatus}</Badge>;
    }
  };

  const openNavigationMap = () => {
    setShowFullScreenMap(true);
  };

  const getCurrentDestination = () => {
    if (currentStatus === 'accepted') {
      return {
        coords: pickupCoords,
        type: 'pickup' as const,
        isNear: isNearPickup,
        action: startRide
      };
    } else {
      return {
        coords: destinationCoords,
        type: 'destination' as const,
        isNear: isNearDestination,
        action: completeRide
      };
    }
  };

  const destination = getCurrentDestination();

  return (
    <>
      <div className="space-y-6">
        {/* Informações da Corrida Ativa */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Corrida Ativa</span>
              {getStatusBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dados do Paciente */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">{ride.patient?.full_name}</p>
                <p className="text-sm text-gray-600">{ride.patient?.phone}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Endereços */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Origem</p>
                  <p className="text-sm text-gray-600">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Destino</p>
                  <p className="text-sm text-gray-600">{ride.destination_address}</p>
                </div>
              </div>
            </div>

            {/* Valor */}
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-800">
                💰 R$ {ride.estimated_price}
              </p>
            </div>

            {/* Botão de Navegação */}
            <Button 
              onClick={openNavigationMap}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Map className="w-4 h-4 mr-2" />
              {currentStatus === 'accepted' ? 'Indo buscar paciente' : 'Indo para destino'}
            </Button>

            {/* Avisos de Proximidade */}
            {currentStatus === 'accepted' && isNearPickup && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  🎯 Você está próximo ao local de coleta! Você pode iniciar a corrida.
                </p>
              </div>
            )}

            {currentStatus === 'in_progress' && isNearDestination && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  🎯 Você chegou ao destino! Você pode finalizar a corrida.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapa Pequeno de Referência */}
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral da Rota</CardTitle>
          </CardHeader>
          <CardContent>
            <MapboxMap
              center={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
              markers={[
                ...(driverLocation ? [{
                  id: 'driver',
                  coordinates: [driverLocation.lng, driverLocation.lat] as [number, number],
                  type: 'driver' as const,
                }] : []),
                ...(destination.coords ? [{
                  id: 'destination',
                  coordinates: destination.coords,
                  type: destination.type,
                }] : [])
              ]}
              showRoute={true}
              pickupCoords={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
              destinationCoords={destination.coords}
              className="w-full h-48 rounded-lg"
            />
          </CardContent>
        </Card>
      </div>

      {/* Full Screen Navigation Map */}
      <FullScreenNavigationMap
        isOpen={showFullScreenMap}
        onClose={() => setShowFullScreenMap(false)}
        ride={ride}
        driverLocation={driverLocation}
        destinationCoords={destination.coords}
        destinationType={destination.type}
        isNearDestination={destination.isNear}
        onActionClick={destination.action}
      />
    </>
  );
};

export default ActiveRideManager;
