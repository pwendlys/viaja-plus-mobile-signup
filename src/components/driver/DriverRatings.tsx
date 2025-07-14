
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverRatingsProps {
  driverId: string;
}

const DriverRatings = ({ driverId }: DriverRatingsProps) => {
  const { toast } = useToast();
  const [receivedRatings, setReceivedRatings] = useState<any[]>([]);
  const [completedRides, setCompletedRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
    fetchCompletedRides();
  }, [driverId]);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_ratings')
        .select(`
          *,
          patient:patient_id(full_name),
          ride:ride_id(pickup_address, destination_address)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceivedRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchCompletedRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          patient:patient_id(full_name),
          patient_rating:patient_ratings(rating, comment)
        `)
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .is('rating_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompletedRides(data || []);
    } catch (error) {
      console.error('Error fetching completed rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const ratePatient = async (rideId: string, patientId: string, rating: number, comment: string) => {
    try {
      const { error } = await supabase
        .from('patient_ratings')
        .insert({
          ride_id: rideId,
          driver_id: driverId,
          patient_id: patientId,
          rating,
          comment
        });

      if (error) throw error;

      toast({
        title: "Avaliação Enviada",
        description: "Sua avaliação foi enviada com sucesso!",
      });

      fetchCompletedRides();
    } catch (error) {
      console.error('Error rating patient:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a avaliação.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const RatePatientCard = ({ ride }: { ride: any }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
      if (rating === 0) {
        toast({
          title: "Avaliação necessária",
          description: "Por favor, selecione uma avaliação de 1 a 5 estrelas.",
          variant: "destructive",
        });
        return;
      }

      ratePatient(ride.id, ride.patient_id, rating, comment);
    };

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Avaliar Paciente: {ride.patient?.full_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Corrida: {ride.pickup_address} → {ride.destination_address}
            </p>
            <p className="text-sm text-gray-600">
              Data: {new Date(ride.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Avaliação:</p>
            {renderStars(rating, true, setRating)}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Comentário (opcional):</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deixe um comentário sobre o paciente..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Carregando avaliações...</div>
      </div>
    );
  }

  const averageRating = receivedRatings.length > 0 
    ? receivedRatings.reduce((sum, rating) => sum + rating.rating, 0) / receivedRatings.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Média Geral</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                {renderStars(Math.round(averageRating))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total de Avaliações</p>
              <p className="text-2xl font-bold">{receivedRatings.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Corridas Pendentes</p>
              <p className="text-2xl font-bold">{completedRides.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avaliar Pacientes */}
      {completedRides.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Avaliar Pacientes</h2>
          <div className="space-y-4">
            {completedRides.map((ride) => (
              <RatePatientCard key={ride.id} ride={ride} />
            ))}
          </div>
        </div>
      )}

      {/* Avaliações Recebidas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Avaliações Recebidas</h2>
        {receivedRatings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Você ainda não recebeu avaliações.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {receivedRatings.map((rating) => (
              <Card key={rating.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{rating.patient?.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(rating.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {renderStars(rating.rating)}
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-600 italic">"{rating.comment}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Corrida: {rating.ride?.pickup_address} → {rating.ride?.destination_address}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRatings;
