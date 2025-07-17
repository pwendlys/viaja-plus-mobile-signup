
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, DollarSign, Navigation, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RideRequestCardProps {
  ride: {
    id: string;
    patient_id: string;
    pickup_address: string;
    destination_address: string;
    pickup_date: string;
    pickup_time: string;
    estimated_price?: number;
    scheduled_for?: string;
    patient?: {
      full_name: string;
      phone: string;
    };
  };
  onAccept: (rideId: string) => void;
  isOnline: boolean;
  driverType?: 'common' | 'accessibility';
}

const RideRequestCard: React.FC<RideRequestCardProps> = ({
  ride,
  onAccept,
  isOnline,
  driverType = 'common'
}) => {
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const isScheduled = !!ride.scheduled_for;
  const scheduledDate = ride.scheduled_for ? new Date(ride.scheduled_for) : null;

  useEffect(() => {
    calculateRealPrice();
  }, [ride.id, driverType]);

  const calculateRealPrice = async () => {
    try {
      setLoading(true);
      console.log('Calculating price for ride:', ride.id);
      
      const { data, error } = await supabase.functions.invoke('calculate-ride-price', {
        body: {
          pickup_address: ride.pickup_address,
          destination_address: ride.destination_address,
          car_type: driverType
        }
      });

      if (error) {
        console.error('Error calculating price:', error);
        return;
      }

      console.log('Price calculation result:', data);
      setCalculatedPrice(data.total_price);
      setDistance(data.distance_km);
      setDuration(data.duration_minutes);

      // Update the ride with calculated price if not set
      if (!ride.estimated_price) {
        await supabase
          .from('rides')
          .update({ estimated_price: data.total_price })
          .eq('id', ride.id);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    await onAccept(ride.id);
    setLoading(false);
  };

  const formatTime = (date: string, time: string) => {
    const rideDate = new Date(date);
    const [hours, minutes] = time.split(':');
    rideDate.setHours(parseInt(hours), parseInt(minutes));
    
    const now = new Date();
    const isToday = rideDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Hoje às ${time}`;
    } else {
      return `${rideDate.toLocaleDateString('pt-BR')} às ${time}`;
    }
  };

  const formatScheduledTime = (scheduledFor: string) => {
    const date = new Date(scheduledFor);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const displayPrice = calculatedPrice || ride.estimated_price || 0;

  return (
    <Card className={`${!isOnline ? 'opacity-50' : 'hover:shadow-md transition-shadow'} ${isScheduled ? 'border-purple-200 bg-purple-50' : 'border-green-200 bg-green-50'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Patient Info and Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{ride.patient?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              {isScheduled ? (
                <Badge variant="outline" className="bg-purple-100 text-purple-700">
                  <Calendar className="w-3 h-3 mr-1" />
                  Agendada
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 bg-green-100">
                  <Clock className="w-3 h-3 mr-1" />
                  Imediata
                </Badge>
              )}
            </div>
          </div>

          {/* Route Info */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Origem</p>
                <p className="font-medium text-sm">{ride.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Destino</p>
                <p className="font-medium text-sm">{ride.destination_address}</p>
              </div>
            </div>
          </div>

          {/* Distance and Duration Info */}
          {(distance || duration) && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              {distance && <span>📏 {distance} km</span>}
              {duration && <span>⏱️ {duration} min</span>}
            </div>
          )}

          {/* Time Info */}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {isScheduled && scheduledDate
                ? `Agendada para: ${formatScheduledTime(ride.scheduled_for!)}`
                : `Solicitada para: ${formatTime(ride.pickup_date, ride.pickup_time)}`
              }
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-600">
                R$ {displayPrice.toFixed(2)}
                {loading && <span className="text-xs ml-1">(calculando...)</span>}
              </span>
            </div>
            
            {/* Time until scheduled ride */}
            {isScheduled && scheduledDate && (
              <span className="text-xs text-purple-600">
                {scheduledDate > new Date() 
                  ? `Em ${Math.ceil((scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))}h`
                  : 'Disponível agora'
                }
              </span>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleAccept}
              disabled={!isOnline || loading}
              className={`w-full ${isScheduled 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-green-600 hover:bg-green-700'
              } disabled:bg-gray-400`}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {loading 
                ? 'Aceitando...' 
                : isOnline 
                  ? `Aceitar ${isScheduled ? 'Agendamento' : 'Corrida'}` 
                  : 'Offline'
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideRequestCard;
