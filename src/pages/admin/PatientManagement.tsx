import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Check, X, User, Phone, Mail, MapPin, CreditCard, FileText, Camera, Home, Calendar, IdCard } from "lucide-react";
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
          patients(*),
          drivers(*)
        `)
        .eq('user_type', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched patients with drivers data:', data);
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

  const getDocumentImage = (url: string) => {
    if (!url) return null;
    
    console.log('Processing image URL:', url);
    
    // Se a URL já está completa, usar como está
    if (url.startsWith('http')) {
      return url;
    }
    
    // Construir URL completa para o storage do Supabase
    let finalUrl;
    if (url.includes('/')) {
      // URL já tem o path completo
      finalUrl = `https://yftbnwobufytmyrpuuis.supabase.co/storage/v1/object/public/user-uploads/${url}`;
    } else {
      // URL é apenas o nome do arquivo, assumir que está na pasta patients
      finalUrl = `https://yftbnwobufytmyrpuuis.supabase.co/storage/v1/object/public/user-uploads/patients/${url}`;
    }
    
    console.log('Final image URL:', finalUrl);
    return finalUrl;
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
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                    {patient.profile_photo ? (
                      <img 
                        src={getDocumentImage(patient.profile_photo)} 
                        alt="Foto do paciente"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading profile photo:', patient.profile_photo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
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
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Paciente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Informações Pessoais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                            <p className="text-sm text-gray-900 font-medium">{patient.full_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">CPF</label>
                            <p className="text-sm text-gray-900">{patient.cpf}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">RG</label>
                            <p className="text-sm text-gray-900">{patient.rg || 'Não informado'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
                            <p className="text-sm text-gray-900">
                              {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="text-sm text-gray-900">{patient.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Telefone</label>
                            <p className="text-sm text-gray-900">{patient.phone}</p>
                          </div>
                        </div>

                        {/* Endereço */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Endereço
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">CEP</label>
                              <p className="text-sm text-gray-900">{patient.cep}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Rua</label>
                              <p className="text-sm text-gray-900">{patient.street}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Número</label>
                              <p className="text-sm text-gray-900">{patient.number}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Complemento</label>
                              <p className="text-sm text-gray-900">{patient.complement || 'Não informado'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Bairro</label>
                              <p className="text-sm text-gray-900">{patient.neighborhood}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Cidade</label>
                              <p className="text-sm text-gray-900">{patient.city}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Estado</label>
                              <p className="text-sm text-gray-900">{patient.state}</p>
                            </div>
                          </div>
                        </div>

                        {/* Informações Médicas */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Informações Médicas
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Cartão SUS</label>
                              <p className="text-sm text-gray-900">{patient.patients?.[0]?.sus_card}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Possui Dependência?</label>
                              <p className="text-sm text-gray-900">
                                {patient.patients?.[0]?.has_dependency ? 'Sim' : 'Não'}
                              </p>
                            </div>
                            {patient.patients?.[0]?.dependency_description && (
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Descrição da Dependência</label>
                                <p className="text-sm text-gray-900">{patient.patients[0].dependency_description}</p>
                              </div>
                            )}
                            {patient.patients?.[0]?.special_needs && (
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Necessidades Especiais</label>
                                <p className="text-sm text-gray-900">{patient.patients[0].special_needs}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Documentos */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documentos Enviados
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Foto de Perfil */}
                            {patient.profile_photo && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  Foto de Perfil
                                </label>
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={getDocumentImage(patient.profile_photo)} 
                                    alt="Foto de perfil"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      console.error('Error loading profile photo:', patient.profile_photo);
                                    }}
                                  />
                                  <div className="p-2">
                                    <a 
                                      href={getDocumentImage(patient.profile_photo)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      Ver em tamanho completo
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CNH/RG Frente */}
                            {patient.drivers?.[0]?.cnh_front_photo && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <IdCard className="h-4 w-4" />
                                  CNH/RG Frente
                                </label>
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={getDocumentImage(patient.drivers[0].cnh_front_photo)} 
                                    alt="CNH/RG Frente"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      console.error('Error loading CNH front photo:', patient.drivers[0].cnh_front_photo);
                                    }}
                                  />
                                  <div className="p-2">
                                    <a 
                                      href={getDocumentImage(patient.drivers[0].cnh_front_photo)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      Ver documento completo
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CNH/RG Verso */}
                            {patient.drivers?.[0]?.cnh_back_photo && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <IdCard className="h-4 w-4" />
                                  CNH/RG Verso
                                </label>
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={getDocumentImage(patient.drivers[0].cnh_back_photo)} 
                                    alt="CNH/RG Verso"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      console.error('Error loading CNH back photo:', patient.drivers[0].cnh_back_photo);
                                    }}
                                  />
                                  <div className="p-2">
                                    <a 
                                      href={getDocumentImage(patient.drivers[0].cnh_back_photo)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      Ver documento completo
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Comprovante de Residência */}
                            {patient.residence_proof && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <Home className="h-4 w-4" />
                                  Comprovante de Residência
                                </label>
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={getDocumentImage(patient.residence_proof)} 
                                    alt="Comprovante de residência"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      console.error('Error loading residence proof:', patient.residence_proof);
                                    }}
                                  />
                                  <div className="p-2">
                                    <a 
                                      href={getDocumentImage(patient.residence_proof)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      Ver documento completo
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Debug: Mostrar se não há documentos CNH */}
                            {!patient.drivers?.[0]?.cnh_front_photo && !patient.drivers?.[0]?.cnh_back_photo && (
                              <div className="col-span-full p-4 bg-yellow-50 rounded-lg">
                                <p className="text-sm text-yellow-700">
                                  Documentos CNH não encontrados para este paciente.
                                  {patient.drivers?.[0] ? ' Dados do driver existem mas sem fotos CNH.' : ' Dados do driver não encontrados.'}
                                </p>
                                {process.env.NODE_ENV === 'development' && (
                                  <pre className="text-xs mt-2 text-gray-600">
                                    {JSON.stringify(patient.drivers, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Informações de Cadastro */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Informações de Cadastro
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Data de Cadastro</label>
                              <p className="text-sm text-gray-900">
                                {new Date(patient.created_at).toLocaleDateString('pt-BR')} às {new Date(patient.created_at).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Status</label>
                              <div className="mt-1">
                                {getStatusBadge(patient.status)}
                              </div>
                            </div>
                            {patient.rejection_reason && (
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-red-700">Motivo da Rejeição</label>
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{patient.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação */}
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
