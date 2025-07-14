
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Phone, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverRideRequestsProps {
  driverData: any;
}

const DriverRideRequests = ({ driverData }: DriverRideRequestsProps) => {
  const { toast } = useToast();
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();

    // Configurar realtime para corridas
    const channel = supabase
      .channel('driver-rides-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, () => {
        fetchRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRides = async () => {
    try {
      // Buscar corridas disponíveis (sem motorista atribuído)
      const { data: available, error: availableError } = await supabase
        .from('rides')
        .select(`
          *,
          patient:patient_id(full_name, phone)
        `)
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (availableError) throw availableError;

      // Buscar corridas ativas do motorista
      const { data: active, error: activeError } = await supabase
        .from('rides')
        .select(`
          *,
          patient:patient_id(full_name, phone)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      setAvailableRides(available || []);
      setActiveRides(active || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast({
        title: "Erro ao carregar corridas",
        description: "Não foi possível carregar as corridas disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_id: driverData.id,
          status: 'accepted'
        })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Corrida Aceita",
        description: "Você aceitou a corrida com sucesso!",
      });

      fetchRides();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a corrida.",
        variant: "destructive",
      });
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Status Atualizado",
        description: `Status da corrida atualizado para: ${status}`,
      });

      fetchRides();
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da corrida.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Aceita</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">Em Andamento</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Concluída</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Carregando corridas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Corridas Ativas */}
      {activeRides.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Suas Corridas Ativas</h2>
          <div className="space-y-4">
            {activeRides.map((ride) => (
              <Card key={ride.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{ride.patient?.full_name}</span>
                        <Phone className="w-4 h-4 ml-2" />
                        <span className="text-sm text-gray-600">{ride.patient?.phone}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{ride.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="text-sm">{ride.destination_address}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(ride.pickup_date).toLocaleDateString('pt-BR')} às {ride.pickup_time}
                        </div>
                        {ride.estimated_price && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R$ {ride.estimated_price}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(ride.status)}
                      <div className="flex gap-2">
                        {ride.status === 'accepted' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateRideStatus(ride.id, 'in_progress')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Iniciar Corrida
                          </Button>
                        )}
                        {ride.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateRideStatus(ride.id, 'completed')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Finalizar Corrida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Corridas Disponíveis */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Corridas Disponíveis</h2>
        {availableRides.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhuma corrida disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {availableRides.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{ride.patient?.full_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{ride.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="text-sm">{ride.destination_address}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(ride.pickup_date).toLocaleDateString('pt-BR')} às {ride.pickup_time}
                        </div>
                        {ride.estimated_price && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R$ {ride.estimated_price}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(ride.status)}
                      <Button 
                        onClick={() => acceptRide(ride.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Aceitar Corrida
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRideRequests;
