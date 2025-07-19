
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useRideCancellation } from '@/hooks/useRideCancellation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RideChatDialog from './RideChatDialog';

interface RideCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ride: {
    id: string;
    status: string;
    pickup_address: string;
    destination_address: string;
    driver_id?: string | null;
    driver?: {
      full_name: string;
    } | null;
  };
  onRideCancelled: () => void;
}

const RideCancellationDialog: React.FC<RideCancellationDialogProps> = ({
  isOpen,
  onClose,
  ride,
  onRideCancelled
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const { cancellationRequest, requestCancellation } = useRideCancellation(ride.id);

  // Debug: verificar os dados da corrida
  console.log('Ride data:', {
    id: ride.id,
    status: ride.status,
    driver_id: ride.driver_id,
    driver: ride.driver,
    hasDriver: !!ride.driver_id || !!ride.driver
  });

  const handleRequestCancellation = async () => {
    if (!reason.trim()) return;

    setLoading(true);

    try {
      // Verificação mais robusta: corrida pendente E sem motorista (driver_id null/undefined OU driver null/undefined)
      const hasNoDriver = !ride.driver_id && (!ride.driver || ride.driver === null);
      const isPending = ride.status === 'pending';
      
      console.log('Cancellation check:', {
        isPending,
        hasNoDriver,
        driver_id: ride.driver_id,
        driver: ride.driver,
        shouldCancelDirectly: isPending && hasNoDriver
      });

      if (isPending && hasNoDriver) {
        console.log('Canceling ride directly...');
        
        const { error } = await supabase
          .from('rides')
          .update({ status: 'cancelled' })
          .eq('id', ride.id);

        if (error) {
          console.error('Error canceling ride:', error);
          throw error;
        }

        console.log('Ride canceled successfully');
        
        toast({
          title: "Corrida Cancelada",
          description: "Sua corrida foi cancelada com sucesso.",
        });

        onRideCancelled();
        onClose();
        return;
      }

      // Se tem motorista, usar o sistema de solicitação
      console.log('Using cancellation request system...');
      const success = await requestCancellation(reason);
      if (success) {
        setReason('');
        if (ride.status === 'accepted' || ride.status === 'in_progress') {
          setShowChat(true);
        }
      }
    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a corrida.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChatClose = () => {
    setShowChat(false);
    if (cancellationRequest?.status === 'approved') {
      onRideCancelled();
      onClose();
    }
  };

  // Verificação mais robusta para cancelamento direto
  const canCancelDirectly = ride.status === 'pending' && (!ride.driver_id && (!ride.driver || ride.driver === null));
  const needsDriverApproval = (ride.status === 'accepted' || ride.status === 'in_progress') && (ride.driver_id || ride.driver);

  return (
    <>
      <Dialog open={isOpen && !showChat} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Cancelar Corrida
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Corrida:</p>
              <p className="text-sm text-gray-600">{ride.pickup_address}</p>
              <p className="text-sm text-gray-600">→ {ride.destination_address}</p>
              {ride.driver && (
                <p className="text-sm text-blue-600 mt-1">
                  Motorista: {ride.driver.full_name}
                </p>
              )}
            </div>

            {cancellationRequest ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status da Solicitação:</span>
                  <Badge 
                    className={
                      cancellationRequest.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : cancellationRequest.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {cancellationRequest.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {cancellationRequest.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                    {cancellationRequest.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {cancellationRequest.status === 'approved' ? 'Aprovada' :
                     cancellationRequest.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                  </Badge>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Seu motivo:</p>
                  <p className="text-sm text-gray-600">{cancellationRequest.reason}</p>
                </div>

                {cancellationRequest.response_reason && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Resposta do motorista:</p>
                    <p className="text-sm text-gray-600">{cancellationRequest.response_reason}</p>
                  </div>
                )}

                {cancellationRequest.status === 'pending' && needsDriverApproval && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowChat(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversar
                    </Button>
                  </div>
                )}

                {cancellationRequest.status === 'approved' && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ Cancelamento aprovado! A corrida foi cancelada.
                    </p>
                  </div>
                )}

                {cancellationRequest.status === 'rejected' && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      ✗ Cancelamento rejeitado. A corrida continua ativa.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Motivo do cancelamento:
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explique o motivo do cancelamento..."
                    rows={3}
                  />
                </div>

                {canCancelDirectly && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Como a corrida ainda não foi aceita por um motorista, ela será cancelada imediatamente.
                    </p>
                  </div>
                )}

                {needsDriverApproval && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Como a corrida já foi aceita, o motorista precisa aprovar o cancelamento. 
                      Você poderá conversar com ele através do chat.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleRequestCancellation}
                    disabled={!reason.trim() || loading}
                    className="flex-1"
                  >
                    {loading ? 'Cancelando...' : canCancelDirectly ? 'Cancelar Corrida' : 'Solicitar Cancelamento'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showChat && (
        <RideChatDialog
          isOpen={showChat}
          onClose={handleChatClose}
          rideId={ride.id}
          userType="patient"
          driverName={ride.driver?.full_name}
        />
      )}
    </>
  );
};

export default RideCancellationDialog;
