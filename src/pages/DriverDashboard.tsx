
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Car, DollarSign, User, Star, Bell, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DriverRideRequests from "@/components/driver/DriverRideRequests";
import DriverFinancial from "@/components/driver/DriverFinancial";
import DriverSettings from "@/components/driver/DriverSettings";
import DriverRatings from "@/components/driver/DriverRatings";
import DriverNotifications from "@/components/driver/DriverNotifications";

const DriverDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rides");
  const [driverData, setDriverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchDriverData();
    getCurrentLocation();
  }, []);

  const fetchDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          drivers(*)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setDriverData(profile);
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do motorista.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const shareLocationWhatsApp = () => {
    if (!location) {
      toast({
        title: "Localização não disponível",
        description: "Não foi possível obter sua localização atual.",
        variant: "destructive",
      });
      return;
    }

    const message = `Olá! Estou aqui: https://maps.google.com/?q=${location.lat},${location.lng}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    );
  }

  if (!driverData || driverData.status !== 'approved') {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Aguardando Aprovação</h2>
            <p className="text-gray-600 mb-4">
              Seu cadastro está sendo analisado pelo administrador. 
              Você será notificado quando for aprovado.
            </p>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
              Status: {driverData?.status === 'pending' ? 'Pendente' : 'Não Aprovado'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Motorista</h1>
          <p className="text-gray-600">Bem-vindo, {driverData.full_name}</p>
        </div>
        <Button onClick={shareLocationWhatsApp} className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Compartilhar Localização
        </Button>
      </div>

      {/* Informações do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Informações do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Veículo</p>
              <p className="font-medium">
                {driverData.drivers?.[0]?.vehicle_make} {driverData.drivers?.[0]?.vehicle_model} ({driverData.drivers?.[0]?.vehicle_year})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Placa</p>
              <p className="font-medium">{driverData.drivers?.[0]?.vehicle_plate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <Badge variant={driverData.drivers?.[0]?.has_accessibility ? "default" : "secondary"}>
                {driverData.drivers?.[0]?.has_accessibility ? "Acessível" : "Comum"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área do Mapa (Reservada) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa (Em Desenvolvimento)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Integração com Mapbox será implementada</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rides" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            Corridas
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="ratings" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rides" className="mt-6">
          <DriverRideRequests driverData={driverData} />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <DriverFinancial driverId={driverData.id} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <DriverSettings driverData={driverData} onUpdate={fetchDriverData} />
        </TabsContent>

        <TabsContent value="ratings" className="mt-6">
          <DriverRatings driverId={driverData.id} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <DriverNotifications driverId={driverData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverDashboard;
