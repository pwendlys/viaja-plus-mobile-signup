
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CreditCard, Clock, AlertCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverFinancialProps {
  driverId: string;
}

const DriverFinancial = ({ driverId }: DriverFinancialProps) => {
  const { toast } = useToast();
  const [balance, setBalance] = useState<any>(null);
  const [bankData, setBankData] = useState<any>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [withdrawalSettings, setWithdrawalSettings] = useState<any>(null);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [loading, setLoading] = useState(true);

  // Formulário de dados bancários
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    agency: '',
    pix_key: '',
    pix_key_type: 'cpf'
  });

  useEffect(() => {
    fetchFinancialData();
  }, [driverId]);

  const fetchFinancialData = async () => {
    try {
      // Buscar saldo
      const { data: balanceData, error: balanceError } = await supabase
        .from('driver_balance')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      // Buscar dados bancários
      const { data: bankInfo, error: bankError } = await supabase
        .from('driver_bank_data')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (bankError && bankError.code !== 'PGRST116') {
        throw bankError;
      }

      // Buscar solicitações de saque
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;

      // Buscar configurações de saque
      const { data: settings, error: settingsError } = await supabase
        .from('withdrawal_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      setBalance(balanceData);
      setBankData(bankInfo);
      setWithdrawalRequests(withdrawals || []);
      setWithdrawalSettings(settings);

      if (bankInfo) {
        setBankForm({
          bank_name: bankInfo.bank_name || '',
          account_number: bankInfo.account_number || '',
          agency: bankInfo.agency || '',
          pix_key: bankInfo.pix_key || '',
          pix_key_type: bankInfo.pix_key_type || 'cpf'
        });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Erro ao carregar dados financeiros",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBankData = async () => {
    try {
      const { error } = await supabase
        .from('driver_bank_data')
        .upsert({
          driver_id: driverId,
          ...bankForm
        });

      if (error) throw error;

      toast({
        title: "Dados Bancários Salvos",
        description: "Seus dados bancários foram salvos com sucesso!",
      });

      fetchFinancialData();
    } catch (error) {
      console.error('Error saving bank data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados bancários.",
        variant: "destructive",
      });
    }
  };

  const requestWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }

    if (!balance || parseFloat(withdrawalAmount) > balance.available_balance) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado é maior que o saldo disponível.",
        variant: "destructive",
      });
      return;
    }

    if (!bankData) {
      toast({
        title: "Dados bancários necessários",
        description: "Por favor, cadastre seus dados bancários antes de solicitar um saque.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          driver_id: driverId,
          amount: parseFloat(withdrawalAmount)
        });

      if (error) throw error;

      toast({
        title: "Solicitação de Saque Enviada",
        description: "Sua solicitação de saque foi enviada para análise.",
      });

      setWithdrawalAmount("");
      setIsWithdrawalOpen(false);
      fetchFinancialData();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de saque.",
        variant: "destructive",
      });
    }
  };

  const isWithdrawalPeriodOpen = () => {
    if (!withdrawalSettings) return false;

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    return currentDate >= withdrawalSettings.start_date && 
           currentDate <= withdrawalSettings.end_date &&
           currentTime >= withdrawalSettings.start_time &&
           currentTime <= withdrawalSettings.end_time;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Carregando dados financeiros...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saldo Disponível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Saldo Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Saldo Disponível</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {balance?.available_balance?.toFixed(2) || '0,00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Ganho</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {balance?.total_earned?.toFixed(2) || '0,00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Sacado</p>
              <p className="text-2xl font-bold text-gray-600">
                R$ {balance?.total_withdrawn?.toFixed(2) || '0,00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Bancários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados Bancários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Nome do Banco</Label>
              <Input
                id="bank_name"
                value={bankForm.bank_name}
                onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value})}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            <div>
              <Label htmlFor="agency">Agência</Label>
              <Input
                id="agency"
                value={bankForm.agency}
                onChange={(e) => setBankForm({...bankForm, agency: e.target.value})}
                placeholder="Ex: 1234-5"
              />
            </div>
            <div>
              <Label htmlFor="account_number">Número da Conta</Label>
              <Input
                id="account_number"
                value={bankForm.account_number}
                onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
                placeholder="Ex: 12345-6"
              />
            </div>
            <div>
              <Label htmlFor="pix_key_type">Tipo da Chave PIX</Label>
              <Select value={bankForm.pix_key_type} onValueChange={(value) => setBankForm({...bankForm, pix_key_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={bankForm.pix_key}
                onChange={(e) => setBankForm({...bankForm, pix_key: e.target.value})}
                placeholder="Sua chave PIX"
              />
            </div>
          </div>
          <Button onClick={saveBankData} className="w-full">
            Salvar Dados Bancários
          </Button>
        </CardContent>
      </Card>

      {/* Solicitação de Saque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Solicitação de Saque
          </CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalSettings && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Período de Saque</span>
              </div>
              <p className="text-sm text-gray-600">
                Disponível de {new Date(withdrawalSettings.start_date).toLocaleDateString('pt-BR')} às {withdrawalSettings.start_time} 
                até {new Date(withdrawalSettings.end_date).toLocaleDateString('pt-BR')} às {withdrawalSettings.end_time}
              </p>
            </div>
          )}

          {isWithdrawalPeriodOpen() ? (
            <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">Solicitar Saque</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Saque</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdrawal_amount">Valor do Saque</Label>
                    <Input
                      id="withdrawal_amount"
                      type="number"
                      step="0.01"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0,00"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Saldo disponível: R$ {balance?.available_balance?.toFixed(2) || '0,00'}
                    </p>
                  </div>
                  <Button onClick={requestWithdrawal} className="w-full">
                    Confirmar Solicitação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-600">
                {withdrawalSettings ? 
                  `Saque disponível de ${new Date(withdrawalSettings.start_date).toLocaleDateString('pt-BR')} às ${withdrawalSettings.start_time} até ${new Date(withdrawalSettings.end_date).toLocaleDateString('pt-BR')} às ${withdrawalSettings.end_time} conforme regras administrativas.` :
                  'Período de saque não configurado pelo administrador.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Saques */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma solicitação de saque encontrada.</p>
          ) : (
            <div className="space-y-3">
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">R$ {request.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    {request.admin_notes && (
                      <p className="text-xs text-gray-500 mt-1">{request.admin_notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverFinancial;
