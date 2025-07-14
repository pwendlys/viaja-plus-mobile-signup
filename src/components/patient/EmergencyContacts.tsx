
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Plus, Trash2, Share, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmergencyContacts = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  useEffect(() => {
    fetchContacts();

    // Get current location for sharing
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log('Erro ao obter localização:', error)
      );
    }

    // Realtime subscription
    const channel = supabase
      .channel('emergency-contacts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_contacts'
      }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: contacts, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(contacts || []);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos de emergência.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          patient_id: user.id,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship || null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato de emergência adicionado com sucesso!",
      });

      setNewContact({ name: "", phone: "", relationship: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o contato.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato removido com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao remover contato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o contato.",
        variant: "destructive",
      });
    }
  };

  const shareLocationWhatsApp = (contact: any) => {
    if (!currentLocation) {
      toast({
        title: "Erro",
        description: "Localização não disponível. Tente obter sua localização primeiro.",
        variant: "destructive",
      });
      return;
    }

    const message = `🚨 EMERGÊNCIA - Compartilhando minha localização atual:
    
📍 Localização: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}
    
Por favor, me ajude se necessário!`;
    
    const phoneNumber = contact.phone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Localização Compartilhada",
      description: `Localização enviada para ${contact.name} via WhatsApp!`,
    });
  };

  if (loading) {
    return <div className="text-center py-6">Carregando contatos...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Contatos de Emergência
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Contato de Emergência</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nome do contato"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relacionamento</Label>
                <Select value={newContact.relationship} onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o relacionamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familiar">Familiar</SelectItem>
                    <SelectItem value="amigo">Amigo</SelectItem>
                    <SelectItem value="cuidador">Cuidador</SelectItem>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhum contato de emergência cadastrado.</p>
            <p className="text-sm">Adicione contatos para situações de emergência!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                    {contact.relationship && (
                      <p className="text-xs text-gray-500 capitalize">{contact.relationship}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareLocationWhatsApp(contact)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {contacts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Clique no ícone do WhatsApp para compartilhar sua localização atual em caso de emergência.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyContacts;
