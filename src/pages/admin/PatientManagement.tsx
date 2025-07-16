
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, Check, X, User, Phone, Mail, FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PatientManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectedDocuments, setRejectedDocuments] = useState<string[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista de documentos possíveis para pacientes
  const patientDocuments = [
    { key: 'residence_proof', label: 'Comprovante de Residência' },
    { key: 'profile_photo', label: 'Foto de Perfil' },
    { key: 'sus_card', label: 'Cartão SUS' }
  ];

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

  const handleApprove = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          rejected_documents: null,
          rejection_reason: null
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Paciente Aprovado",
        description: "O paciente foi aprovado com sucesso e pode acessar o sistema.",
      });
      
      fetchPatients();
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

    if (rejectedDocuments.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um documento que precisa ser corrigido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          rejected_documents: rejectedDocuments
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Paciente Rejeitado",
        description: "O paciente foi rejeitado e poderá reenviar os documentos necessários.",
        variant: "destructive",
      });
      
      setRejectionReason("");
      setRejectedDocuments([]);
      fetchPatients();
    } catch (error) {
      console.error('Error rejecting patient:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o paciente.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentToggle = (documentKey: string, checked: boolean) => {
    if (checked) {
      setRejectedDocuments([...rejectedDocuments, documentKey]);
    } else {
      setRejectedDocuments(rejectedDocuments.filter(doc => doc !== documentKey));
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.cpf?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  const hasRecentResubmission = (patient: any) => {
    if (!patient.last_resubmission_at) return false;
    const resubmissionDate = new Date(patient.last_resubmission_at);
    const now = new Date();
    const diffInHours = (now.getTime() - resubmissionDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24; // Mostrar como recente se foi nas últimas 24 horas
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pacientes</h1>
        <p className="text-gray-600">Visualize e gerencie os cadastros de pacientes</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status === "all" ? "Todos" : 
                   status === "pending" ? "Pendentes" :
                   status === "approved" ? "Aprovados" : "Rejeitados"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhum paciente encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className={hasRecentResubmission(patient) ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{patient.full_name}</h3>
                        {hasRecentResubmission(patient) && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reenvio Recente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">CPF: {patient.cpf}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </div>
                      </div>
                      {patient.resubmission_count > 0 && (
                        <div className="mt-1">
                          <p className="text-sm text-blue-600 font-medium">
                            {patient.resubmission_count} reenvio(s) realizado(s)
                            {patient.last_resubmission_at && (
                              ` • Último: ${new Date(patient.last_resubmission_at).toLocaleDateString('pt-BR')}`
                            )}
                          </p>
                        </div>
                      )}
                      {patient.rejected_documents && patient.rejected_documents.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600 font-medium">
                            Documentos pendentes: {patient.rejected_documents.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(patient.status)}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Paciente - {patient.full_name}</DialogTitle>
                        </DialogHeader>
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
                          {patient.patients?.[0] && (
                            <>
                              <div>
                                <label className="text-sm font-medium">Cartão SUS</label>
                                <p className="text-sm text-gray-600">{patient.patients[0].sus_card}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Tem Dependência</label>
                                <p className="text-sm text-gray-600">
                                  {patient.patients[0].has_dependency ? 'Sim' : 'Não'}
                                </p>
                              </div>
                              {patient.patients[0].dependency_description && (
                                <div className="col-span-2">
                                  <label className="text-sm font-medium">Descrição da Dependência</label>
                                  <p className="text-sm text-gray-600">{patient.patients[0].dependency_description}</p>
                                </div>
                              )}
                              {patient.patients[0].special_needs && (
                                <div className="col-span-2">
                                  <label className="text-sm font-medium">Necessidades Especiais</label>
                                  <p className="text-sm text-gray-600">{patient.patients[0].special_needs}</p>
                                </div>
                              )}
                            </>
                          )}
                          <div>
                            <label className="text-sm font-medium">Data de Cadastro</label>
                            <p className="text-sm text-gray-600">
                              {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {patient.resubmission_count > 0 && (
                            <div>
                              <label className="text-sm font-medium">Reenvios</label>
                              <p className="text-sm text-gray-600">
                                {patient.resubmission_count} reenvio(s)
                                {patient.last_resubmission_at && (
                                  <br />
                                )}
                                {patient.last_resubmission_at && (
                                  <span className="text-xs text-gray-500">
                                    Último: {new Date(patient.last_resubmission_at).toLocaleString('pt-BR')}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          {patient.rejection_reason && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Motivo da Rejeição</label>
                              <p className="text-sm text-red-600">{patient.rejection_reason}</p>
                            </div>
                          )}
                          {patient.rejected_documents && patient.rejected_documents.length > 0 && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Documentos Rejeitados</label>
                              <p className="text-sm text-red-600">{patient.rejected_documents.join(', ')}</p>
                            </div>
                          )}
                        </div>
                        
                        {patient.status === "pending" && (
                          <div className="flex flex-col gap-4 mt-6 pt-4 border-t">
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(patient.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                                    <X className="w-4 h-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejeitar Paciente</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Documentos que precisam ser corrigidos</label>
                                      <div className="mt-2 space-y-2">
                                        {patientDocuments.map((doc) => (
                                          <div key={doc.key} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={doc.key}
                                              checked={rejectedDocuments.includes(doc.key)}
                                              onCheckedChange={(checked) => handleDocumentToggle(doc.key, checked as boolean)}
                                            />
                                            <label 
                                              htmlFor={doc.key}
                                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                              {doc.label}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Motivo da rejeição</label>
                                      <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Descreva os problemas encontrados nos documentos..."
                                        className="mt-1"
                                      />
                                    </div>
                                    <Button 
                                      onClick={() => handleReject(patient.id)}
                                      className="w-full bg-red-600 hover:bg-red-700"
                                    >
                                      Confirmar Rejeição
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        )}
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

export default PatientManagement;
