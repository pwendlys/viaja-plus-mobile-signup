
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Car } from 'lucide-react';
import { useRideChat } from '@/hooks/useRideChat';

interface RideChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  userType: 'patient' | 'driver';
  driverName?: string;
  patientName?: string;
}

const RideChatDialog: React.FC<RideChatDialogProps> = ({
  isOpen,
  onClose,
  rideId,
  userType,
  driverName,
  patientName
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useRideChat(rideId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const success = await sendMessage(newMessage, userType);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Chat - Cancelamento de Corrida</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Converse com {userType === 'patient' ? 'o motorista' : 'o paciente'} sobre o cancelamento
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender_type === userType ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender_type === userType
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {message.sender_type === 'driver' ? (
                      <Car className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className="text-xs opacity-75">
                      {message.sender_type === 'driver' 
                        ? (driverName || 'Motorista')
                        : (patientName || 'Paciente')
                      }
                    </span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                  <span className="text-xs opacity-50">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RideChatDialog;
