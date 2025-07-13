
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomeScreen from "./pages/WelcomeScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterChoice from "./pages/RegisterChoice";
import PatientRegister from "./pages/PatientRegister";
import DriverRegister from "./pages/DriverRegister";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import PatientManagement from "./pages/admin/PatientManagement";
import DriverManagement from "./pages/admin/DriverManagement";
import RideManagement from "./pages/admin/RideManagement";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterChoice />} />
          <Route path="/register/patient" element={<PatientRegister />} />
          <Route path="/register/driver" element={<DriverRegister />} />
          <Route path="/success" element={<RegistrationSuccess />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<PatientManagement />} />
            <Route path="drivers" element={<DriverManagement />} />
            <Route path="rides" element={<RideManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
