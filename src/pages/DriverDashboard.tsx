
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, DollarSign, User, Star, Bell, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DriverRideRequestsWithMap from "@/components/driver/DriverRideRequestsWithMap";
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
    
    // Set up real-time subscription for driver data updates
    const subscription = supabase
      .channel('driver-dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('Profile changed, refreshing driver data...', payload);
        fetchDriverData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drivers'
      }, (payload) => {
        console.log('Driver data changed, refreshing driver data...', payload);
        fetchDriverData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
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

      // Modified query to properly join driver data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          drivers(
            cnh_number,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate,
            vehicle_color,
            has_accessibility,
            cnh_front_photo,
            cnh_back_photo,
            vehicle_document,
            vehicle_photo,
            selfie_with_document
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      console.log('Driver data fetched:', profile);
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
    // Handle both array and object cases for drivers data
    let driverInfo = null;
    if (driverData?.drivers) {
      if (Array.isArray(driverData.drivers)) {
        driverInfo = driverData.drivers[0];
      } else {
        driverInfo = driverData.drivers;
      }
    }
    
    if (!driverInfo) return null;
    
    const carType = driverInfo.has_accessibility ? 'accessibility' : 'common';
    const pricing = kmPricing.find(p => p.car_type === carType);
    
    return pricing?.price_per_km || null;
  };

  // Check if driver has complete vehicle information to receive rides
  const hasCompleteVehicleInfo = () => {
    // Handle both array and object cases for drivers data
    let driverInfo = null;
    if (driverData?.drivers) {
      if (Array.isArray(driverData.drivers)) {
        driverInfo = driverData.drivers[0];
      } else {
        driverInfo = driverData.drivers;
      }
    }
    
    if (!driverInfo) {
      console.log('No driver info found');
      return false;
    }
    
    const isComplete = !!(driverInfo.cnh_number && 
           driverInfo.vehicle_make && 
           driverInfo.vehicle_model && 
           driverInfo.vehicle_year && 
           driverInfo.vehicle_plate && 
           driverInfo.vehicle_color);
    
    console.log('Vehicle info completeness check:', {
      driverInfo,
      isComplete
    });
    
    return isComplete;
  };

  // Helper function to get driver info safely
  const getDriverInfo = () => {
    if (!driverData?.drivers) return null;
    return Array.isArray(driverData.drivers) ? driverData.drivers[0] : driverData.drivers;
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

  const driverInfo = getDriverInfo();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Motorista</h1>
          <p className="text-gray-600">Bem-vindo, {driverData.full_name}</p>
        </div>
        <Button 
          onClick={toggleOnlineStatus}
          disabled={!hasCompleteVehicleInfo()}
          className={`flex items-center gap-2 ${
            isOnline 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          } ${!hasCompleteVehicleInfo() ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Aviso se não tem dados completos do veículo */}
      {!hasCompleteVehicleInfo() && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Car className="w-5 h-5" />
              <p className="font-medium">Complete seu perfil para receber corridas</p>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Preencha todas as informações do veículo na aba "Perfil" para começar a receber corridas.
            </p>
          </CardContent>
        </Card>
      )}

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
                : hasCompleteVehicleInfo() 
                  ? 'Você não receberá notificações de corridas'
                  : 'Complete seu perfil para ficar online'
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
          {driverInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Marca</p>
                <p className="font-medium">{driverInfo.vehicle_make || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Modelo</p>
                <p className="font-medium">{driverInfo.vehicle_model || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ano</p>
                <p className="font-medium">{driverInfo.vehicle_year || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Placa</p>
                <p className="font-medium">{driverInfo.vehicle_plate || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cor</p>
                <p className="font-medium">{driverInfo.vehicle_color || 'Não informado'}</p>
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
                    driverInfo.has_accessibility ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <span className="font-medium">
                    {driverInfo.has_accessibility ? 'Veículo Acessível' : 'Veículo Comum'}
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
          <DriverRideRequestsWithMap driverData={driverData} isOnline={isOnline && hasCompleteVehicleInfo()} />
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
