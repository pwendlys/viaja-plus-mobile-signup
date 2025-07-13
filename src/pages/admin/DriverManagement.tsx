import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Check, X, Car, Phone, Mail, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DriverManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");

  // Mock data - substituir por dados reais do Supabase
  const drivers = [
    {
      id: 1,
      name: "Carlos Silva",
      cpf: "111.222.333-44",
      email: "carlos@email.com",
      phone: "(11) 99999-0000",
      address: "Rua do Motorista, 100 - Centro",
      cnhNumber: "12345678901",
      vehicleMake: "Toyota",
      vehicleModel: "Corolla",
      vehicleYear: 2020,
      vehiclePlate: "ABC-1234",
      vehicleColor: "Branco",
      status: "pending",
      registrationDate: "2024-01-16",
      documents: {
        cnhFront: "cnh_frente.jpg",
        cnhBack: "cnh_verso.jpg",
        vehicleDocument: "crlv.pdf",
        selfieWithDocument: "selfie.jpg"
      }
    },
    {
      id: 2,
      name: "Roberto Santos",
      cpf: "555.666.777-88",
      email: "roberto@email.com",
      phone: "(11) 88888-0000",
      address: "Av. dos Motoristas, 200 - Vila Nova",
      cnhNumber: "98765432109",
      vehicleMake: "Honda",
      vehicleModel: "Civic",
      vehicleYear: 2021,
      vehiclePlate: "XYZ-5678",
      vehicleColor: "Prata",
      status: "approved",
      registrationDate: "2024-01-10",
      documents: {
        cnhFront: "cnh_frente.jpg",
        cnhBack: "cnh_verso.jpg",
        vehicleDocument: "crlv.pdf",
        selfieWithDocument: "selfie.jpg"
      }
    },
    {
      id: 3,
      name: "Paulo Oliveira",
      cpf: "999.888.777-66",
      email: "paulo@email.com",
      phone: "(11) 77777-0000",
      address: "Rua das Palmeiras, 300 - Jardim",
      cnhNumber: "11122233344",
      vehicleMake: "Volkswagen",
      vehicleModel: "Gol",
      vehicleYear: 2019,
      vehiclePlate: "DEF-9012",
      vehicleColor: "Azul",
      status: "rejected",
      registrationDate: "2024-01-14",
      rejectionReason: "CNH vencida",
      documents: {
        cnhFront: "cnh_frente.jpg",
        cnhBack: "cnh_verso.jpg",
        vehicleDocument: "crlv.pdf",
        selfieWithDocument: "selfie.jpg"
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const handleApprove = (driverId: number) => {
    toast({
      title: "Motorista Aprovado",
      description: "O motorista foi aprovado e notificado por email.",
    });
  };

  const handleReject = (driverId: number) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Motorista Rejeitado",
      description: "O motorista foi rejeitado e notificado por email.",
      variant: "destructive",
    });
    setRejectionReason("");
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.cpf.includes(searchTerm) ||
                         driver.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Motoristas</h1>
        <p className="text-gray-600">Visualize e gerencie os cadastros de motoristas</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou placa..."
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
                Todos
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
              >
                Pendentes
              </Button>
              <Button
                variant={filterStatus === "approved" ? "default" : "outline"}
                onClick={() => setFilterStatus("approved")}
              >
                Aprovados
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                onClick={() => setFilterStatus("rejected")}
              >
                Rejeitados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Motoristas */}
      <div className="grid gap-4">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{driver.name}</h3>
                    <p className="text-sm text-gray-600">CPF: {driver.cpf}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Car className="h-3 w-3" />
                        {driver.vehiclePlate} - {driver.vehicleMake} {driver.vehicleModel}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(driver.status)}
                  
                  {/* Botão Ver Detalhes */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Motorista</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Dados Pessoais */}
                        <div>
                          <h3 className="font-semibold mb-3">Dados Pessoais</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Nome Completo</label>
                              <p className="text-sm text-gray-600">{driver.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">CPF</label>
                              <p className="text-sm text-gray-600">{driver.cpf}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <p className="text-sm text-gray-600">{driver.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Telefone</label>
                              <p className="text-sm text-gray-600">{driver.phone}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Endereço</label>
                              <p className="text-sm text-gray-600">{driver.address}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">CNH</label>
                              <p className="text-sm text-gray-600">{driver.cnhNumber}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Data de Cadastro</label>
                              <p className="text-sm text-gray-600">{driver.registrationDate}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dados do Veículo */}
                        <div>
                          <h3 className="font-semibold mb-3">Dados do Veículo</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Marca</label>
                              <p className="text-sm text-gray-600">{driver.vehicleMake}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Modelo</label>
                              <p className="text-sm text-gray-600">{driver.vehicleModel}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Ano</label>
                              <p className="text-sm text-gray-600">{driver.vehicleYear}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Placa</label>
                              <p className="text-sm text-gray-600">{driver.vehiclePlate}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Cor</label>
                              <p className="text-sm text-gray-600">{driver.vehicleColor}</p>
                            </div>
                          </div>
                        </div>

                        {/* Documentos */}
                        <div>
                          <h3 className="font-semibold mb-3">Documentos</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Button variant="outline" size="sm" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                CNH Frente
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                CNH Verso
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Button variant="outline" size="sm" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                CRLV
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                Selfie com Documento
                              </Button>
                            </div>
                          </div>
                        </div>

                        {driver.status === "pending" && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button 
                              onClick={() => handleApprove(driver.id)}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                  <X className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rejeitar Cadastro</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Informe o motivo da rejeição..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                  />
                                  <div className="flex gap-3">
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => handleReject(driver.id)}
                                      className="flex-1"
                                    >
                                      Confirmar Rejeição
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
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

export default DriverManagement;