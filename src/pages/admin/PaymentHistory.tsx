
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Search, DollarSign, Clock, CheckCircle, AlertTriangle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DriverPaymentData {
  id: string;
  full_name: string;
  email: string;
  balance: {
    available_balance: number;
    total_earned: number;
    total_withdrawn: number;
  } | null;
  bank_data: {
    bank_name: string;
    agency: string;
    account_number: string;
    pix_key: string;
    pix_key_type: string;
  } | null;
  withdrawal_requests: Array<{
    id: string;
    amount: number;
    status: string;
    requested_at: string;
    payment_due_date: string | null;
    payment_completed_at: string | null;
    payment_method: string | null;
    admin_notes: string | null;
  }>;
  ride_count: number;
  total_rides_value: number;
}

const PaymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<DriverPaymentData | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'mark_paid' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: paymentData, isLoading, refetch } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      // Buscar dados dos motoristas com saldo e dados bancários
      const { data: drivers, error: driversError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          driver_balance (
            available_balance,
            total_earned,
            total_withdrawn
          ),
          driver_bank_data (
            bank_name,
            agency,
            account_number,
            pix_key,
            pix_key_type
          ),
          withdrawal_requests (
            id,
            amount,
            status,
            requested_at,
            payment_due_date,
            payment_completed_at,
            payment_method,
            admin_notes
          )
        `)
        .eq('user_type', 'driver')
        .eq('status', 'approved');

      if (driversError) throw driversError;

      // Buscar estatísticas de corridas para cada motorista
      const driversWithStats = await Promise.all(
        drivers.map(async (driver) => {
          const { data: rideStats, error: rideError } = await supabase
            .from('rides')
            .select('actual_price')
            .eq('driver_id', driver.id)
            .eq('status', 'completed');

          if (rideError) throw rideError;

          const rideCount = rideStats.length;
          const totalRidesValue = rideStats.reduce((sum, ride) => sum + (ride.actual_price || 0), 0);

          return {
            ...driver,
            balance: driver.driver_balance?.[0] || null,
            bank_data: driver.driver_bank_data?.[0] || null,
            ride_count: rideCount,
            total_rides_value: totalRidesValue
          };
        })
      );

      return driversWithStats;
    }
  });

  const getStatusBadge = (status: string, dueDate?: string | null) => {
    const now = new Date();
    const due = dueDate ? new Date(dueDate) : null;
    const isOverdue = due && now > due;

    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      approved: { 
        label: isOverdue ? "Atrasado" : "Aprovado", 
        variant: isOverdue ? "destructive" as const : "default" as const, 
        icon: isOverdue ? AlertTriangle : CheckCircle 
      },
      completed: { label: "Pago", variant: "success" as const, icon: CheckCircle },
      rejected: { label: "Rejeitado", variant: "destructive" as const, icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setLoading(true);
    try {
      let updateData: any = {};

      switch (actionType) {
        case 'approve':
          updateData = { status: 'approved' };
          break;
        case 'reject':
          if (!adminNotes.trim()) {
            toast({
              title: "Erro",
              description: "Motivo da rejeição é obrigatório",
              variant: "destructive"
            });
            return;
          }
          updateData = { status: 'rejected', admin_notes: adminNotes };
          break;
        case 'mark_paid':
          if (!paymentMethod.trim()) {
            toast({
              title: "Erro", 
              description: "Método de pagamento é obrigatório",
              variant: "destructive"
            });
            return;
          }
          updateData = { 
            status: 'completed', 
            payment_method: paymentMethod,
            admin_notes: adminNotes
          };
          break;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Se foi aprovado, também atualizar o saldo do motorista
      if (actionType === 'mark_paid') {
        const { error: balanceError } = await supabase
          .from('driver_balance')
          .update({
            available_balance: selectedRequest.driver_balance - selectedRequest.amount,
            total_withdrawn: selectedRequest.total_withdrawn + selectedRequest.amount
          })
          .eq('driver_id', selectedRequest.driver_id);

        if (balanceError) throw balanceError;
      }

      toast({
        title: "Sucesso",
        description: `Solicitação ${actionType === 'approve' ? 'aprovada' : actionType === 'reject' ? 'rejeitada' : 'marcada como paga'} com sucesso`,
      });

      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
      setPaymentMethod("");
      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = paymentData?.filter(driver => {
    const matchesSearch = driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const hasRequestWithStatus = driver.withdrawal_requests.some(req => req.status === statusFilter);
    return matchesSearch && hasRequestWithStatus;
  }) || [];

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Pagamentos</h1>
          <p className="text-muted-foreground">Gerencie os pagamentos dos motoristas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar motorista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="completed">Pago</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Motoristas */}
      <div className="grid gap-6">
        {filteredData.map(driver => (
          <Card key={driver.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{driver.full_name}</CardTitle>
                  <p className="text-muted-foreground">{driver.email}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Detalhes do Motorista - {driver.full_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Resumo Financeiro */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">
                              R$ {(driver.balance?.available_balance || 0).toFixed(2)}
                            </div>
                            <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                              R$ {(driver.balance?.total_earned || 0).toFixed(2)}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Ganho</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{driver.ride_count}</div>
                            <p className="text-sm text-muted-foreground">Corridas Realizadas</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                              R$ {(driver.balance?.total_withdrawn || 0).toFixed(2)}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Sacado</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Dados Bancários */}
                      {driver.bank_data && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Dados Bancários</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium">Banco:</p>
                                <p>{driver.bank_data.bank_name}</p>
                              </div>
                              <div>
                                <p className="font-medium">Agência:</p>
                                <p>{driver.bank_data.agency}</p>
                              </div>
                              <div>
                                <p className="font-medium">Conta:</p>
                                <p>{driver.bank_data.account_number}</p>
                              </div>
                              <div>
                                <p className="font-medium">Chave PIX:</p>
                                <p>{driver.bank_data.pix_key} ({driver.bank_data.pix_key_type})</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Histórico de Solicitações */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Histórico de Solicitações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {driver.withdrawal_requests.length === 0 ? (
                            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
                          ) : (
                            <div className="space-y-4">
                              {driver.withdrawal_requests.map(request => {
                                const daysRemaining = getDaysRemaining(request.payment_due_date);
                                return (
                                  <div key={request.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-medium">R$ {request.amount.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Solicitado em {format(new Date(request.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </p>
                                      </div>
                                      {getStatusBadge(request.status, request.payment_due_date)}
                                    </div>
                                    
                                    {request.payment_due_date && request.status === 'approved' && (
                                      <div className="text-sm">
                                        <p className={`font-medium ${daysRemaining && daysRemaining < 0 ? 'text-red-600' : daysRemaining && daysRemaining <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                                          {daysRemaining && daysRemaining < 0 
                                            ? `Atrasado há ${Math.abs(daysRemaining)} dias`
                                            : daysRemaining === 0 
                                            ? 'Vence hoje'
                                            : `${daysRemaining} dias restantes`
                                          }
                                        </p>
                                        <p className="text-muted-foreground">
                                          Prazo: {format(new Date(request.payment_due_date), 'dd/MM/yyyy', { locale: ptBR })}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {request.admin_notes && (
                                      <div className="mt-2 p-2 bg-muted rounded">
                                        <p className="text-sm font-medium">Observações:</p>
                                        <p className="text-sm">{request.admin_notes}</p>
                                      </div>
                                    )}
                                    
                                    {request.status === 'pending' && (
                                      <div className="flex gap-2 mt-3">
                                        <Button 
                                          size="sm" 
                                          onClick={() => {
                                            setSelectedRequest(request);
                                            setActionType('approve');
                                          }}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Aprovar
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => {
                                            setSelectedRequest(request);
                                            setActionType('reject');
                                          }}
                                        >
                                          Rejeitar
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {request.status === 'approved' && (
                                      <div className="mt-3">
                                        <Button 
                                          size="sm"
                                          onClick={() => {
                                            setSelectedRequest(request);
                                            setActionType('mark_paid');
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          Marcar como Pago
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {(driver.balance?.available_balance || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ganho</p>
                  <p className="text-lg font-semibold">
                    R$ {(driver.balance?.total_earned || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Corridas</p>
                  <p className="text-lg font-semibold">{driver.ride_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solicitações</p>
                  <p className="text-lg font-semibold">{driver.withdrawal_requests.length}</p>
                </div>
              </div>

              {/* Últimas solicitações */}
              {driver.withdrawal_requests.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Últimas Solicitações:</p>
                  <div className="flex flex-wrap gap-2">
                    {driver.withdrawal_requests.slice(0, 3).map(request => (
                      <div key={request.id} className="flex items-center gap-2 text-sm">
                        <span>R$ {request.amount.toFixed(2)}</span>
                        {getStatusBadge(request.status, request.payment_due_date)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Ação */}
      <Dialog open={!!actionType} onOpenChange={() => {
        setActionType(null);
        setSelectedRequest(null);
        setAdminNotes("");
        setPaymentMethod("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Aprovar Solicitação'}
              {actionType === 'reject' && 'Rejeitar Solicitação'}
              {actionType === 'mark_paid' && 'Marcar como Pago'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-muted rounded">
                <p><strong>Valor:</strong> R$ {selectedRequest.amount?.toFixed(2)}</p>
                <p><strong>Data da Solicitação:</strong> {selectedRequest.requested_at && format(new Date(selectedRequest.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
            )}
            
            {actionType === 'reject' && (
              <div>
                <label className="text-sm font-medium">Motivo da Rejeição *</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  className="mt-1"
                />
              </div>
            )}
            
            {actionType === 'mark_paid' && (
              <>
                <div>
                  <label className="text-sm font-medium">Método de Pagamento *</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="ted">TED</SelectItem>
                      <SelectItem value="doc">DOC</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Observações adicionais..."
                    className="mt-1"
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setActionType(null);
                  setSelectedRequest(null);
                  setAdminNotes("");
                  setPaymentMethod("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAction} disabled={loading}>
                {loading ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentHistory;
