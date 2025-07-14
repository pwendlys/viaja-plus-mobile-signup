
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Car, MapPin, Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDrivers: 0,
    totalRides: 0,
    pendingPatients: 0,
    pendingDrivers: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
  });
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch patients stats
      const { data: patients, error: patientsError } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_type', 'patient');

      if (patientsError) throw patientsError;

      // Fetch drivers stats
      const { data: drivers, error: driversError } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_type', 'driver');

      if (driversError) throw driversError;

      // Fetch rides stats
      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('status, created_at, patient:patient_id(full_name), driver:driver_id(full_name), pickup_address, destination_address')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ridesError) throw ridesError;

      // Fetch all rides for stats
      const { data: allRides, error: allRidesError } = await supabase
        .from('rides')
        .select('status');

      if (allRidesError) throw allRidesError;

      // Fetch recent registrations
      const { data: recentUsers, error: recentUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentUsersError) throw recentUsersError;

      // Calculate stats
      const patientStats = patients?.reduce((acc, patient) => {
        if (patient.status === 'pending') acc.pending++;
        return acc;
      }, { pending: 0 }) || { pending: 0 };

      const driverStats = drivers?.reduce((acc, driver) => {
        if (driver.status === 'pending') acc.pending++;
        return acc;
      }, { pending: 0 }) || { pending: 0 };

      const rideStats = allRides?.reduce((acc, ride) => {
        switch (ride.status) {
          case 'in_progress':
            acc.active++;
            break;
          case 'completed':
            acc.completed++;
            break;
          case 'cancelled':
            acc.cancelled++;
            break;
        }
        return acc;
      }, { active: 0, completed: 0, cancelled: 0 }) || { active: 0, completed: 0, cancelled: 0 };

      setStats({
        totalPatients: patients?.length || 0,
        totalDrivers: drivers?.length || 0,
        totalRides: allRides?.length || 0,
        pendingPatients: patientStats.pending,
        pendingDrivers: driverStats.pending,
        activeRides: rideStats.active,
        completedRides: rideStats.completed,
        cancelledRides: rideStats.cancelled,
      });

      setRecentRides(rides || []);
      setRecentRegistrations(recentUsers || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const ridesChannel = supabase
      .channel('rides-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(ridesChannel);
    };
  }, []);

  const getStatusBadge = (status: string, type: 'user' | 'ride' = 'user') => {
    if (type === 'user') {
      switch (status) {
        case 'approved':
          return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
        case 'rejected':
          return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
        case 'pending':
        default:
          return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      }
    } else {
      switch (status) {
        case 'completed':
          return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
        case 'in_progress':
          return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
        case 'cancelled':
          return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
        case 'scheduled':
        default:
          return <Badge className="bg-yellow-100 text-yellow-800">Agendada</Badge>;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600">Visão geral do sistema de transporte médico</p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/patients')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.pendingPatients} pendentes de aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/drivers')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Motoristas</CardTitle>
            <Car className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalDrivers}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.pendingDrivers} pendentes de aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/rides')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Corridas</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalRides}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.activeRides} em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/pricing')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerenciar Preços</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$/KM</div>
            <p className="text-xs text-gray-600 mt-1">
              Valores por quilômetro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status das Corridas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridas Ativas</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeRides}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridas Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedRides}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridas Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledRides}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Corridas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Corridas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRides.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma corrida encontrada.</p>
              ) : (
                recentRides.map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{ride.patient?.full_name || 'Paciente não identificado'}</p>
                      <p className="text-sm text-gray-600">
                        {ride.pickup_address} → {ride.destination_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(ride.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(ride.status, 'ride')}
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentRides.length > 0 && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/rides')}
                >
                  Ver Todas as Corridas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cadastros Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRegistrations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum cadastro encontrado.</p>
              ) : (
                recentRegistrations.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        user.user_type === 'patient' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {user.user_type === 'patient' ? 
                          <Users className="w-4 h-4 text-blue-600" /> : 
                          <Car className="w-4 h-4 text-green-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-600 capitalize">{user.user_type === 'patient' ? 'Paciente' : 'Motorista'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/patients')}
              >
                Ver Pacientes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/drivers')}
              >
                Ver Motoristas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
