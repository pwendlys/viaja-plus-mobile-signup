
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  user_id: string;
  user_type: 'driver' | 'patient';
}

interface UseRealTimeLocationProps {
  userId?: string;
  rideId?: string;
  trackLocation?: boolean;
}

export const useRealTimeLocation = ({ 
  userId, 
  rideId, 
  trackLocation = false 
}: UseRealTimeLocationProps) => {
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [otherUserLocation, setOtherUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    setIsTracking(true);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        
        // Send location to other users in the ride
        if (userId && rideId) {
          updateLocationInDatabase(newLocation);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  };

  // Update location in database
  const updateLocationInDatabase = async (location: {lat: number; lng: number}) => {
    if (!userId || !rideId) return;

    try {
      const { error } = await supabase
        .from('ride_locations')
        .upsert({
          ride_id: rideId,
          user_id: userId,
          latitude: location.lat,
          longitude: location.lng,
          user_type: 'driver', // Default to driver, can be made dynamic
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Set up real-time location updates
  useEffect(() => {
    if (!rideId) return;

    channelRef.current = supabase
      .channel(`ride-location-${rideId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ride_locations',
        filter: `ride_id=eq.${rideId}`
      }, (payload) => {
        const locationData = payload.new as any;
        
        // Update other user's location (not our own)
        if (locationData.user_id !== userId) {
          setOtherUserLocation({
            lat: locationData.latitude,
            lng: locationData.longitude
          });
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [rideId, userId]);

  // Auto-start tracking if requested
  useEffect(() => {
    if (trackLocation && !isTracking) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [trackLocation]);

  return {
    currentLocation,
    otherUserLocation,
    isTracking,
    startTracking,
    stopTracking
  };
};
