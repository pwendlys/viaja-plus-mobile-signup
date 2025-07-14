
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus, Trash2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PatientFavorites = () => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFavorite, setNewFavorite] = useState({
    name: "",
    address: "",
  });

  useEffect(() => {
    fetchFavorites();

    // Realtime subscription
    const channel = supabase
      .channel('patient-favorites-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'patient_favorites'
      }, () => {
        fetchFavorites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites, error } = await supabase
        .from('patient_favorites')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(favorites || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os favoritos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFavorite.name || !newFavorite.address) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('patient_favorites')
        .insert({
          patient_id: user.id,
          name: newFavorite.name,
          address: newFavorite.address,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Favorito adicionado com sucesso!",
      });

      setNewFavorite({ name: "", address: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o favorito.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patient_favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Favorito removido com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o favorito.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-6">Carregando favoritos...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Meus Endereços Favoritos
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
              <DialogTitle>Adicionar Endereço Favorito</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddFavorite} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Local</Label>
                <Input
                  id="name"
                  value={newFavorite.name}
                  onChange={(e) => setNewFavorite({ ...newFavorite, name: e.target.value })}
                  placeholder="Ex: Casa, Trabalho, Hospital..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newFavorite.address}
                  onChange={(e) => setNewFavorite({ ...newFavorite, address: e.target.value })}
                  placeholder="Endereço completo"
                  required
                />
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
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhum endereço favorito cadastrado.</p>
            <p className="text-sm">Adicione locais que você visita frequentemente!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{favorite.name}</p>
                    <p className="text-sm text-gray-600">{favorite.address}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFavorite(favorite.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientFavorites;
