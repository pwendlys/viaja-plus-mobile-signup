import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Eye, MapPin, Clock, User, Car, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RideManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch rides from Supabase
  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          patient:patient_id(full_name, phone),
          driver:driver_id(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast({
        title: "Erro ao carregar corridas",
        description: "Não foi possível carregar a lista de corridas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();

    // Set up real-time subscription
    const channel = supabase
      .channel('ride-changes')
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

  const filteredRides = rides.filter(ride => {
    const matchesSearch = ride.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ride.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Agendada</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800">Em Andamento</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
    }
  };

  const getStatusStats = () => {
    const stats = {
      scheduled: rides.filter(r => r.status === 'scheduled').length,
      in_progress: rides.filter(r => r.status === 'in_progress').length,
      completed: rides.filter(r => r.status === 'completed').length,
      cancelled: rides.filter(r => r.status === 'cancelled').length
    };
    return stats;
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando corridas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Corridas</h1>
        <p className="text-gray-600">Visualize e acompanhe todas as corridas do sistema</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por paciente, motorista ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "scheduled", "in_progress", "completed", "cancelled"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status === "all" ? "Todas" : 
                   status === "scheduled" ? "Agendadas" :
                   status === "in_progress" ? "Em Andamento" :
                   status === "completed" ? "Concluídas" : "Canceladas"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Corridas */}
      <div className="space-y-4">
        {filteredRides.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhuma corrida encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRides.map((ride) => (
            <Card key={ride.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Corrida #{ride.id}</h3>
                        {getStatusBadge(ride.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <strong>Paciente:</strong> {ride.patient?.full_name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <strong>Agendado:</strong> {new Date(`${ride.pickup_date} ${ride.pickup_time}`).toLocaleString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          <strong>Motorista:</strong> {ride.driver?.full_name || 'Não atribuído'}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 text-green-600" />
                          <strong className="text-xs">Origem:</strong> 
                          <span className="text-xs">{ride.pickup_address}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 text-red-600" />
                          <strong className="text-xs">Destino:</strong> 
                          <span className="text-xs">{ride.destination_address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Corrida #{ride.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <div className="mt-1">{getStatusBadge(ride.status)}</div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Data/Hora</label>
                              <p className="text-sm text-gray-600">
                                {new Date(`${ride.pickup_date} ${ride.pickup_time}`).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Paciente</label>
                              <p className="text-sm text-gray-600">{ride.patient?.full_name || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{ride.patient?.phone || ''}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Motorista</label>
                              <p className="text-sm text-gray-600">{ride.driver?.full_name || 'Não atribuído'}</p>
                              <p className="text-xs text-gray-500">{ride.driver?.phone || ''}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Endereço de Origem</label>
                              <p className="text-sm text-gray-600">{ride.pickup_address}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Endereço de Destino</label>
                              <p className="text-sm text-gray-600">{ride.destination_address}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Criado em</label>
                              <p className="text-sm text-gray-600">
                                {new Date(ride.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RideManagement;