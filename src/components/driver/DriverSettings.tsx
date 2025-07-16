
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { User, Car, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";

interface DriverSettingsProps {
  driverData: any;
  onUpdate: () => void;
}

const DriverSettings = ({ driverData, onUpdate }: DriverSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [kmPricing, setKmPricing] = useState<any[]>([]);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: driverData?.full_name || "",
    phone: driverData?.phone || "",
    cpf: driverData?.cpf || "",
    email: driverData?.email || "",
    birth_date: driverData?.birth_date || "",
    cep: driverData?.cep || "",
    street: driverData?.street || "",
    number: driverData?.number || "",
    neighborhood: driverData?.neighborhood || "",
    city: driverData?.city || "",
    state: driverData?.state || "",
    complement: driverData?.complement || "",
  });

  // Driver specific data
  const [driverDetails, setDriverDetails] = useState({
    cnh_number: driverData?.drivers?.[0]?.cnh_number || "",
    vehicle_make: driverData?.drivers?.[0]?.vehicle_make || "",
    vehicle_model: driverData?.drivers?.[0]?.vehicle_model || "",
    vehicle_year: driverData?.drivers?.[0]?.vehicle_year || "",
    vehicle_plate: driverData?.drivers?.[0]?.vehicle_plate || "",
    vehicle_color: driverData?.drivers?.[0]?.vehicle_color || "",
    has_accessibility: driverData?.drivers?.[0]?.has_accessibility || false,
  });

  useEffect(() => {
    fetchKmPricing();
  }, []);

  const fetchKmPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('km_pricing')
        .select('*');

      if (error) throw error;
      setKmPricing(data || []);
    } catch (error) {
      console.error('Error fetching KM pricing:', error);
    }
  };

  const getCurrentPrice = () => {
    const carType = driverDetails.has_accessibility ? 'accessibility' : 'common';
    const pricing = kmPricing.find(p => p.car_type === carType);
    return pricing?.price_per_km || null;
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', driverData.id);

      if (profileError) throw profileError;

      const { error: driverError } = await supabase
        .from('drivers')
        .update(driverDetails)
        .eq('id', driverData.id);

      if (driverError) throw driverError;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[], documentType: string) => {
    if (files.length === 0) return;
    
    const file = files[0];
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${driverData.id}_${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const updateData = { [documentType]: publicUrl };
      
      const { error: updateError } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', driverData.id);

      if (updateError) throw updateError;

      toast({
        title: "Documento enviado",
        description: "Documento foi carregado com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o documento.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={profileData.cpf}
                onChange={(e) => setProfileData(prev => ({ ...prev, cpf: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={profileData.birth_date}
                onChange={(e) => setProfileData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={profileData.cep}
                onChange={(e) => setProfileData(prev => ({ ...prev, cep: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={profileData.street}
                onChange={(e) => setProfileData(prev => ({ ...prev, street: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={profileData.number}
                onChange={(e) => setProfileData(prev => ({ ...prev, number: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={profileData.neighborhood}
                onChange={(e) => setProfileData(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={profileData.city}
                onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={profileData.state}
                onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={profileData.complement}
                onChange={(e) => setProfileData(prev => ({ ...prev, complement: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Informações do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cnh_number">Número da CNH</Label>
            <Input
              id="cnh_number"
              value={driverDetails.cnh_number}
              onChange={(e) => setDriverDetails(prev => ({ ...prev, cnh_number: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_make">Marca</Label>
              <Input
                id="vehicle_make"
                value={driverDetails.vehicle_make}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_make: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_model">Modelo</Label>
              <Input
                id="vehicle_model"
                value={driverDetails.vehicle_model}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_model: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_year">Ano</Label>
              <Input
                id="vehicle_year"
                type="number"
                value={driverDetails.vehicle_year}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_year: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_plate">Placa</Label>
              <Input
                id="vehicle_plate"
                value={driverDetails.vehicle_plate}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_plate: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="vehicle_color">Cor</Label>
              <Input
                id="vehicle_color"
                value={driverDetails.vehicle_color}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_color: e.target.value }))}
              />
            </div>
          </div>

          {/* Tipo de Veículo */}
          <div className="space-y-4">
            <Label>Tipo de Veículo</Label>
            <RadioGroup
              value={driverDetails.has_accessibility ? "accessibility" : "common"}
              onValueChange={(value) => 
                setDriverDetails(prev => ({ 
                  ...prev, 
                  has_accessibility: value === "accessibility" 
                }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="common" id="common" />
                <Label htmlFor="common">Veículo Comum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accessibility" id="accessibility" />
                <Label htmlFor="accessibility">Veículo com Acessibilidade</Label>
              </div>
            </RadioGroup>
            
            {/* Exibir preço atual */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">Preço Por KM</span>
              </div>
              <Badge variant="secondary" className="text-lg">
                {getCurrentPrice() ? `R$ ${getCurrentPrice().toFixed(2)}` : 'Preço não definido'}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">
                Este valor é definido pelo administrador e se aplica ao tipo de veículo selecionado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FileUpload
                label="CNH Frente"
                accept="image/*"
                onFileChange={(files) => handleFileUpload(files, 'cnh_front_photo')}
              />
            </div>
            <div>
              <FileUpload
                label="CNH Verso"
                accept="image/*"
                onFileChange={(files) => handleFileUpload(files, 'cnh_back_photo')}
              />
            </div>
            <div>
              <FileUpload
                label="Selfie com Documento"
                accept="image/*"
                onFileChange={(files) => handleFileUpload(files, 'selfie_with_document')}
              />
            </div>
            <div>
              <FileUpload
                label="Foto do Veículo"
                accept="image/*"
                onFileChange={(files) => handleFileUpload(files, 'vehicle_photo')}
              />
            </div>
            <div className="md:col-span-2">
              <FileUpload
                label="Documento do Veículo"
                accept="image/*,.pdf"
                onFileChange={(files) => handleFileUpload(files, 'vehicle_document')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button onClick={updateProfile} disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  );
};

export default DriverSettings;
