
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Navigation, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FullScreenNavigationMapProps {
  isOpen: boolean;
  onClose: () => void;
  ride: any;
  driverLocation: { lat: number; lng: number } | null;
  destinationCoords: [number, number] | null;
  destinationType: 'pickup' | 'destination';
  isNearDestination: boolean;
  onActionClick: () => void;
}

const FullScreenNavigationMap: React.FC<FullScreenNavigationMapProps> = ({
  isOpen,
  onClose,
  ride,
  driverLocation,
  destinationCoords,
  destinationType,
  isNearDestination,
  onActionClick
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (isOpen) {
      getMapboxToken();
    }
  }, [isOpen]);

  const getMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      setMapboxToken(data.token);
    } catch (error) {
      console.error('Error getting Mapbox token:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || !mapContainer.current || !mapboxToken || !driverLocation || !destinationCoords) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [driverLocation.lng, driverLocation.lat],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add current location control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Add markers
    addMarkers();
    
    // Add route
    getRoute();

    return () => {
      if (map.current) {
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, mapboxToken, driverLocation, destinationCoords]);

  const addMarkers = () => {
    if (!map.current || !driverLocation || !destinationCoords) return;

    // Driver marker
    const driverEl = document.createElement('div');
    driverEl.innerHTML = `
      <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg animate-pulse">
        🚗
      </div>
    `;
    
    const driverMarker = new mapboxgl.Marker(driverEl)
      .setLngLat([driverLocation.lng, driverLocation.lat])
      .addTo(map.current);
    
    markersRef.current['driver'] = driverMarker;

    // Destination marker
    const destEl = document.createElement('div');
    const isPickup = destinationType === 'pickup';
    destEl.innerHTML = `
      <div class="w-10 h-10 ${isPickup ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg">
        ${isPickup ? '📍' : '🏁'}
      </div>
    `;
    
    const destMarker = new mapboxgl.Marker(destEl)
      .setLngLat(destinationCoords)
      .addTo(map.current);
    
    markersRef.current['destination'] = destMarker;
  };

  const getRoute = async () => {
    if (!map.current || !driverLocation || !destinationCoords || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.lng},${driverLocation.lat};${destinationCoords[0]},${destinationCoords[1]}?steps=true&geometries=geojson&access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0].geometry;
        
        // Add route to map
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: route
          });
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });
        }

        // Fit map to route
        const coordinates = route.coordinates;
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
        map.current.fitBounds(bounds, { padding: 80 });
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-semibold">
                {destinationType === 'pickup' ? 'Indo buscar paciente' : 'Levando ao destino'}
              </h2>
              <p className="text-sm text-gray-600">
                {destinationType === 'pickup' ? ride.pickup_address : ride.destination_address}
              </p>
            </div>
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
      </div>

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Bottom Action Card */}
      <div className="fixed bottom-0 left-0 right-0 z-10 p-4">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{ride.patient?.full_name}</p>
                <p className="text-sm text-gray-600">{ride.patient?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">R$ {ride.estimated_price}</p>
              </div>
            </div>

            {/* Distance Info */}
            {!isNearDestination && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Continue seguindo a rota até o {destinationType === 'pickup' ? 'local de coleta' : 'destino'}
                  </p>
                </div>
              </div>
            )}

            {/* Proximity Alert */}
            {isNearDestination && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    🎯 Você chegou! Agora você pode {destinationType === 'pickup' ? 'iniciar a corrida' : 'finalizar a corrida'}.
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button 
              onClick={onActionClick}
              disabled={!isNearDestination}
              className="w-full h-12 text-lg font-semibold"
              variant={isNearDestination ? "default" : "secondary"}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {destinationType === 'pickup' 
                ? (isNearDestination ? 'Cheguei ao local - Iniciar Corrida' : 'Chegue ao local para iniciar')
                : (isNearDestination ? 'Cheguei ao destino - Finalizar Corrida' : 'Chegue ao destino para finalizar')
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FullScreenNavigationMap;
