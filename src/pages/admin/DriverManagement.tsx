import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, Check, X, Car, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DocumentViewer from "@/components/admin/DocumentViewer";
import { getDocumentPublicUrl, isRelativePath } from "@/lib/documentUtils";

const DriverManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectedDocuments, setRejectedDocuments] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista de documentos possíveis para motoristas
  const driverDocuments = [
    { key: 'residence_proof', label: 'Comprovante de Residência' },
    { key: 'profile_photo', label: 'Foto de Perfil' },
    { key: 'cnh_front_photo', label: 'CNH (Frente)' },
    { key: 'cnh_back_photo', label: 'CNH (Verso)' },
    { key: 'vehicle_document', label: 'Documento do Veículo' },
    { key: 'vehicle_photo', label: 'Foto do Veículo' },
    { key: 'selfie_with_document', label: 'Selfie com Documento' }
  ];

  // Fetch drivers from Supabase
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          drivers(*)
        `)
        .eq('user_type', 'driver')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Erro ao carregar motoristas",
        description: "Não foi possível carregar a lista de motoristas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();

    // Set up real-time subscription
    const channel = supabase
      .channel('driver-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'user_type=eq.driver'
      }, () => {
        fetchDrivers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getDriverDocuments = (driver: any) => {
    const driverInfo = driver.drivers?.[0];
    
    return driverDocuments.map(doc => {
      let rawUrl: string | null = null;
      
      // Determina de onde vem a URL do documento
      if (doc.key === 'residence_proof' || doc.key === 'profile_photo') {
        rawUrl = driver[doc.key];
      } else {
        rawUrl = driverInfo?.[doc.key] || null;
      }

      // Converte path relativo para URL pública se necessário
      let finalUrl = rawUrl;
      if (rawUrl && isRelativePath(rawUrl)) {
        finalUrl = getDocumentPublicUrl(doc.key, rawUrl);
      }

      return {
        key: doc.key,
        label: doc.label,
        url: finalUrl,
        status: (driver.rejected_documents?.includes(doc.key) ? 'rejected' : 
                driver.status === 'approved' ? 'approved' : 'pending') as 'approved' | 'rejected' | 'pending'
      };
    });
  };

  const handleApprove = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          rejected_documents: null,
          rejection_reason: null
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Motorista Aprovado",
        description: "O motorista foi aprovado com sucesso.",
      });
      
      fetchDrivers();
    } catch (error) {
      console.error('Error approving driver:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o motorista.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (driverId: string) => {
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
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Motorista Rejeitado",
        description: "O motorista foi rejeitado e poderá reenviar os documentos necessários.",
        variant: "destructive",
      });
      
      setRejectionReason("");
      setRejectedDocuments([]);
      fetchDrivers();
    } catch (error) {
      console.error('Error rejecting driver:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o motorista.",
        variant: "destructive",
      });
    }
  };

  const handleApproveDocument = async (driverId: string, documentKey: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    try {
      // Registrar na document_history
      const { error: historyError } = await supabase
        .from('document_history')
        .insert({
          user_id: driverId,
          document_type: documentKey,
          document_url: getDriverDocuments(driver).find(d => d.key === documentKey)?.url || '',
          status: 'approved'
        });

      if (historyError) {
        console.error('Error inserting document history:', historyError);
      }

      // Remover documento da lista de rejeitados
      const currentRejected = driver.rejected_documents || [];
      const updatedRejected = currentRejected.filter((doc: string) => doc !== documentKey);

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
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Documento Aprovado",
        description: `Documento ${documentKey} foi aprovado com sucesso.`,
      });

      fetchDrivers();
    } catch (error) {
      console.error('Error approving document:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o documento.",
        variant: "destructive",
      });
    }
  };

  const handleRejectDocument = async (driverId: string, documentKey: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const currentRejected = driver.rejected_documents || [];
    if (currentRejected.includes(documentKey)) {
      toast({
        title: "Documento já rejeitado",
        description: "Este documento já está na lista de rejeitados.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Registrar na document_history
      const { error: historyError } = await supabase
        .from('document_history')
        .insert({
          user_id: driverId,
          document_type: documentKey,
          document_url: getDriverDocuments(driver).find(d => d.key === documentKey)?.url || '',
          status: 'rejected'
        });

      if (historyError) {
        console.error('Error inserting document history:', historyError);
      }

      const updatedRejected = [...currentRejected, documentKey];

      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          rejected_documents: updatedRejected,
          rejection_reason: driver.rejection_reason || `Documento ${documentKey} rejeitado`
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Documento Rejeitado",
        description: `Documento ${documentKey} foi rejeitado.`,
        variant: "destructive",
      });

      fetchDrivers();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o documento.",
        variant: "destructive",
      });
    }
  };

  const handleApproveMultiple = async (driverId: string, documentKeys: string[]) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    try {
      // Registrar múltiplos documentos na document_history
      const historyPromises = documentKeys.map(documentKey => 
        supabase.from('document_history').insert({
          user_id: driverId,
          document_type: documentKey,
          document_url: getDriverDocuments(driver).find(d => d.key === documentKey)?.url || '',
          status: 'approved'
        })
      );

      await Promise.all(historyPromises);

      // Remover documentos da lista de rejeitados
      const currentRejected = driver.rejected_documents || [];
      const updatedRejected = currentRejected.filter((doc: string) => !documentKeys.includes(doc));

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
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Documentos Aprovados",
        description: `${documentKeys.length} documento(s) aprovado(s) com sucesso.`,
      });

      fetchDrivers();
    } catch (error) {
      console.error('Error approving multiple documents:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar os documentos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleRejectMultiple = async (driverId: string, documentKeys: string[]) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    try {
      // Registrar múltiplos documentos na document_history
      const historyPromises = documentKeys.map(documentKey => 
        supabase.from('document_history').insert({
          user_id: driverId,
          document_type: documentKey,
          document_url: getDriverDocuments(driver).find(d => d.key === documentKey)?.url || '',
          status: 'rejected'
        })
      );

      await Promise.all(historyPromises);

      const currentRejected = driver.rejected_documents || [];
      const newRejected = documentKeys.filter(key => !currentRejected.includes(key));
      const updatedRejected = [...currentRejected, ...newRejected];

      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          rejected_documents: updatedRejected,
          rejection_reason: driver.rejection_reason || `Documentos rejeitados: ${documentKeys.join(', ')}`
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Documentos Rejeitados",
        description: `${documentKeys.length} documento(s) rejeitado(s).`,
        variant: "destructive",
      });

      fetchDrivers();
    } catch (error) {
      console.error('Error rejecting multiple documents:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar os documentos selecionados.",
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

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.cpf?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
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
        <div className="text-lg">Carregando motoristas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Motoristas</h1>
        <p className="text-gray-600">Visualize e gerencie os cadastros de motoristas</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, CPF ou placa..."
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

      {/* Lista de Motoristas */}
      <div className="space-y-4">
        {filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Nenhum motorista encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{driver.full_name}</h3>
                      <p className="text-sm text-gray-600">CPF: {driver.cpf}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </div>
                        {driver.drivers?.[0] && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Car className="h-3 w-3" />
                            {driver.drivers[0].vehicle_make} {driver.drivers[0].vehicle_model} - {driver.drivers[0].vehicle_plate}
                          </div>
                        )}
                      </div>
                      {driver.rejected_documents && driver.rejected_documents.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600 font-medium">
                            Documentos pendentes: {driver.rejected_documents.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(driver.status)}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Motorista - {driver.full_name}</DialogTitle>
                        </DialogHeader>
                        
                        {/* Informações Pessoais */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <label className="text-sm font-medium">Nome Completo</label>
                            <p className="text-sm text-gray-600">{driver.full_name}</p>
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
                            <p className="text-sm text-gray-600">
                              {`${driver.street}, ${driver.number} - ${driver.neighborhood}, ${driver.city} - ${driver.state}`}
                            </p>
                          </div>
                          {driver.drivers?.[0] && (
                            <>
                              <div>
                                <label className="text-sm font-medium">CNH</label>
                                <p className="text-sm text-gray-600">{driver.drivers[0].cnh_number}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Veículo</label>
                                <p className="text-sm text-gray-600">
                                  {driver.drivers[0].vehicle_make} {driver.drivers[0].vehicle_model} ({driver.drivers[0].vehicle_year})
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Placa</label>
                                <p className="text-sm text-gray-600">{driver.drivers[0].vehicle_plate}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Cor</label>
                                <p className="text-sm text-gray-600">{driver.drivers[0].vehicle_color}</p>
                              </div>
                            </>
                          )}
                          <div>
                            <label className="text-sm font-medium">Data de Cadastro</label>
                            <p className="text-sm text-gray-600">
                              {new Date(driver.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {driver.rejection_reason && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Motivo da Rejeição</label>
                              <p className="text-sm text-red-600">{driver.rejection_reason}</p>
                            </div>
                          )}
                          {driver.rejected_documents && driver.rejected_documents.length > 0 && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium">Documentos Rejeitados</label>
                              <p className="text-sm text-red-600">{driver.rejected_documents.join(', ')}</p>
                            </div>
                          )}
                        </div>

                        {/* Visualizador de Documentos */}
                        <DocumentViewer 
                          documents={getDriverDocuments(driver)}
                          onApproveDocument={(docKey) => handleApproveDocument(driver.id, docKey)}
                          onRejectDocument={(docKey) => handleRejectDocument(driver.id, docKey)}
                          onApproveMultiple={(docKeys) => handleApproveMultiple(driver.id, docKeys)}
                          onRejectMultiple={(docKeys) => handleRejectMultiple(driver.id, docKeys)}
                          showActions={driver.status !== 'approved'}
                          allowMultipleSelection={true}
                        />
                        
                        {driver.status === "pending" && (
                          <div className="flex flex-col gap-4 mt-6 pt-4 border-t">
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(driver.id)}
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
                                    <DialogTitle>Rejeitar Motorista</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Documentos que precisam ser corrigidos</label>
                                      <div className="mt-2 space-y-2">
                                        {driverDocuments.map((doc) => (
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
                                      onClick={() => handleReject(driver.id)}
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

export default DriverManagement;
