
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddressForm from "@/components/AddressForm";
import FileUpload from "@/components/FileUpload";

const DriverRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    cpf: "",
    rg: "",
    phone: "",
    email: "",
    susNumber: "",
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
    cnhFront: [] as File[],
    cnhBack: [] as File[],
    vehiclePhoto: [] as File[],
    vehicleDocument: [] as File[],
    residenceProof: [] as File[],
    selfieWithDocument: [] as File[]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Driver registration data:", { formData, address, files });
    navigate("/success", { state: { userType: "driver" } });
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-viaja-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Cadastro de Motorista
            </CardTitle>
            <p className="text-gray-600">
              Preencha seus dados para oferecer transporte médico
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
                      <Label htmlFor="rg">RG *</Label>
                      <Input
                        id="rg"
                        value={formData.rg}
                        onChange={(e) => handleInputChange("rg", e.target.value)}
                        className="h-12 rounded-lg"
                        required
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Pessoais</h3>
                
                <div className="space-y-4">
                  <FileUpload
                    label="Foto do Perfil"
                    accept="image/*"
                    required
                    onFileChange={(files) => handleFileChange("profilePhoto", files)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FileUpload
                      label="CNH - Frente"
                      accept="image/*"
                      required
                      onFileChange={(files) => handleFileChange("cnhFront", files)}
                    />

                    <FileUpload
                      label="CNH - Verso"
                      accept="image/*"
                      required
                      onFileChange={(files) => handleFileChange("cnhBack", files)}
                    />
                  </div>

                  <FileUpload
                    label="Comprovante de Residência"
                    accept="image/*,.pdf"
                    required
                    onFileChange={(files) => handleFileChange("residenceProof", files)}
                  />

                  <FileUpload
                    label="Selfie segurando RG ou CNH"
                    accept="image/*"
                    required
                    onFileChange={(files) => handleFileChange("selfieWithDocument", files)}
                  />
                </div>
              </div>

              {/* Documentos do Veículo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos do Veículo</h3>
                
                <div className="space-y-4">
                  <FileUpload
                    label="Foto do Veículo"
                    accept="image/*"
                    required
                    onFileChange={(files) => handleFileChange("vehiclePhoto", files)}
                  />

                  <FileUpload
                    label="Documento do Veículo (CRLV)"
                    accept="image/*,.pdf"
                    required
                    onFileChange={(files) => handleFileChange("vehicleDocument", files)}
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
                className="w-full h-12 bg-secondary text-white text-lg font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                disabled={!formData.acceptTerms}
              >
                Enviar para Aprovação da Prefeitura
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverRegister;
