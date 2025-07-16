
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, Calendar as CalendarIcon, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MapboxMap from '@/components/MapboxMap';

interface RideRequestWithMapProps {
  currentLocation: { lat: number; lng: number } | null;
  onRideCreated: () => void;
}

interface AddressSuggestion {
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

const RideRequestWithMap: React.FC<RideRequestWithMapProps> = ({
  currentLocation,
  onRideCreated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCurrentAddress, setLoadingCurrentAddress] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [currentCity, setCurrentCity] = useState<string>('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [rideData, setRideData] = useState({
    pickup_address: "",
    destination_address: "",
    pickup_time: "",
    notes: "",
  });

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (rideData.pickup_address && rideData.destination_address) {
      geocodeAddresses();
    }
  }, [rideData.pickup_address, rideData.destination_address]);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites, error } = await supabase
        .from('patient_favorites')
        .select('*')
        .eq('patient_id', user.id);

      if (error) throw error;
      setFavorites(favorites || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
    }
  };

  const getMapboxToken = async () => {
    try {
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      return tokenData?.token;
    } catch (error) {
      console.error('Error getting mapbox token:', error);
      return null;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const token = await getMapboxToken();
      if (!token) return null;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=BR&language=pt&types=address`
      );
      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const feature = data.features[0];
        
        // Extrair componentes do endereço
        const context = feature.context || [];
        const neighborhood = context.find((c: any) => c.id.includes('neighborhood'))?.text || '';
        const place = context.find((c: any) => c.id.includes('place'))?.text || '';
        const region = context.find((c: any) => c.id.includes('region'))?.text || '';
        
        // Montar endereço completo
        const addressParts = [];
        if (feature.address) addressParts.push(feature.text + ', ' + feature.address);
        else addressParts.push(feature.text);
        if (neighborhood) addressParts.push(neighborhood);
        if (place) addressParts.push(place);
        if (region) addressParts.push(region);
        
        const fullAddress = addressParts.join(', ');
        
        // Guardar a cidade atual para filtrar destinos
        if (place) {
          setCurrentCity(place);
        }
        
        return fullAddress;
      }
      return null;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  };

  const searchDestinations = async (query: string) => {
    if (query.length < 3) {
      setDestinationSuggestions([]);
      return;
    }

    try {
      const token = await getMapboxToken();
      if (!token) return;

      // Construir query de busca focando na cidade atual
      let searchQuery = query;
      if (currentCity) {
        searchQuery = `${query} ${currentCity}`;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&country=BR&language=pt&limit=5&types=poi,address&proximity=${currentLocation?.lng},${currentLocation?.lat}`
      );
      const data = await response.json();
      
      if (data.features) {
        // Filtrar sugestões que estejam na mesma cidade
        const filteredSuggestions = data.features.filter((feature: any) => {
          if (!currentCity) return true;
          
          const context = feature.context || [];
          const place = context.find((c: any) => c.id.includes('place'))?.text || '';
          return place.toLowerCase().includes(currentCity.toLowerCase()) || 
                 currentCity.toLowerCase().includes(place.toLowerCase());
        });

        setDestinationSuggestions(filteredSuggestions.slice(0, 5));
      }
    } catch (error) {
      console.error('Error searching destinations:', error);
    }
  };

  const geocodeAddresses = async () => {
    try {
      const token = await getMapboxToken();
      if (!token) return;

      // Geocode pickup address
      if (rideData.pickup_address && !rideData.pickup_address.includes('Localização Atual')) {
        const pickupResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rideData.pickup_address)}.json?access_token=${token}&country=BR`
        );
        const pickupData = await pickupResponse.json();
        if (pickupData.features && pickupData.features[0]) {
          setPickupCoords(pickupData.features[0].center);
        }
      } else if (currentLocation) {
        setPickupCoords([currentLocation.lng, currentLocation.lat]);
      }

      // Geocode destination address
      if (rideData.destination_address) {
        const destResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rideData.destination_address)}.json?access_token=${token}&country=BR`
        );
        const destData = await destResponse.json();
        if (destData.features && destData.features[0]) {
          setDestinationCoords(destData.features[0].center);
        }
      }
    } catch (error) {
      console.error('Error geocoding addresses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideData.pickup_address || !rideData.destination_address) {
      toast({
        title: "Erro",
        description: "Preencha o endereço de origem e destino.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let scheduledFor = null;
      if (isScheduled && selectedDate && rideData.pickup_time) {
        const [hours, minutes] = rideData.pickup_time.split(':');
        scheduledFor = new Date(selectedDate);
        scheduledFor.setHours(parseInt(hours), parseInt(minutes));
      }

      const ridePayload = {
        patient_id: user.id,
        pickup_address: rideData.pickup_address,
        destination_address: rideData.destination_address,
        pickup_date: isScheduled && selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        pickup_time: rideData.pickup_time || '00:00',
        scheduled_for: scheduledFor?.toISOString(),
        status: isScheduled ? 'scheduled' : 'pending',
      };

      const { error } = await supabase
        .from('rides')
        .insert(ridePayload);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: isScheduled 
          ? "Corrida agendada com sucesso! Os motoristas serão notificados."
          : "Corrida solicitada com sucesso! Os motoristas serão notificados.",
      });

      // Reset form
      setRideData({
        pickup_address: "",
        destination_address: "",
        pickup_time: "",
        notes: "",
      });
      setSelectedDate(undefined);
      setIsScheduled(false);
      setPickupCoords(null);
      setDestinationCoords(null);
      setCurrentCity('');
      setDestinationSuggestions([]);
      onRideCreated();

    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar a corrida.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const useFavoriteAddress = (address: string, field: 'pickup_address' | 'destination_address') => {
    setRideData(prev => ({ ...prev, [field]: address }));
    if (field === 'destination_address') {
      setShowDestinationSuggestions(false);
    }
  };

  const useCurrentLocation = async () => {
    if (!currentLocation) {
      toast({
        title: "Erro",
        description: "Localização atual não disponível.",
        variant: "destructive",
      });
      return;
    }

    setLoadingCurrentAddress(true);
    
    try {
      const fullAddress = await reverseGeocode(currentLocation.lat, currentLocation.lng);
      
      if (fullAddress) {
        setRideData(prev => ({ 
          ...prev, 
          pickup_address: fullAddress
        }));
        toast({
          title: "Sucesso",
          description: "Endereço atual carregado com sucesso!",
        });
      } else {
        // Fallback para coordenadas se não conseguir obter endereço completo
        setRideData(prev => ({ 
          ...prev, 
          pickup_address: `Localização Atual (${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)})` 
        }));
      }
    } catch (error) {
      console.error('Error getting current address:', error);
      toast({
        title: "Erro",
        description: "Não foi possível obter o endereço atual.",
        variant: "destructive",
      });
    } finally {
      setLoadingCurrentAddress(false);
    }
  };

  const handleDestinationChange = (value: string) => {
    setRideData(prev => ({ ...prev, destination_address: value }));
    setShowDestinationSuggestions(true);
    searchDestinations(value);
  };

  const selectDestinationSuggestion = (suggestion: AddressSuggestion) => {
    setRideData(prev => ({ ...prev, destination_address: suggestion.place_name }));
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
  };

  // Prepare map markers
  const mapMarkers = [];
  if (pickupCoords) {
    mapMarkers.push({
      id: 'pickup',
      coordinates: pickupCoords,
      type: 'pickup' as const,
    });
  }
  if (destinationCoords) {
    mapMarkers.push({
      id: 'destination',
      coordinates: destinationCoords,
      type: 'destination' as const,
    });
  }

  return (
    <div className="space-y-6">
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Visualizar Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapboxMap
            center={currentLocation ? [currentLocation.lng, currentLocation.lat] : undefined}
            markers={mapMarkers}
            showRoute={pickupCoords && destinationCoords ? true : false}
            pickupCoords={pickupCoords || undefined}
            destinationCoords={destinationCoords || undefined}
            className="w-full h-64 rounded-lg"
          />
        </CardContent>
      </Card>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Solicitar Corrida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pickup_address">Endereço de Origem</Label>
              <div className="flex gap-2">
                <Input
                  id="pickup_address"
                  value={rideData.pickup_address}
                  onChange={(e) => setRideData({ ...rideData, pickup_address: e.target.value })}
                  placeholder="Digite o endereço de origem"
                  required
                />
                {currentLocation && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={useCurrentLocation}
                    disabled={loadingCurrentAddress}
                  >
                    {loadingCurrentAddress ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Usar Atual"
                    )}
                  </Button>
                )}
              </div>
              {favorites.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm text-gray-600">Favoritos:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {favorites.map((fav) => (
                      <Button
                        key={fav.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => useFavoriteAddress(fav.address, 'pickup_address')}
                        className="text-xs"
                      >
                        {fav.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="destination_address">Endereço de Destino</Label>
              <Input
                id="destination_address"
                value={rideData.destination_address}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => setShowDestinationSuggestions(true)}
                placeholder="Digite o endereço de destino"
                required
              />
              
              {/* Sugestões de destino */}
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => selectDestinationSuggestion(suggestion)}
                    >
                      <div className="font-medium">{suggestion.place_name}</div>
                    </button>
                  ))}
                </div>
              )}

              {favorites.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm text-gray-600">Favoritos:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {favorites.map((fav) => (
                      <Button
                        key={fav.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => useFavoriteAddress(fav.address, 'destination_address')}
                        className="text-xs"
                      >
                        {fav.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info sobre o serviço gratuito */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Serviço Gratuito</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Este é um serviço de transporte gratuito para pacientes do SUS.
                {currentCity && ` Buscando destinos em ${currentCity} e região.`}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="schedule"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <Label htmlFor="schedule">Agendar corrida para depois</Label>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="pickup_time">Horário</Label>
                  <Input
                    id="pickup_time"
                    type="time"
                    value={rideData.pickup_time}
                    onChange={(e) => setRideData({ ...rideData, pickup_time: e.target.value })}
                    required={isScheduled}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              <Car className="h-4 w-4 mr-2" />
              {loading ? "Processando..." : isScheduled ? "Agendar Corrida" : "Solicitar Corrida Agora"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideRequestWithMap;
