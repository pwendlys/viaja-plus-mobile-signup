
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  MapPin, 
  Settings,
  DollarSign,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isMobile = false, isOpen = false, onClose }: AdminSidebarProps) => {
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Pacientes",
      href: "/admin/patients",
      icon: Users,
    },
    {
      name: "Motoristas",
      href: "/admin/drivers",
      icon: Car,
    },
    {
      name: "Corridas",
      href: "/admin/rides",
      icon: MapPin,
    },
    {
      name: "Preços por KM",
      href: "/admin/pricing",
      icon: DollarSign,
    },
    {
      name: "Configurações",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  if (isMobile) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        isOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Admin Panel
            </h1>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col p-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:text-primary hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Admin Panel
          </h1>
        </div>
        <nav className="flex flex-1 flex-col p-4">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
