
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddressForm from "@/components/AddressForm";
import FileUpload from "@/components/FileUpload";

const PatientRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    cpf: "",
    rg: "",
    phone: "",
    email: "",
    susNumber: "",
    specialNeeds: "",
    acceptTerms: false
  });

  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  });

  const [files, setFiles] = useState({
    profilePhoto: [] as File[],
    residenceProof: [] as File[],
    identityFront: [] as File[],
    identityBack: [] as File[]
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type: string, selectedFiles: File[]) => {
    setFiles(prev => ({ ...prev, [type]: selectedFiles }));
  };

  const formatCpf = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  const validateForm = () => {
    console.log('Validating form data:', formData);
    
    if (!formData.fullName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome completo é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "E-mail é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cpf.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "CPF é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Telefone é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.birthDate) {
      toast({
        title: "Campo obrigatório",
        description: "Data de nascimento é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.susNumber.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Número do Cartão SUS é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!address.cep.trim() || !address.street.trim() || !address.number.trim() || 
        !address.neighborhood.trim() || !address.city.trim() || !address.state.trim()) {
      toast({
        title: "Endereço incompleto",
        description: "Todos os campos de endereço são obrigatórios.",
        variant: "destructive",
      });
      return false;
    }

    if (files.profilePhoto.length === 0) {
      toast({
        title: "Documento obrigatório",
        description: "Foto do perfil é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    if (files.identityFront.length === 0 || files.identityBack.length === 0) {
      toast({
        title: "Documentos obrigatórios",
        description: "Fotos da identidade (frente e verso) são obrigatórias.",
        variant: "destructive",
      });
      return false;
    }

    if (files.residenceProof.length === 0) {
      toast({
        title: "Documento obrigatório",
        description: "Comprovante de residência é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Termos não aceitos",
        description: "Você deve aceitar os termos de uso para continuar.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    try {
      console.log(`Uploading file to bucket: ${bucket}, folder: ${folder}`);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);
      return filePath;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Starting file uploads...');
      
      // Upload files with better error handling
      let profilePhotoUrl = "";
      let residenceProofUrl = "";
      let identityFrontUrl = "";
      let identityBackUrl = "";

      // Upload profile photo
      if (files.profilePhoto.length > 0) {
        try {
          profilePhotoUrl = await uploadFile(files.profilePhoto[0], 'profile-photos', 'patients');
          console.log('Profile photo uploaded:', profilePhotoUrl);
        } catch (error) {
          console.error('Error uploading profile photo:', error);
          throw new Error('Erro ao fazer upload da foto do perfil');
        }
      }

      // Upload residence proof
      if (files.residenceProof.length > 0) {
        try {
          residenceProofUrl = await uploadFile(files.residenceProof[0], 'residence-proofs', 'patients');
          console.log('Residence proof uploaded:', residenceProofUrl);
        } catch (error) {
          console.error('Error uploading residence proof:', error);
          throw new Error('Erro ao fazer upload do comprovante de residência');
        }
      }

      // Upload identity documents
      if (files.identityFront.length > 0) {
        try {
          identityFrontUrl = await uploadFile(files.identityFront[0], 'documents', 'patients');
          console.log('Identity front uploaded:', identityFrontUrl);
        } catch (error) {
          console.error('Error uploading identity front:', error);
          throw new Error('Erro ao fazer upload da identidade (frente)');
        }
      }

      if (files.identityBack.length > 0) {
        try {
          identityBackUrl = await uploadFile(files.identityBack[0], 'documents', 'patients');
          console.log('Identity back uploaded:', identityBackUrl);
        } catch (error) {
          console.error('Error uploading identity back:', error);
          throw new Error('Erro ao fazer upload da identidade (verso)');
        }
      }

      console.log('All files uploaded successfully');
      console.log('Creating profile...');

      // Generate UUID for the profile
      const profileId = crypto.randomUUID();

      // Create profile
      const profileData = {
        id: profileId,
        full_name: formData.fullName.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email.trim(),
        birth_date: formData.birthDate,
        rg: formData.rg.trim() || null,
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement.trim() || null,
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        cep: address.cep.replace(/\D/g, ''),
        user_type: 'patient',
        profile_photo: profilePhotoUrl,
        residence_proof: residenceProofUrl,
        status: 'pending'
      };

      console.log('Profile data:', profileData);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      console.log('Profile created successfully:', profile);
      console.log('Creating patient record...');

      // Create patient record
      const patientData = {
        id: profile.id,
        sus_card: formData.susNumber.trim(),
        special_needs: formData.specialNeeds.trim() || null
      };

      console.log('Patient data:', patientData);

      const { error: patientError } = await supabase
        .from('patients')
        .insert(patientData);

      if (patientError) {
        console.error('Patient creation error:', patientError);
        throw new Error(`Erro ao criar registro de paciente: ${patientError.message}`);
      }

      console.log('Patient created successfully');

      toast({
        title: "Cadastro enviado com sucesso!",
        description: "Aguarde a aprovação da prefeitura.",
      });

      navigate("/success", { state: { userType: "patient" } });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = "Ocorreu um erro ao enviar o cadastro.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/register")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="bg-viaja-gradient text-white px-4 py-2 rounded-lg font-bold text-lg">
            Viaja+ JF
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-viaja-blue" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Cadastro de Paciente
            </CardTitle>
            <p className="text-gray-600">
              Preencha seus dados para solicitar transporte médico
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Pessoais</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="h-12 rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange("birthDate", e.target.value)}
                        className="h-12 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formatCpf(formData.cpf)}
                        onChange={(e) => handleInputChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="h-12 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG (recomendado)</Label>
                      <Input
                        id="rg"
                        value={formData.rg}
                        onChange={(e) => handleInputChange("rg", e.target.value)}
                        className="h-12 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="susNumber">Número do Cartão SUS *</Label>
                      <Input
                        id="susNumber"
                        value={formData.susNumber}
                        onChange={(e) => handleInputChange("susNumber", e.target.value)}
                        className="h-12 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contato</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={formatPhone(formData.phone)}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="h-12 rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-12 rounded-lg"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Endereço</h3>
                <AddressForm address={address} onAddressChange={setAddress} />
              </div>

              {/* Documentos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos</h3>
                
                <div className="space-y-4">
                  <FileUpload
                    label="Foto do Perfil"
                    accept="image/*"
                    required
                    onFileChange={(files) => handleFileChange("profilePhoto", files)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FileUpload
                      label="Identidade ou CNH - Frente"
                      accept="image/*"
                      required
                      onFileChange={(files) => handleFileChange("identityFront", files)}
                    />

                    <FileUpload
                      label="Identidade ou CNH - Verso"
                      accept="image/*"
                      required
                      onFileChange={(files) => handleFileChange("identityBack", files)}
                    />
                  </div>

                  <FileUpload
                    label="Comprovante de Residência"
                    accept="image/*,.pdf"
                    required
                    onFileChange={(files) => handleFileChange("residenceProof", files)}
                  />
                </div>
              </div>

              {/* Necessidades Especiais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações Adicionais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="specialNeeds">
                    Necessidades especiais ou observações médicas (opcional)
                  </Label>
                  <Textarea
                    id="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
                    placeholder="Descreva qualquer necessidade especial, dificuldade de locomoção, etc."
                    className="min-h-24 rounded-lg"
                  />
                </div>
              </div>

              {/* Termos */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                  required
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  Li e concordo com os termos de uso e política de privacidade *
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 viaja-gradient text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-opacity"
                disabled={!formData.acceptTerms || loading}
              >
                {loading ? "Enviando..." : "Enviar para Aprovação da Prefeitura"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientRegister;
