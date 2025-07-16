
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RidePriceRequest {
  pickup_address: string;
  destination_address: string;
  car_type: 'common' | 'accessibility';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const mapboxToken = Deno.env.get('MAPBOX_API_KEY')
    if (!mapboxToken) {
      throw new Error('Mapbox token not configured')
    }

    const { pickup_address, destination_address, car_type }: RidePriceRequest = await req.json()

    // Geocodificar endereços
    const geocodePickup = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pickup_address)}.json?access_token=${mapboxToken}&country=BR&limit=1`
    )
    const pickupData = await geocodePickup.json()

    const geocodeDestination = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination_address)}.json?access_token=${mapboxToken}&country=BR&limit=1`
    )
    const destinationData = await geocodeDestination.json()

    if (!pickupData.features?.length || !destinationData.features?.length) {
      throw new Error('Não foi possível encontrar os endereços fornecidos')
    }

    const pickupCoords = pickupData.features[0].center
    const destinationCoords = destinationData.features[0].center

    // Calcular rota usando Mapbox Directions API
    const directionsResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?access_token=${mapboxToken}&geometries=geojson`
    )
    const directionsData = await directionsResponse.json()

    if (!directionsData.routes?.length) {
      throw new Error('Não foi possível calcular a rota')
    }

    const route = directionsData.routes[0]
    const distanceKm = route.distance / 1000 // converter metros para km
    const durationMinutes = Math.round(route.duration / 60) // converter segundos para minutos

    // Buscar preço por km do tipo de carro
    const { data: pricing, error: pricingError } = await supabaseClient
      .from('km_pricing')
      .select('price_per_km')
      .eq('car_type', car_type)
      .single()

    if (pricingError) {
      throw new Error('Erro ao buscar preço por km: ' + pricingError.message)
    }

    const totalPrice = distanceKm * pricing.price_per_km

    return new Response(
      JSON.stringify({
        distance_km: Number(distanceKm.toFixed(2)),
        duration_minutes: durationMinutes,
        price_per_km: pricing.price_per_km,
        total_price: Number(totalPrice.toFixed(2)),
        pickup_coordinates: pickupCoords,
        destination_coordinates: destinationCoords,
        route_geometry: route.geometry
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error calculating ride price:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
