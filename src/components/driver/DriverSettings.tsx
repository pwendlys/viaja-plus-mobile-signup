import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { User, Car, DollarSign, Save, CheckCircle, AlertCircle } from "lucide-react";
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
    // Set up real-time subscription for driver updates
    const subscription = supabase
      .channel('driver-profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        console.log('Profile updated, refreshing data...');
        onUpdate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drivers'
      }, () => {
        console.log('Driver data updated, refreshing data...');
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [onUpdate]);

  // Update local state when driverData prop changes
  useEffect(() => {
    if (driverData) {
      console.log('Updating driver data from props:', driverData);
      setProfileData({
        full_name: driverData.full_name || "",
        phone: driverData.phone || "",
        cpf: driverData.cpf || "",
        email: driverData.email || "",
        birth_date: driverData.birth_date || "",
        cep: driverData.cep || "",
        street: driverData.street || "",
        number: driverData.number || "",
        neighborhood: driverData.neighborhood || "",
        city: driverData.city || "",
        state: driverData.state || "",
        complement: driverData.complement || "",
      });

      setDriverDetails({
        cnh_number: driverData.drivers?.[0]?.cnh_number || "",
        vehicle_make: driverData.drivers?.[0]?.vehicle_make || "",
        vehicle_model: driverData.drivers?.[0]?.vehicle_model || "",
        vehicle_year: driverData.drivers?.[0]?.vehicle_year || "",
        vehicle_plate: driverData.drivers?.[0]?.vehicle_plate || "",
        vehicle_color: driverData.drivers?.[0]?.vehicle_color || "",
        has_accessibility: driverData.drivers?.[0]?.has_accessibility || false,
      });
    }
  }, [driverData]);

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

  // Check if driver has complete vehicle information
  const hasCompleteVehicleInfo = () => {
    const isComplete = driverDetails.cnh_number && 
           driverDetails.vehicle_make && 
           driverDetails.vehicle_model && 
           driverDetails.vehicle_year && 
           driverDetails.vehicle_plate && 
           driverDetails.vehicle_color;
    
    console.log('Vehicle info completeness check:', {
      cnh_number: !!driverDetails.cnh_number,
      vehicle_make: !!driverDetails.vehicle_make,
      vehicle_model: !!driverDetails.vehicle_model,
      vehicle_year: !!driverDetails.vehicle_year,
      vehicle_plate: !!driverDetails.vehicle_plate,
      vehicle_color: !!driverDetails.vehicle_color,
      isComplete
    });
    
    return isComplete;
  };

  // Get missing fields for validation feedback
  const getMissingFields = () => {
    const missing = [];
    if (!driverDetails.cnh_number) missing.push("Número da CNH");
    if (!driverDetails.vehicle_make) missing.push("Marca do veículo");
    if (!driverDetails.vehicle_model) missing.push("Modelo do veículo");
    if (!driverDetails.vehicle_year) missing.push("Ano do veículo");
    if (!driverDetails.vehicle_plate) missing.push("Placa do veículo");
    if (!driverDetails.vehicle_color) missing.push("Cor do veículo");
    return missing;
  };

  const validateDriverDetails = () => {
    const errors = [];
    
    // Check required fields
    if (!driverDetails.cnh_number.trim()) errors.push("Número da CNH é obrigatório");
    if (!driverDetails.vehicle_make.trim()) errors.push("Marca do veículo é obrigatória");
    if (!driverDetails.vehicle_model.trim()) errors.push("Modelo do veículo é obrigatório");
    if (!driverDetails.vehicle_year || driverDetails.vehicle_year === "" || Number(driverDetails.vehicle_year) < 1900) {
      errors.push("Ano do veículo deve ser válido");
    }
    if (!driverDetails.vehicle_plate.trim()) errors.push("Placa do veículo é obrigatória");
    if (!driverDetails.vehicle_color.trim()) errors.push("Cor do veículo é obrigatória");
    
    return errors;
  };

  const updateProfile = async () => {
    console.log('Starting profile update process...');
    setLoading(true);
    
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        toast({
          title: "Erro de Autenticação",
          description: "Você precisa estar logado para salvar o perfil.",
          variant: "destructive",
        });
        return;
      }

      console.log('User authenticated:', user.id);
      console.log('Driver data ID:', driverData?.id);

      // Validate driver details
      const validationErrors = validateDriverDetails();
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
        toast({
          title: "Dados Incompletos",
          description: validationErrors.join(", "),
          variant: "destructive",
        });
        return;
      }

      console.log('Validation passed, updating profile...');
      console.log('Profile data to update:', profileData);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverData.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Profile updated successfully, now updating driver data...');

      // Prepare driver data for upsert
      const driverDataToSave = {
        ...driverDetails,
        id: driverData.id,
        vehicle_year: parseInt(driverDetails.vehicle_year.toString()) || null
      };

      console.log('Driver data to save:', driverDataToSave);

      // Check if driver record exists
      const { data: existingDriver, error: checkError } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', driverData.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing driver:', checkError);
        throw checkError;
      }

      console.log('Existing driver check result:', existingDriver);

      if (existingDriver) {
        // Update existing driver
        console.log('Updating existing driver record...');
        const { error: driverUpdateError } = await supabase
          .from('drivers')
          .update(driverDataToSave)
          .eq('id', driverData.id);

        if (driverUpdateError) {
          console.error('Driver update error:', driverUpdateError);
          throw driverUpdateError;
        }
        console.log('Driver updated successfully');
      } else {
        // Insert new driver
        console.log('Inserting new driver record...');
        const { error: driverInsertError } = await supabase
          .from('drivers')
          .insert(driverDataToSave);

        if (driverInsertError) {
          console.error('Driver insert error:', driverInsertError);
          throw driverInsertError;
        }
        console.log('Driver inserted successfully');
      }

      // Check if profile is complete and approve automatically
      const isProfileComplete = hasCompleteVehicleInfo();
      console.log('Profile completeness check:', isProfileComplete);
      console.log('Current driver status:', driverData.status);

      if (isProfileComplete && driverData.status !== 'approved') {
        console.log('Profile is complete, approving driver...');
        const { error: statusError } = await supabase
          .from('profiles')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', driverData.id);

        if (statusError) {
          console.error('Status update error:', statusError);
          throw statusError;
        }

        console.log('Driver approved successfully');
        toast({
          title: "Perfil Aprovado!",
          description: "Seu perfil foi completado e aprovado automaticamente. Agora você pode receber corridas!",
        });
      } else {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso!",
        });
      }

      console.log('All updates completed, refreshing data...');
      // Force refresh parent data
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o perfil: ${error.message || 'Erro desconhecido'}`,
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
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Erro de Autenticação",
          description: "Você precisa estar logado para enviar documentos.",
          variant: "destructive",
        });
        return;
      }

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

      // Force refresh parent data
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

  const missingFields = getMissingFields();
  const isComplete = hasCompleteVehicleInfo();

  return (
    <div className="space-y-6">
      {/* Status do Perfil */}
      {isComplete ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">Perfil Completo e Aprovado!</p>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Seu veículo está cadastrado e você pode receber corridas em tempo real.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Complete seu perfil para receber corridas</p>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Campos obrigatórios faltando: {missingFields.join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

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
            <Label htmlFor="cnh_number">Número da CNH *</Label>
            <Input
              id="cnh_number"
              value={driverDetails.cnh_number}
              onChange={(e) => setDriverDetails(prev => ({ ...prev, cnh_number: e.target.value }))}
              className={!driverDetails.cnh_number ? "border-orange-300" : ""}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_make">Marca *</Label>
              <Input
                id="vehicle_make"
                value={driverDetails.vehicle_make}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_make: e.target.value }))}
                className={!driverDetails.vehicle_make ? "border-orange-300" : ""}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_model">Modelo *</Label>
              <Input
                id="vehicle_model"
                value={driverDetails.vehicle_model}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_model: e.target.value }))}
                className={!driverDetails.vehicle_model ? "border-orange-300" : ""}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_year">Ano *</Label>
              <Input
                id="vehicle_year"
                type="number"
                min="1900"
                max="2030"
                value={driverDetails.vehicle_year}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_year: e.target.value }))}
                className={!driverDetails.vehicle_year ? "border-orange-300" : ""}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_plate">Placa *</Label>
              <Input
                id="vehicle_plate"
                value={driverDetails.vehicle_plate}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                className={!driverDetails.vehicle_plate ? "border-orange-300" : ""}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="vehicle_color">Cor *</Label>
              <Input
                id="vehicle_color"
                value={driverDetails.vehicle_color}
                onChange={(e) => setDriverDetails(prev => ({ ...prev, vehicle_color: e.target.value }))}
                className={!driverDetails.vehicle_color ? "border-orange-300" : ""}
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
        <Save className="w-4 h-4 mr-2" />
        {loading ? "Salvando..." : "Salvar Perfil"}
      </Button>
    </div>
  );
};

export default DriverSettings;
