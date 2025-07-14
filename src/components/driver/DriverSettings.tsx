
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverSettingsProps {
  driverData: any;
  onUpdate: () => void;
}

const DriverSettings = ({ driverData, onUpdate }: DriverSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: driverData.full_name || '',
    email: driverData.email || '',
    phone: driverData.phone || '',
    street: driverData.street || '',
    number: driverData.number || '',
    complement: driverData.complement || '',
    neighborhood: driverData.neighborhood || '',
    city: driverData.city || '',
    state: driverData.state || '',
    cep: driverData.cep || '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_make: driverData.drivers?.[0]?.vehicle_make || '',
    vehicle_model: driverData.drivers?.[0]?.vehicle_model || '',
    vehicle_year: driverData.drivers?.[0]?.vehicle_year || '',
    vehicle_plate: driverData.drivers?.[0]?.vehicle_plate || '',
    vehicle_color: driverData.drivers?.[0]?.vehicle_color || '',
    has_accessibility: driverData.drivers?.[0]?.has_accessibility || false,
    custom_price_per_km: driverData.drivers?.[0]?.custom_price_per_km || '',
  });

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('id', driverData.id);

      if (error) throw error;

      toast({
        title: "Perfil Atualizado",
        description: "Seus dados de perfil foram atualizados com sucesso!",
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

  const saveVehicle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update(vehicleForm)
        .eq('id', driverData.id);

      if (error) throw error;

      toast({
        title: "Dados do Veículo Atualizados",
        description: "Os dados do seu veículo foram atualizados com sucesso!",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados do veículo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={profileForm.cep}
                onChange={(e) => setProfileForm({...profileForm, cep: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={profileForm.street}
                onChange={(e) => setProfileForm({...profileForm, street: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={profileForm.number}
                onChange={(e) => setProfileForm({...profileForm, number: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={profileForm.complement}
                onChange={(e) => setProfileForm({...profileForm, complement: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={profileForm.neighborhood}
                onChange={(e) => setProfileForm({...profileForm, neighborhood: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={profileForm.city}
                onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={profileForm.state}
                onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
              />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Dados Pessoais"}
          </Button>
        </CardContent>
      </Card>

      {/* Dados do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_make">Marca</Label>
              <Input
                id="vehicle_make"
                value={vehicleForm.vehicle_make}
                onChange={(e) => setVehicleForm({...vehicleForm, vehicle_make: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_model">Modelo</Label>
              <Input
                id="vehicle_model"
                value={vehicleForm.vehicle_model}
                onChange={(e) => setVehicleForm({...vehicleForm, vehicle_model: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_year">Ano</Label>
              <Input
                id="vehicle_year"
                type="number"
                value={vehicleForm.vehicle_year}
                onChange={(e) => setVehicleForm({...vehicleForm, vehicle_year: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_plate">Placa</Label>
              <Input
                id="vehicle_plate"
                value={vehicleForm.vehicle_plate}
                onChange={(e) => setVehicleForm({...vehicleForm, vehicle_plate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="vehicle_color">Cor</Label>
              <Input
                id="vehicle_color"
                value={vehicleForm.vehicle_color}
                onChange={(e) => setVehicleForm({...vehicleForm, vehicle_color: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="custom_price_per_km">Preço Por KM (Personalizado)</Label>
              <Input
                id="custom_price_per_km"
                type="number"
                step="0.01"
                value={vehicleForm.custom_price_per_km}
                onChange={(e) => setVehicleForm({...vehicleForm, custom_price_per_km: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="has_accessibility"
              checked={vehicleForm.has_accessibility}
              onCheckedChange={(checked) => setVehicleForm({...vehicleForm, has_accessibility: checked})}
            />
            <Label htmlFor="has_accessibility">Veículo Acessível</Label>
          </div>

          <Button onClick={saveVehicle} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Dados do Veículo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverSettings;
