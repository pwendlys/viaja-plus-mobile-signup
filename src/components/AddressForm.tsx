
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface AddressFormProps {
  address: AddressData;
  onAddressChange: (address: AddressData) => void;
}

const AddressForm = ({ address, onAddressChange }: AddressFormProps) => {
  const [loading, setLoading] = useState(false);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    onAddressChange({ ...address, cep: cleanCep });

    if (cleanCep.length === 8) {
      setLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          onAddressChange({
            ...address,
            cep: cleanCep,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || ""
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <Input
            id="cep"
            placeholder="00000-000"
            value={formatCep(address.cep)}
            onChange={(e) => handleCepChange(e.target.value)}
            maxLength={9}
            className="h-12 rounded-lg"
            required
          />
          {loading && <p className="text-sm text-gray-500">Buscando endereço...</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            placeholder="123"
            value={address.number}
            onChange={(e) => onAddressChange({ ...address, number: e.target.value })}
            className="h-12 rounded-lg"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Logradouro *</Label>
        <Input
          id="street"
          placeholder="Rua, Avenida, etc."
          value={address.street}
          onChange={(e) => onAddressChange({ ...address, street: e.target.value })}
          className="h-12 rounded-lg"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          placeholder="Apartamento, casa, etc."
          value={address.complement}
          onChange={(e) => onAddressChange({ ...address, complement: e.target.value })}
          className="h-12 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro *</Label>
        <Input
          id="neighborhood"
          placeholder="Nome do bairro"
          value={address.neighborhood}
          onChange={(e) => onAddressChange({ ...address, neighborhood: e.target.value })}
          className="h-12 rounded-lg"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            placeholder="Nome da cidade"
            value={address.city}
            onChange={(e) => onAddressChange({ ...address, city: e.target.value })}
            className="h-12 rounded-lg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF *</Label>
          <Input
            id="state"
            placeholder="MG"
            value={address.state}
            onChange={(e) => onAddressChange({ ...address, state: e.target.value.toUpperCase() })}
            maxLength={2}
            className="h-12 rounded-lg"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
