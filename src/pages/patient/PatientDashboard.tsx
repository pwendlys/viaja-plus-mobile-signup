
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Calendar, Star, Settings, Heart, Phone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PatientFavorites from "@/components/patient/PatientFavorites";
import PatientSettings from "@/components/patient/PatientSettings";
import RideRequestWithMap from "@/components/patient/RideRequestWithMap";
import RideHistory from "@/components/patient/RideHistory";
import EmergencyContacts from "@/components/patient/EmergencyContacts";
import RideCancellationDialog from "@/components/patient/RideCancellationDialog";

const PatientDashboard = () => {
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [selectedRideForCancellation, setSelectedRideForCancellation] = useState<any>(null);

  useEffect(() => {
    fetchPatientData();
    fetchActiveRides();
    getCurrentLocation();

    // Escutar atualizações em tempo real das corridas
    const subscription = supabase
      .channel('patient-rides-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, (payload) => {
        console.log('Ride update received:', payload);
        fetchActiveRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchPatientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setPatientProfile(profile);
    } catch (error) {
      console.error('Erro ao buscar dados do paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRides = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id(full_name, phone)
        `)
        .eq('patient_id', user.id)
        .in('status', ['pending', 'accepted', 'in_progress', 'scheduled'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched active rides:', rides);
      setActiveRides(rides || []);
    } catch (error) {
      console.error('Erro ao buscar corridas ativas:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não suportada pelo navegador.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast({
          title: "Sucesso",
          description: "Localização atual obtida com sucesso!",
        });
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast({
          title: "Erro",
          description: "Não foi possível obter sua localização.",
          variant: "destructive",
        });
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Aceita</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">Em Andamento</Badge>;
      case 'scheduled':
        return <Badge className="bg-purple-100 text-purple-800">Agendada</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Concluída</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCancelRide = (ride: any) => {
    setSelectedRideForCancellation(ride);
  };

  const handleRideCancelled = () => {
    // Atualizar a lista de corridas ativas imediatamente
    fetchActiveRides();
    setSelectedRideForCancellation(null);
    toast({
      title: "Corrida Cancelada",
      description: "Sua corrida foi cancelada e movida para o histórico.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando painel do paciente...</div>
      </div>
    );
  }

  if (patientProfile?.status !== 'approved') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro Pendente de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Seu cadastro ainda está sendo analisado pelos administradores. 
              Você receberá uma notificação quando for aprovado.
            </p>
            <Badge className="bg-yellow-100 text-yellow-800">
              Status: {patientProfile?.status === 'pending' ? 'Pendente' : 'Rejeitado'}
            </Badge>
            {patientProfile?.rejection_reason && (
              <p className="mt-2 text-red-600">
                Motivo da rejeição: {patientProfile.rejection_reason}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {patientProfile?.full_name?.split(' ')[0]}!
        </h1>
        <Badge className="bg-green-100 text-green-800">Conta Aprovada</Badge>
      </div>

      {/* Corridas Ativas */}
      {activeRides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Corridas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRides.map((ride) => (
                <div key={ride.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{ride.pickup_address}</p>
                    <p className="text-sm text-gray-600">→ {ride.destination_address}</p>
                    {ride.driver && (
                      <p className="text-sm text-blue-600">Motorista: {ride.driver.full_name}</p>
                    )}
                    {ride.scheduled_for && (
                      <p className="text-sm text-purple-600">
                        Agendada para: {new Date(ride.scheduled_for).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ride.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelRide(ride)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Principais */}
      <Tabs defaultValue="ride" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ride">Solicitar Corrida</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="emergency">Emergência</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="ride">
          <RideRequestWithMap 
            currentLocation={currentLocation}
            onRideCreated={fetchActiveRides}
          />
        </TabsContent>

        <TabsContent value="favorites">
          <PatientFavorites />
        </TabsContent>

        <TabsContent value="history">
          <RideHistory />
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyContacts />
        </TabsContent>

        <TabsContent value="settings">
          <PatientSettings 
            profile={patientProfile}
            onProfileUpdate={fetchPatientData}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de Cancelamento */}
      {selectedRideForCancellation && (
        <RideCancellationDialog
          isOpen={!!selectedRideForCancellation}
          onClose={() => setSelectedRideForCancellation(null)}
          ride={selectedRideForCancellation}
          onRideCancelled={handleRideCancelled}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
