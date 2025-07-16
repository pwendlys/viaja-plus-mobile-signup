
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import FileUpload from "@/components/FileUpload";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  FileText, 
  User, 
  Car,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const RegistrationStatus = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Buscar dados específicos baseado no tipo de usuário
      if (profileData.user_type === 'driver') {
        const { data: driverInfo } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', user.id)
          .single();
        setDriverData(driverInfo);
      } else if (profileData.user_type === 'patient') {
        const { data: patientInfo } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .single();
        setPatientData(patientInfo);
      }

      // Buscar histórico de documentos
      const { data: historyData } = await supabase
        .from('document_history')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      setDocumentHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getDocumentDisplayName = (docType: string) => {
    const documentNames: { [key: string]: string } = {
      'residence_proof': 'Comprovante de Residência',
      'profile_photo': 'Foto de Perfil',
      'sus_card': 'Cartão SUS',
      'cnh_front': 'CNH (Frente)',
      'cnh_back': 'CNH (Verso)',
      'vehicle_document': 'Documento do Veículo',
      'vehicle_photo': 'Foto do Veículo',
      'selfie_with_document': 'Selfie com Documento'
    };
    return documentNames[docType] || docType;
  };

  const getAvailableDocuments = () => {
    if (profile.user_type === 'patient') {
      return [
        'residence_proof',
        'profile_photo',
        'sus_card'
      ];
    } else if (profile.user_type === 'driver') {
      return [
        'residence_proof',
        'profile_photo',
        'cnh_front',
        'cnh_back',
        'vehicle_document',
        'vehicle_photo',
        'selfie_with_document'
      ];
    }
    return [];
  };

  const getRejectedDocuments = () => {
    if (!profile?.rejected_documents || !Array.isArray(profile.rejected_documents)) {
      // Se não há documentos específicos rejeitados mas o status é rejeitado,
      // mostrar todos os documentos disponíveis para reenvio
      if (profile?.status === 'rejected') {
        return getAvailableDocuments();
      }
      return [];
    }
    return profile.rejected_documents;
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0 || !selectedDocument) return;
    
    const file = files[0];
    setResubmitting(true);
    
    try {
      console.log('Uploading file:', file.name, 'for document:', selectedDocument);
      
      // Upload do arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_${selectedDocument}_${Date.now()}.${fileExt}`;
      const bucketName = getBucketName(selectedDocument);

      console.log('Uploading to bucket:', bucketName);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('File uploaded successfully, URL:', publicUrl);

      // Atualizar perfil com novo documento
      const updateData: any = {};
      updateData[getProfileFieldName(selectedDocument)] = publicUrl;
      updateData.last_resubmission_at = new Date().toISOString();
      updateData.resubmission_count = (profile.resubmission_count || 0) + 1;

      // Remover documento da lista de rejeitados se ele estava lá
      const currentRejected = profile.rejected_documents || [];
      if (Array.isArray(currentRejected)) {
        const updatedRejected = currentRejected.filter((doc: string) => doc !== selectedDocument);
        updateData.rejected_documents = updatedRejected;

        // Se não há mais documentos rejeitados, voltar status para pending
        if (updatedRejected.length === 0) {
          updateData.status = 'pending';
          updateData.rejection_reason = null;
        }
      } else {
        // Se não havia lista específica de documentos rejeitados, manter o status como pending para nova análise
        updateData.status = 'pending';
        updateData.rejection_reason = null;
      }

      console.log('Updating profile with:', updateData);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Registrar no histórico para que apareça no painel administrativo
      const historyData = {
        user_id: profile.id,
        document_type: selectedDocument,
        document_url: publicUrl,
        status: 'pending',
        version: getNextVersion(selectedDocument)
      };

      console.log('Inserting history:', historyData);

      const { error: historyError } = await supabase
        .from('document_history')
        .insert(historyData);

      if (historyError) {
        console.error('History error:', historyError);
        // Não falhar se o histórico não conseguir ser salvo
      }

      toast({
        title: "Documento Reenviado",
        description: `${getDocumentDisplayName(selectedDocument)} foi reenviado com sucesso e está aguardando nova análise.`,
      });

      setSelectedDocument(null);
      await fetchUserData(); // Recarregar dados

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erro no Upload",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setResubmitting(false);
    }
  };

  const getBucketName = (documentType: string) => {
    const buckets: { [key: string]: string } = {
      'residence_proof': 'residence-proofs',
      'profile_photo': 'profile-photos',
      'sus_card': 'user-uploads',
      'cnh_front': 'cnh-photos',
      'cnh_back': 'cnh-photos',
      'vehicle_document': 'documents',
      'vehicle_photo': 'vehicle-photos',
      'selfie_with_document': 'user-uploads'
    };
    return buckets[documentType] || 'user-uploads';
  };

  const getProfileFieldName = (documentType: string) => {
    const fields: { [key: string]: string } = {
      'residence_proof': 'residence_proof',
      'profile_photo': 'profile_photo',
      'sus_card': 'sus_card'
    };
    return fields[documentType] || documentType;
  };

  const getNextVersion = (documentType: string) => {
    const typeHistory = documentHistory.filter(doc => doc.document_type === documentType);
    return typeHistory.length + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-lg">Carregando status da solicitação...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao Carregar Dados</h2>
            <p className="text-gray-600 mb-4">Não foi possível carregar suas informações.</p>
            <Button onClick={() => navigate("/login")}>Voltar ao Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rejectedDocuments = getRejectedDocuments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Status da Solicitação de Cadastro
          </h1>
          <p className="text-gray-600">
            Acompanhe o status do seu cadastro e gerencie seus documentos
          </p>
        </div>

        {/* Status Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {profile.user_type === 'driver' ? (
                <Car className="w-6 h-6 text-blue-600" />
              ) : (
                <User className="w-6 h-6 text-green-600" />
              )}
              <span>
                {profile.user_type === 'driver' ? 'Cadastro de Motorista' : 'Cadastro de Paciente'}
              </span>
              {getStatusBadge(profile.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Nome Completo</p>
                <p className="text-lg">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">E-mail</p>
                <p className="text-lg">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Data de Solicitação</p>
                <p className="text-lg">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {profile.resubmission_count > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Reenvios Realizados</p>
                  <p className="text-lg">{profile.resubmission_count}</p>
                </div>
              )}
            </div>

            {profile.status === 'pending' && (
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Sua solicitação está sendo analisada pela equipe. Você receberá uma notificação assim que houver uma atualização.
                </AlertDescription>
              </Alert>
            )}

            {profile.status === 'approved' && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Parabéns! Seu cadastro foi aprovado. Você já pode acessar o sistema.
                  <Button 
                    className="ml-4" 
                    size="sm"
                    onClick={() => navigate(profile.user_type === 'driver' ? '/driver' : '/patient')}
                  >
                    Acessar Sistema
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {profile.status === 'rejected' && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p><strong>Sua solicitação foi rejeitada.</strong></p>
                    {profile.rejection_reason && (
                      <p><strong>Motivo:</strong> {profile.rejection_reason}</p>
                    )}
                    <p>Você pode corrigir os problemas e reenviar os documentos abaixo.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Documentos Rejeitados - Área de Reenvio */}
        {profile.status === 'rejected' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <RefreshCw className="w-5 h-5" />
                Reenvio de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rejectedDocuments.length > 0 ? (
                  rejectedDocuments.map((docType: string) => (
                    <div key={docType} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-800">
                            {getDocumentDisplayName(docType)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Reenvio Necessário
                        </Badge>
                      </div>
                      
                      {selectedDocument === docType ? (
                        <div className="space-y-3">
                          <FileUpload
                            label="Selecione o novo documento"
                            accept="image/*,.pdf"
                            multiple={false}
                            required={true}
                            onFileChange={handleFileUpload}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDocument(null)}
                              disabled={resubmitting}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelectedDocument(docType)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={resubmitting}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Reenviar Documento
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <p className="text-red-800 mb-4">
                      Sua solicitação foi rejeitada. Você pode reenviar qualquer documento para nova análise.
                    </p>
                    
                    {getAvailableDocuments().map((docType: string) => (
                      <div key={docType} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800">
                              {getDocumentDisplayName(docType)}
                            </span>
                          </div>
                        </div>
                        
                        {selectedDocument === docType ? (
                          <div className="space-y-3">
                            <FileUpload
                              label="Selecione o novo documento"
                              accept="image/*,.pdf"
                              multiple={false}
                              required={true}
                              onFileChange={handleFileUpload}
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDocument(null)}
                                disabled={resubmitting}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setSelectedDocument(docType)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={resubmitting}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Reenviar Documento
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Documentos */}
        {documentHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentHistory.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{getDocumentDisplayName(doc.document_type)}</p>
                        <p className="text-sm text-gray-600">
                          Versão {doc.version} • {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            Voltar ao Início
          </Button>
          {profile.status === 'approved' && (
            <Button
              onClick={() => navigate(profile.user_type === 'driver' ? '/driver' : '/patient')}
              className="viaja-gradient text-white"
            >
              Acessar Sistema
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatus;
