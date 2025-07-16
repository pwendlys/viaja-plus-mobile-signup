
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Car, DollarSign, User, Star, Bell, Power, PowerOff } from "lucide-react";
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
  const [isOnline, setIsOnline] = useState(false);
  const [kmPricing, setKmPricing] = useState<any[]>([]);

  useEffect(() => {
    fetchDriverData();
    fetchKmPricing();
  }, []);

  const fetchKmPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('km_pricing')
        .select('*');

      if (error) throw error;
      setKmPricing(data || []);
    } catch (error) {
      console.error('Error fetching KM pricing:', error);
    }
  };

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
      
      // Verificar se há um status online salvo
      const savedStatus = localStorage.getItem(`driver_online_${user.id}`);
      setIsOnline(savedStatus === 'true');
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

  const toggleOnlineStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !isOnline;
      setIsOnline(newStatus);
      
      // Salvar status no localStorage
      localStorage.setItem(`driver_online_${user.id}`, newStatus.toString());
      
      // Atualizar status no banco de dados se necessário
      await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      toast({
        title: newStatus ? "Você está ONLINE" : "Você está OFFLINE",
        description: newStatus 
          ? "Você receberá notificações de corridas disponíveis." 
          : "Você não receberá notificações de corridas.",
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu status.",
        variant: "destructive",
      });
    }
  };

  const getCurrentPrice = () => {
    if (!driverData?.drivers?.[0]) return null;
    
    const driver = driverData.drivers[0];
    const carType = driver.has_accessibility ? 'accessibility' : 'common';
    const pricing = kmPricing.find(p => p.car_type === carType);
    
    return pricing?.price_per_km || null;
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
        <Button 
          onClick={toggleOnlineStatus}
          className={`flex items-center gap-2 ${
            isOnline 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {isOnline ? (
            <>
              <Power className="w-4 h-4" />
              ONLINE
            </>
          ) : (
            <>
              <PowerOff className="w-4 h-4" />
              OFFLINE
            </>
          )}
        </Button>
      </div>

      {/* Status Online/Offline */}
      <Card className={isOnline ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="font-medium">
                Status: {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {isOnline 
                ? 'Você receberá notificações de corridas disponíveis' 
                : 'Você não receberá notificações de corridas'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Dados do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {driverData.drivers && driverData.drivers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Marca</p>
                <p className="font-medium">{driverData.drivers[0].vehicle_make}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Modelo</p>
                <p className="font-medium">{driverData.drivers[0].vehicle_model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ano</p>
                <p className="font-medium">{driverData.drivers[0].vehicle_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Placa</p>
                <p className="font-medium">{driverData.drivers[0].vehicle_plate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cor</p>
                <p className="font-medium">{driverData.drivers[0].vehicle_color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Preço Por KM</p>
                <p className="font-medium">
                  {getCurrentPrice() ? `R$ ${getCurrentPrice().toFixed(2)}` : 'Não definido'}
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    driverData.drivers[0].has_accessibility ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <span className="font-medium">
                    {driverData.drivers[0].has_accessibility ? 'Veículo Acessível' : 'Veículo Comum'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhuma informação de veículo encontrada.</p>
              <p className="text-sm text-gray-400">Complete seu cadastro na aba "Perfil".</p>
            </div>
          )}
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
        <TabsList className="grid w-full grid-cols-5">
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
          <DriverRideRequests driverData={driverData} isOnline={isOnline} />
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
