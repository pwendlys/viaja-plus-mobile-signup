import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, MapPin, Clock, UserCheck, UserX, CheckCircle, AlertCircle, XCircle } from "lucide-react";
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

      // Fetch approved/rejected counts for patients
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

      // Fetch approved/rejected counts for drivers
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando estatísticas...</div>
        </div>
      ) : (
        <>
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
                  Total de pacientes no sistema
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
                  Total de motoristas no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corridas Realizadas</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalRides}</div>
                <p className="text-xs text-muted-foreground">
                  Total de corridas no sistema
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

          {/* Status dos Pacientes e Motoristas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Status dos Pacientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Aprovados</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.approvedPatients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Rejeitados</span>
                  </div>
                  <span className="font-bold text-red-600">{stats.rejectedPatients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Pendentes</span>
                  </div>
                  <span className="font-bold text-orange-600">{stats.totalPatients - stats.approvedPatients - stats.rejectedPatients}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Status dos Motoristas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Aprovados</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.approvedDrivers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Rejeitados</span>
                  </div>
                  <span className="font-bold text-red-600">{stats.rejectedDrivers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Pendentes</span>
                  </div>
                  <span className="font-bold text-orange-600">{stats.totalDrivers - stats.approvedDrivers - stats.rejectedDrivers}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalPatients + stats.totalDrivers}</div>
                  <div className="text-sm text-blue-600">Total de Usuários</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.approvedPatients + stats.approvedDrivers}</div>
                  <div className="text-sm text-green-600">Usuários Aprovados</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingRegistrations}</div>
                  <div className="text-sm text-orange-600">Aguardando Aprovação</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;