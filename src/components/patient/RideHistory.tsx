
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { History, Star, MapPin, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const RideHistory = () => {
  const { toast } = useToast();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

  useEffect(() => {
    fetchRideHistory();

    // Realtime subscription
    const channel = supabase
      .channel('rides-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, () => {
        fetchRideHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRideHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id(full_name, phone),
          rating:rating_id(rating, comment)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(rides || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de corridas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async () => {
    if (!selectedRide || rating === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create rating
      const { data: ratingData, error: ratingError } = await supabase
        .from('driver_ratings')
        .insert({
          ride_id: selectedRide.id,
          patient_id: user.id,
          driver_id: selectedRide.driver_id,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (ratingError) throw ratingError;

      // Update ride with rating_id
      const { error: updateError } = await supabase
        .from('rides')
        .update({ rating_id: ratingData.id })
        .eq('id', selectedRide.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Avaliação enviada com sucesso!",
      });

      setRating(0);
      setComment("");
      setIsRatingDialogOpen(false);
      setSelectedRide(null);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a avaliação.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Aceita</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">Em Andamento</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Concluída</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'scheduled':
        return <Badge className="bg-purple-100 text-purple-800">Agendada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const StarRating = ({ rating, onRatingChange, readOnly = false }: any) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => !readOnly && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-6">Carregando histórico...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Corridas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rides.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma corrida encontrada.</p>
            <p className="text-sm">Suas corridas aparecerão aqui!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(ride.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="font-medium">{ride.pickup_address}</p>
                    <p className="text-sm text-gray-600">→ {ride.destination_address}</p>
                    
                    {ride.driver && (
                      <div className="flex items-center gap-2 mt-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-600">
                          Motorista: {ride.driver.full_name}
                        </span>
                      </div>
                    )}

                    {ride.scheduled_for && (
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-600">
                          Agendada para: {format(new Date(ride.scheduled_for), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}

                    {ride.rating && (
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={ride.rating.rating} readOnly />
                        {ride.rating.comment && (
                          <span className="text-sm text-gray-600">"{ride.rating.comment}"</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(ride.status)}
                    
                    {ride.status === 'completed' && !ride.rating && (
                      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRide(ride)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Avaliar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Avaliar Motorista</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Sua avaliação:</Label>
                              <div className="mt-2">
                                <StarRating rating={rating} onRatingChange={setRating} />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="comment">Comentário (opcional):</Label>
                              <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Deixe um comentário sobre sua experiência..."
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleRating} disabled={rating === 0}>
                                Enviar Avaliação
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RideHistory;
