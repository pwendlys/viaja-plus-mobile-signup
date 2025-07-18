
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CancellationRequest {
  id: string;
  ride_id: string;
  requested_by: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  response_reason?: string;
  responded_by?: string;
  requested_at: string;
  responded_at?: string;
}

export const useRideCancellation = (rideId?: string) => {
  const { toast } = useToast();
  const [cancellationRequest, setCancellationRequest] = useState<CancellationRequest | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar solicitação de cancelamento existente
  const fetchCancellationRequest = async () => {
    if (!rideId) return;

    try {
      const { data, error } = await supabase
        .from('ride_cancellation_requests')
        .select('*')
        .eq('ride_id', rideId)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCancellationRequest(data);
    } catch (error) {
      console.error('Erro ao buscar solicitação de cancelamento:', error);
    }
  };

  // Criar solicitação de cancelamento
  const requestCancellation = async (reason: string) => {
    if (!rideId) return false;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ride_cancellation_requests')
        .insert({
          ride_id: rideId,
          requested_by: user.id,
          reason: reason,
        })
        .select()
        .single();

      if (error) throw error;

      setCancellationRequest(data);
      toast({
        title: "Solicitação Enviada",
        description: "Sua solicitação de cancelamento foi enviada ao motorista.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao solicitar cancelamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de cancelamento.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Responder a solicitação de cancelamento (para motoristas)
  const respondToCancellation = async (approve: boolean, responseReason?: string) => {
    if (!cancellationRequest) return false;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('ride_cancellation_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          response_reason: responseReason,
          responded_by: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', cancellationRequest.id);

      if (error) throw error;

      // Se aprovado, cancelar a corrida
      if (approve) {
        await supabase
          .from('rides')
          .update({ status: 'cancelled' })
          .eq('id', rideId);
      }

      await fetchCancellationRequest();

      toast({
        title: approve ? "Cancelamento Aprovado" : "Cancelamento Rejeitado",
        description: approve 
          ? "A corrida foi cancelada com sucesso." 
          : "A solicitação de cancelamento foi rejeitada.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao responder cancelamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a resposta.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rideId) {
      fetchCancellationRequest();

      // Escutar atualizações em tempo real
      const subscription = supabase
        .channel(`cancellation-${rideId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ride_cancellation_requests',
          filter: `ride_id=eq.${rideId}`
        }, () => {
          fetchCancellationRequest();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [rideId]);

  return {
    cancellationRequest,
    loading,
    requestCancellation,
    respondToCancellation,
    fetchCancellationRequest
  };
};
