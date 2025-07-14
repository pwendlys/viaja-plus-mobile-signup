
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Car, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PricingManagement = () => {
  const { toast } = useToast();
  const [kmPricing, setKmPricing] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");

  // Fetch pricing data
  const fetchPricing = async () => {
    try {
      const { data: pricingData, error: pricingError } = await supabase
        .from('km_pricing')
        .select('*')
        .order('car_type');

      if (pricingError) throw pricingError;
      setKmPricing(pricingData || []);

      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select(`
          *,
          drivers(*)
        `)
        .eq('user_type', 'driver')
        .eq('status', 'approved')
        .order('full_name');

      if (driversError) throw driversError;
      setDrivers(driversData || []);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        title: "Erro ao carregar preços",
        description: "Não foi possível carregar os dados de preços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();

    // Set up real-time subscription
    const channel = supabase
      .channel('pricing-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'km_pricing'
      }, () => {
        fetchPricing();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drivers'
      }, () => {
        fetchPricing();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateKmPrice = async (priceId: string, newPriceValue: string) => {
    try {
      const { error } = await supabase
        .from('km_pricing')
        .update({ price_per_km: parseFloat(newPriceValue) })
        .eq('id', priceId);

      if (error) throw error;

      toast({
        title: "Preço atualizado",
        description: "O valor por KM foi atualizado com sucesso.",
      });
      
      setEditingPrice(null);
      setNewPrice("");
      fetchPricing();
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço.",
        variant: "destructive",
      });
    }
  };

  const updateDriverPrice = async (driverId: string, customPrice: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          custom_price_per_km: customPrice ? parseFloat(customPrice) : null 
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Preço personalizado atualizado",
        description: "O valor personalizado do motorista foi atualizado.",
      });
      
      setEditingDriver(null);
      setNewPrice("");
      fetchPricing();
    } catch (error) {
      console.error('Error updating driver price:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço do motorista.",
        variant: "destructive",
      });
    }
  };

  const updateDriverAccessibility = async (driverId: string, hasAccessibility: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ has_accessibility: hasAccessibility })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Acessibilidade atualizada",
        description: "A configuração de acessibilidade foi atualizada.",
      });
      
      fetchPricing();
    } catch (error) {
      console.error('Error updating accessibility:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a acessibilidade.",
        variant: "destructive",
      });
    }
  };

  const getCarTypeLabel = (carType: string) => {
    return carType === 'common' ? 'Carro Comum' : 'Carro com Acessibilidade';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando preços...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Preços por KM</h1>
        <p className="text-gray-600">Configure os valores por quilômetro para diferentes tipos de veículos</p>
      </div>

      {/* Preços Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preços Padrão por Tipo de Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {kmPricing.map((price) => (
              <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{getCarTypeLabel(price.car_type)}</h3>
                  <p className="text-sm text-gray-600">
                    Valor padrão por quilômetro
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingPrice === price.id ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span>R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-20"
                          placeholder={price.price_per_km.toString()}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => updateKmPrice(price.id, newPrice)}
                        disabled={!newPrice}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPrice(null);
                          setNewPrice("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-lg">
                        R$ {price.price_per_km.toFixed(2)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPrice(price.id);
                          setNewPrice(price.price_per_km.toString());
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preços por Motorista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Preços Personalizados por Motorista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {drivers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum motorista aprovado encontrado.
              </p>
            ) : (
              drivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{driver.full_name}</h3>
                    <p className="text-sm text-gray-600">
                      {driver.drivers?.[0] && (
                        `${driver.drivers[0].vehicle_make} ${driver.drivers[0].vehicle_model} - ${driver.drivers[0].vehicle_plate}`
                      )}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Acessibilidade:</Label>
                        <Switch
                          checked={driver.drivers?.[0]?.has_accessibility || false}
                          onCheckedChange={(checked) => 
                            updateDriverAccessibility(driver.drivers[0].id, checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingDriver === driver.id ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span>R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-20"
                            placeholder="Padrão"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => updateDriverPrice(driver.drivers[0].id, newPrice)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDriver(null);
                            setNewPrice("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant={driver.drivers?.[0]?.custom_price_per_km ? "default" : "secondary"}>
                          {driver.drivers?.[0]?.custom_price_per_km 
                            ? `R$ ${driver.drivers[0].custom_price_per_km.toFixed(2)}`
                            : "Preço Padrão"
                          }
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDriver(driver.id);
                            setNewPrice(driver.drivers?.[0]?.custom_price_per_km?.toString() || "");
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingManagement;
