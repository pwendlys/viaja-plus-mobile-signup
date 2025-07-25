
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginScreen from "./pages/LoginScreen";
import RegisterChoice from "./pages/RegisterChoice";
import PatientRegister from "./pages/PatientRegister";
import DriverRegister from "./pages/DriverRegister";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import RegistrationStatus from "./pages/RegistrationStatus";
import WelcomeScreen from "./pages/WelcomeScreen";
import PatientDashboard from "./pages/PatientDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import PatientManagement from "./pages/admin/PatientManagement";
import DriverManagement from "./pages/admin/DriverManagement";
import RideManagement from "./pages/admin/RideManagement";
import PricingManagement from "./pages/admin/PricingManagement";
import PaymentHistory from "./pages/admin/PaymentHistory";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterChoice />} />
            <Route path="/register/patient" element={<PatientRegister />} />
            <Route path="/register/driver" element={<DriverRegister />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/registration-status" element={<RegistrationStatus />} />
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/driver" element={<DriverDashboard />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients" element={<PatientManagement />} />
              <Route path="drivers" element={<DriverManagement />} />
              <Route path="rides" element={<RideManagement />} />
              <Route path="pricing" element={<PricingManagement />} />
              <Route path="payments" element={<PaymentHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
