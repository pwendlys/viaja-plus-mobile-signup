import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Eye, MapPin, Clock, User, Car, Calendar } from "lucide-react";

const RideManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data - substituir por dados reais do Supabase
  const rides = [
    {
      id: 1,
      patient: {
        name: "Maria Silva Santos",
        phone: "(11) 99999-9999"
      },
      driver: {
        name: "Carlos Silva",
        phone: "(11) 99999-0000",
        vehicle: "Toyota Corolla - ABC-1234"
      },
      origin: "Rua das Flores, 123 - Centro",
      destination: "Hospital Municipal",
      scheduledTime: "2024-01-20 14:30",
      status: "scheduled",
      distance: "5.2 km",
      duration: "15 min",
      createdAt: "2024-01-18 10:00"
    },
    {
      id: 2,
      patient: {
        name: "João Oliveira",
        phone: "(11) 88888-8888"
      },
      driver: {
        name: "Roberto Santos",
        phone: "(11) 88888-0000",
        vehicle: "Honda Civic - XYZ-5678"
      },
      origin: "Av. Principal, 456 - Bairro Novo",
      destination: "UBS Central",
      scheduledTime: "2024-01-20 09:00",
      status: "in_progress",
      distance: "3.8 km",
      duration: "12 min",
      createdAt: "2024-01-19 08:00"
    },
    {
      id: 3,
      patient: {
        name: "Ana Costa",
        phone: "(11) 77777-7777"
      },
      driver: {
        name: "Paulo Oliveira",
        phone: "(11) 77777-0000",
        vehicle: "VW Gol - DEF-9012"
      },
      origin: "Rua da Paz, 789 - Vila Nova",
      destination: "Hospital Central",
      scheduledTime: "2024-01-19 16:00",
      status: "completed",
      distance: "7.1 km",
      duration: "22 min",
      createdAt: "2024-01-18 14:30",
      completedAt: "2024-01-19 16:22"
    },
    {
      id: 4,
      patient: {
        name: "Pedro Santos",
        phone: "(11) 66666-6666"
      },
      driver: {
        name: "Carlos Silva",
        phone: "(11) 99999-0000",
        vehicle: "Toyota Corolla - ABC-1234"
      },
      origin: "Centro da Cidade",
      destination: "Clínica Popular",
      scheduledTime: "2024-01-19 10:30",
      status: "cancelled",
      distance: "4.5 km",
      duration: "18 min",
      createdAt: "2024-01-18 16:00",
      cancelledAt: "2024-01-19 09:00",
      cancellationReason: "Paciente não compareceu"
    }
  ];

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
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const filteredRides = rides.filter(ride => {
    const matchesSearch = ride.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ride.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Corridas</h1>
        <p className="text-gray-600">Visualize e acompanhe todas as corridas do sistema</p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {rides.filter(r => r.status === "scheduled").length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-orange-600">
                  {rides.filter(r => r.status === "in_progress").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">
                  {rides.filter(r => r.status === "completed").length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">
                  {rides.filter(r => r.status === "cancelled").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, motorista ou destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                Todas
              </Button>
              <Button
                variant={filterStatus === "scheduled" ? "default" : "outline"}
                onClick={() => setFilterStatus("scheduled")}
              >
                Agendadas
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                onClick={() => setFilterStatus("in_progress")}
              >
                Em Andamento
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
              >
                Concluídas
              </Button>
              <Button
                variant={filterStatus === "cancelled" ? "default" : "outline"}
                onClick={() => setFilterStatus("cancelled")}
              >
                Canceladas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Corridas */}
      <div className="grid gap-4">
        {filteredRides.map((ride) => (
          <Card key={ride.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Corrida #{ride.id}</h3>
                      {getStatusBadge(ride.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Paciente:</span>
                          <span>{ride.patient.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Motorista:</span>
                          <span>{ride.driver.name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Agendado:</span>
                          <span>{new Date(ride.scheduledTime).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="text-gray-600">
                          {ride.distance} • {ride.duration}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Origem:</span>
                        <span>{ride.origin}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Destino:</span>
                        <span>{ride.destination}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* Botão Ver Detalhes */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Corrida #{ride.id}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="flex justify-center">
                          {getStatusBadge(ride.status)}
                        </div>

                        {/* Informações do Paciente */}
                        <div>
                          <h3 className="font-semibold mb-3">Paciente</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Nome</label>
                              <p className="text-sm text-gray-600">{ride.patient.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Telefone</label>
                              <p className="text-sm text-gray-600">{ride.patient.phone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Informações do Motorista */}
                        <div>
                          <h3 className="font-semibold mb-3">Motorista</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Nome</label>
                              <p className="text-sm text-gray-600">{ride.driver.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Telefone</label>
                              <p className="text-sm text-gray-600">{ride.driver.phone}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Veículo</label>
                              <p className="text-sm text-gray-600">{ride.driver.vehicle}</p>
                            </div>
                          </div>
                        </div>

                        {/* Detalhes da Viagem */}
                        <div>
                          <h3 className="font-semibold mb-3">Detalhes da Viagem</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Origem</label>
                              <p className="text-sm text-gray-600">{ride.origin}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Destino</label>
                              <p className="text-sm text-gray-600">{ride.destination}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium">Distância</label>
                                <p className="text-sm text-gray-600">{ride.distance}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Duração</label>
                                <p className="text-sm text-gray-600">{ride.duration}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Agendado</label>
                                <p className="text-sm text-gray-600">
                                  {new Date(ride.scheduledTime).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            {ride.completedAt && (
                              <div>
                                <label className="text-sm font-medium">Concluído em</label>
                                <p className="text-sm text-gray-600">
                                  {new Date(ride.completedAt).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            )}
                            {ride.cancellationReason && (
                              <div>
                                <label className="text-sm font-medium">Motivo do Cancelamento</label>
                                <p className="text-sm text-gray-600">{ride.cancellationReason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mapa */}
                        <div>
                          <h3 className="font-semibold mb-3">Mapa da Rota</h3>
                          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">Mapa será integrado com Mapbox</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RideManagement;