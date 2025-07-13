import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  MapPin, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface AdminSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isMobile = false, isOpen = false, onClose }: AdminSidebarProps) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard"
    },
    {
      title: "Pacientes",
      icon: Users,
      path: "/admin/patients"
    },
    {
      title: "Motoristas",
      icon: Car,
      path: "/admin/drivers"
    },
    {
      title: "Corridas",
      icon: MapPin,
      path: "/admin/rides"
    },
    {
      title: "Configurações",
      icon: SettingsIcon,
      path: "/admin/settings"
    }
  ];

  const handleLogout = () => {
    navigate("/");
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="bg-viaja-gradient text-white px-3 py-2 rounded-lg font-bold">
              Viaja+ Admin
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={getNavLinkClass}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b">
        <div className="bg-viaja-gradient text-white px-3 py-2 rounded-lg font-bold">
          Viaja+ Admin
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={getNavLinkClass}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;