
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: 'patient' | 'driver';
  message: string;
  created_at: string;
}

export const useRideChat = (rideId?: string) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar mensagens existentes
  const fetchMessages = async () => {
    if (!rideId) return;

    try {
      const { data, error } = await supabase
        .from('ride_chat_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async (message: string, senderType: 'patient' | 'driver') => {
    if (!rideId || !message.trim()) return false;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('ride_chat_messages')
        .insert({
          ride_id: rideId,
          sender_id: user.id,
          sender_type: senderType,
          message: message.trim(),
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rideId) {
      fetchMessages();

      // Escutar novas mensagens em tempo real
      const subscription = supabase
        .channel(`chat-${rideId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_chat_messages',
          filter: `ride_id=eq.${rideId}`
        }, (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [rideId]);

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages
  };
};
