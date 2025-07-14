
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, User } from "lucide-react";
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
    password: "",
    confirmPassword: "",
    
    susCard: "",
    hasDependency: false,
    dependencyDescription: "",
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
    identityDocument: [] as File[]
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

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload files
      let profilePhotoUrl = "";
      let residenceProofUrl = "";
      let identityDocumentUrl = "";

      if (files.profilePhoto.length > 0) {
        profilePhotoUrl = await uploadFile(files.profilePhoto[0], 'profile-photos', 'patients');
      }
      if (files.residenceProof.length > 0) {
        residenceProofUrl = await uploadFile(files.residenceProof[0], 'residence-proofs', 'patients');
      }
      if (files.identityDocument.length > 0) {
        identityDocumentUrl = await uploadFile(files.identityDocument[0], 'documents', 'patients');
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            user_type: 'patient'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Falha na criação do usuário");
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.fullName,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          email: formData.email,
          birth_date: formData.birthDate,
          rg: formData.rg,
          street: address.street,
          number: address.number,
          complement: address.complement || null,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          cep: address.cep.replace(/\D/g, ''),
          user_type: 'patient',
          profile_photo: profilePhotoUrl,
          residence_proof: residenceProofUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create patient record
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          id: profile.id,
          sus_card: formData.susCard,
          has_dependency: formData.hasDependency,
          dependency_description: formData.hasDependency ? formData.dependencyDescription : null,
          special_needs: formData.specialNeeds || null
        });

      if (patientError) throw patientError;

      toast({
        title: "Cadastro enviado com sucesso!",
        description: "Verifique seu e-mail para confirmar a conta. Aguarde a aprovação da prefeitura.",
      });

      navigate("/success", { state: { userType: "patient" } });
    } catch (error: any) {
      console.error('Error registering patient:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao enviar o cadastro.",
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
              <User className="w-8 h-8 text-viaja-blue" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Cadastro de Paciente
            </CardTitle>
            <p className="text-gray-600">
              Preencha seus dados para utilizar o transporte médico
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

                  <div className="space-y-2">
                    <Label htmlFor="rg">RG *</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleInputChange("rg", e.target.value)}
                      className="h-12 rounded-lg"
                      required
                    />
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
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Senha de Acesso</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Digite sua senha (mínimo 6 caracteres)"
                      className="h-12 rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="Digite novamente sua senha"
                      className="h-12 rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Endereço</h3>
                <AddressForm address={address} onAddressChange={setAddress} />
              </div>

              {/* Dados Médicos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Médicos</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="susCard">Número do Cartão SUS *</Label>
                    <Input
                      id="susCard"
                      value={formData.susCard}
                      onChange={(e) => handleInputChange("susCard", e.target.value)}
                      className="h-12 rounded-lg"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasDependency"
                      checked={formData.hasDependency}
                      onCheckedChange={(checked) => handleInputChange("hasDependency", checked as boolean)}
                    />
                    <Label htmlFor="hasDependency">
                      Possui alguma dependência ou limitação de mobilidade
                    </Label>
                  </div>

                  {formData.hasDependency && (
                    <div className="space-y-2">
                      <Label htmlFor="dependencyDescription">Descreva a dependência/limitação *</Label>
                      <Input
                        id="dependencyDescription"
                        value={formData.dependencyDescription}
                        onChange={(e) => handleInputChange("dependencyDescription", e.target.value)}
                        className="h-12 rounded-lg"
                        required={formData.hasDependency}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="specialNeeds">Necessidades Especiais (opcional)</Label>
                    <Input
                      id="specialNeeds"
                      value={formData.specialNeeds}
                      onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
                      placeholder="Ex: cadeira de rodas, acompanhante, etc."
                      className="h-12 rounded-lg"
                    />
                  </div>
                </div>
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

                  <FileUpload
                    label="Comprovante de Residência"
                    accept="image/*,.pdf"
                    required
                    onFileChange={(files) => handleFileChange("residenceProof", files)}
                  />

                  <FileUpload
                    label="Documento de Identidade (RG ou CNH)"
                    accept="image/*,.pdf"
                    required
                    onFileChange={(files) => handleFileChange("identityDocument", files)}
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
