
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, Check, X, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DocumentViewer from "@/components/admin/DocumentViewer";

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

  const getPatientDocuments = (patient: any) => {
    const patientInfo = patient.patients?.[0];
    
    return patientDocuments.map(doc => ({
      key: doc.key,
      label: doc.label,
      url: doc.key === 'sus_card' 
        ? patientInfo?.[doc.key] || null
        : patient[doc.key] || null,
      status: patient.rejected_documents?.includes(doc.key) ? 'rejected' : 
              patient.status === 'approved' ? 'approved' : 'pending'
    }));
  };

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
        description: "O paciente foi aprovado com sucesso.",
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

  const handleApproveDocument = async (patientId: string, documentKey: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const currentRejected = patient.rejected_documents || [];
    const updatedRejected = currentRejected.filter((doc: string) => doc !== documentKey);

    try {
      const updateData: any = {
        rejected_documents: updatedRejected
      };

      // Se não há mais documentos rejeitados, aprovar completamente
      if (updatedRejected.length === 0) {
        updateData.status = 'approved';
        updateData.rejection_reason = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Documento Aprovado",
        description: updatedRejected.length === 0 
          ? "Todos os documentos foram aprovados. Paciente liberado!"
          : "Documento aprovado com sucesso.",
      });

      fetchPatients();
    } catch (error) {
      console.error('Error approving document:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o documento.",
        variant: "destructive",
      });
    }
  };

  const handleRejectDocument = async (patientId: string, documentKey: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const currentRejected = patient.rejected_documents || [];
    if (currentRejected.includes(documentKey)) {
      toast({
        title: "Documento já rejeitado",
        description: "Este documento já está na lista de rejeitados.",
        variant: "destructive",
      });
      return;
    }

    const updatedRejected = [...currentRejected, documentKey];

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          rejected_documents: updatedRejected,
          rejection_reason: patient.rejection_reason || `Documento ${documentKey} rejeitado`
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Documento Rejeitado",
        description: "O documento foi rejeitado e o paciente deverá reenviá-lo.",
        variant: "destructive",
      });

      fetchPatients();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o documento.",
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
            <Card key={patient.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{patient.full_name}</h3>
                      <p className="text-sm text-gray-600">CPF: {patient.cpf}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </div>
                      </div>
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
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Paciente - {patient.full_name}</DialogTitle>
                        </DialogHeader>
                        
                        {/* Informações Pessoais */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
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
                          {patient.patients?.[0]?.special_needs && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Necessidades Especiais</label>
                              <p className="text-sm text-gray-600">{patient.patients[0].special_needs}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium">Data de Cadastro</label>
                            <p className="text-sm text-gray-600">
                              {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {patient.rejection_reason && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Motivo da Rejeição</label>
                              <p className="text-sm text-red-600">{patient.rejection_reason}</p>
                            </div>
                          )}
                        </div>

                        {/* Visualizador de Documentos */}
                        <DocumentViewer 
                          documents={getPatientDocuments(patient)}
                          onApproveDocument={(docKey) => handleApproveDocument(patient.id, docKey)}
                          onRejectDocument={(docKey) => handleRejectDocument(patient.id, docKey)}
                          showActions={patient.status !== 'approved'}
                        />
                        
                        {patient.status === "pending" && (
                          <div className="flex flex-col gap-4 mt-6 pt-4 border-t">
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(patient.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aprovar Todos
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
