import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Check, X, User, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PatientManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch patients from Supabase
  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          patients(*)
        `)
        .eq('user_type', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    // Set up real-time subscription
    const channel = supabase
      .channel('patient-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'user_type=eq.patient'
      }, () => {
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mockPatients = [
    {
      id: 1,
      name: "Maria Silva Santos",
      cpf: "123.456.789-00",
      email: "maria@email.com",
      phone: "(11) 99999-9999",
      address: "Rua das Flores, 123 - Centro",
      susCard: "123456789012345",
      status: "pending",
      registrationDate: "2024-01-15",
      profilePhoto: "/placeholder.svg",
      documents: ["comprovante_residencia.pdf"],
      hasDependency: false
    },
    {
      id: 2,
      name: "João Oliveira",
      cpf: "987.654.321-00",
      email: "joao@email.com",
      phone: "(11) 88888-8888",
      address: "Av. Principal, 456 - Bairro Novo",
      susCard: "987654321098765",
      status: "approved",
      registrationDate: "2024-01-10",
      profilePhoto: "/placeholder.svg",
      documents: ["comprovante_residencia.pdf"],
      hasDependency: true,
      dependencyDescription: "Cadeirante"
    },
    {
      id: 3,
      name: "Ana Costa",
      cpf: "456.789.123-00",
      email: "ana@email.com",
      phone: "(11) 77777-7777",
      address: "Rua da Paz, 789 - Vila Nova",
      susCard: "456789123456789",
      status: "rejected",
      registrationDate: "2024-01-12",
      profilePhoto: "/placeholder.svg",
      documents: ["comprovante_residencia.pdf"],
      hasDependency: false,
      rejectionReason: "Documentos ilegíveis"
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

  const handleApprove = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Paciente Aprovado",
        description: "O paciente foi aprovado com sucesso.",
      });
      
      fetchPatients(); // Refresh data
    } catch (error) {
      console.error('Error approving patient:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o paciente.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (patientId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Paciente Rejeitado",
        description: "O paciente foi rejeitado com sucesso.",
        variant: "destructive",
      });
      
      setRejectionReason("");
      fetchPatients(); // Refresh data
    } catch (error) {
      console.error('Error rejecting patient:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o paciente.",
        variant: "destructive",
      });
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.cpf?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pacientes</h1>
        <p className="text-gray-600">Visualize e gerencie os cadastros de pacientes</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou CPF..."
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

      {/* Lista de Pacientes */}
      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{patient.full_name}</h3>
                    <p className="text-sm text-gray-600">CPF: {patient.cpf}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CreditCard className="h-3 w-3" />
                        SUS: {patient.patients?.[0]?.sus_card}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(patient.status)}
                  
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
                        <DialogTitle>Detalhes do Paciente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Nome Completo</label>
                            <p className="text-sm text-gray-600">{patient.full_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">CPF</label>
                            <p className="text-sm text-gray-600">{patient.cpf}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <p className="text-sm text-gray-600">{patient.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Telefone</label>
                            <p className="text-sm text-gray-600">{patient.phone}</p>
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Endereço</label>
                            <p className="text-sm text-gray-600">
                              {`${patient.street}, ${patient.number} - ${patient.neighborhood}, ${patient.city} - ${patient.state}`}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Cartão SUS</label>
                            <p className="text-sm text-gray-600">{patient.patients?.[0]?.sus_card}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Data de Cadastro</label>
                            <p className="text-sm text-gray-600">
                              {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {patient.patients?.[0]?.special_needs && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Necessidades Especiais</label>
                              <p className="text-sm text-gray-600">{patient.patients[0].special_needs}</p>
                            </div>
                          )}
                          {patient.rejection_reason && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Motivo da Rejeição</label>
                              <p className="text-sm text-red-600">{patient.rejection_reason}</p>
                            </div>
                          )}
                        </div>

                        {patient.status === "pending" && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button 
                              onClick={() => handleApprove(patient.id)}
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
                                      onClick={() => handleReject(patient.id)}
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

export default PatientManagement;