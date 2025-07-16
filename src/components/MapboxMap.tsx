
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface MapboxMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    type: 'driver' | 'patient' | 'pickup' | 'destination';
    data?: any;
  }>;
  onLocationUpdate?: (location: [number, number]) => void;
  showRoute?: boolean;
  pickupCoords?: [number, number];
  destinationCoords?: [number, number];
  className?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  center = [-46.6333, -23.5505], // São Paulo default
  zoom = 13,
  markers = [],
  onLocationUpdate,
  showRoute = false,
  pickupCoords,
  destinationCoords,
  className = "w-full h-64"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    getMapboxToken();
  }, []);

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
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom,
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

    // Listen for location updates
    if (onLocationUpdate) {
      map.current.on('geolocate', (e: any) => {
        onLocationUpdate([e.coords.longitude, e.coords.latitude]);
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, center, zoom]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      
      // Style based on marker type
      switch (marker.type) {
        case 'driver':
          el.innerHTML = `
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
              🚗
            </div>
          `;
          break;
        case 'patient':
          el.innerHTML = `
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
              👤
            </div>
          `;
          break;
        case 'pickup':
          el.innerHTML = `
            <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
              📍
            </div>
          `;
          break;
        case 'destination':
          el.innerHTML = `
            <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
              🏁
            </div>
          `;
          break;
      }

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .addTo(map.current!);

      markersRef.current[marker.id] = mapboxMarker;
    });
  }, [markers]);

  // Show route
  useEffect(() => {
    if (!map.current || !showRoute || !pickupCoords || !destinationCoords) return;

    const getRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?steps=true&geometries=geojson&access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0].geometry;
          
          // Add route to map
          if (map.current!.getSource('route')) {
            (map.current!.getSource('route') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: route
            });
          } else {
            map.current!.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route
              }
            });

            map.current!.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 5,
                'line-opacity': 0.75
              }
            });
          }

          // Fit map to route
          const coordinates = route.coordinates;
          const bounds = new mapboxgl.LngLatBounds();
          coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
          map.current!.fitBounds(bounds, { padding: 50 });
        }
      } catch (error) {
        console.error('Error getting route:', error);
      }
    };

    getRoute();
  }, [showRoute, pickupCoords, destinationCoords, mapboxToken]);

  return <div ref={mapContainer} className={className} />;
};

export default MapboxMap;
