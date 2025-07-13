import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, MapPin, Clock, UserCheck, UserX, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDrivers: 0,
    totalRides: 0,
    pendingRegistrations: 0,
    approvedPatients: 0,
    rejectedPatients: 0,
    approvedDrivers: 0,
    rejectedDrivers: 0,
    ridesThisMonth: 0,
    activeRides: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch patients count
      const { count: totalPatients } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'patient');

      // Fetch drivers count
      const { count: totalDrivers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'driver');

      // Fetch rides count
      const { count: totalRides } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true });

      // Fetch pending registrations
      const { count: pendingRegistrations } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch approved/rejected counts
      const { count: approvedPatients } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'patient')
        .eq('status', 'approved');

      const { count: rejectedPatients } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'patient')
        .eq('status', 'rejected');

      const { count: approvedDrivers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'driver')
        .eq('status', 'approved');

      const { count: rejectedDrivers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'driver')
        .eq('status', 'rejected');

      setStats({
        totalPatients: totalPatients || 0,
        totalDrivers: totalDrivers || 0,
        totalRides: totalRides || 0,
        pendingRegistrations: pendingRegistrations || 0,
        approvedPatients: approvedPatients || 0,
        rejectedPatients: rejectedPatients || 0,
        approvedDrivers: approvedDrivers || 0,
        rejectedDrivers: rejectedDrivers || 0,
        ridesThisMonth: 0, // TODO: Add date filter
        activeRides: 0 // TODO: Add status filter
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema Viaja+</p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Cadastrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Motoristas Ativos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalDrivers}</div>
            <p className="text-xs text-muted-foreground">
              +3 novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Corridas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalRides}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ridesThisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cadastros Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status de Aprovações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pacientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Aprovados</span>
              </div>
              <span className="font-semibold text-green-600">{stats.approvedPatients}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Rejeitados</span>
              </div>
              <span className="font-semibold text-red-600">{stats.rejectedPatients}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Pendentes</span>
              </div>
              <span className="font-semibold text-orange-600">8</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Motoristas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Aprovados</span>
              </div>
              <span className="font-semibold text-green-600">{stats.approvedDrivers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Rejeitados</span>
              </div>
              <span className="font-semibold text-red-600">{stats.rejectedDrivers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Pendentes</span>
              </div>
              <span className="font-semibold text-orange-600">4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">09:30</span>
              <span>Novo cadastro de paciente: Maria Silva</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">08:15</span>
              <span>Motorista João Santos aprovado</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">07:45</span>
              <span>Corrida finalizada: Hospital Central → Casa</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">06:30</span>
              <span>Novo cadastro de motorista: Carlos Oliveira</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;