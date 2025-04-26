import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import Logo from "../ui/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  BellIcon, 
  LayoutDashboardIcon, 
  ListChecksIcon, 
  HardHatIcon, 
  BuildingIcon, 
  PackageIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PMLayoutProps {
  children: ReactNode;
}

const PMLayout: React.FC<PMLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get unread notifications
  const { data: unreadNotifications } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications/unread/count');
        if (!response.ok) return { count: 0 };
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
        return { count: 0 };
      }
    },
    staleTime: 60000, // 1 minute
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    { name: "Dashboard", href: "/pm/dashboard", icon: <LayoutDashboardIcon className="h-5 w-5" /> },
    { name: "Order Approvals", href: "/pm/approvals", icon: <ListChecksIcon className="h-5 w-5" /> },
    { name: "Job Management", href: "/pm/jobs", icon: <BuildingIcon className="h-5 w-5" /> },
    { name: "Parts Catalog", href: "/pm/parts", icon: <PackageIcon className="h-5 w-5" /> },
    { name: "Tradie Management", href: "/pm/tradies", icon: <HardHatIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md fixed top-0 left-0 right-0 z-10 h-16 md:h-20">
        <div className="flex items-center justify-between w-full mx-auto px-4">
          <div className="flex items-center">
            <button
              type="button"
              className="mr-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
            <div className="mr-3">
              <Logo size={40} className="text-white" />
            </div>
            <h1 className="text-xl font-bold hidden md:block">Project Manager Portal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white relative">
                  <BellIcon className="h-5 w-5" />
                  {unreadNotifications && unreadNotifications.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-secondary text-white h-5 w-5 flex items-center justify-center p-0">
                      {unreadNotifications.count > 9 ? '9+' : unreadNotifications.count}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/pm/notifications" className="w-full">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="hidden md:flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="ml-2 text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs bg-red-600 hover:bg-red-700 text-white border-none" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden pt-16">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      location === item.href
                        ? 'bg-primary-foreground text-white'
                        : 'text-neutral-300 hover:bg-primary-foreground/10 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <div className="flex-1 flex flex-col min-h-0 bg-primary pt-20">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    location === item.href
                      ? 'bg-primary-foreground text-white'
                      : 'text-neutral-300 hover:bg-primary-foreground/10 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="md:pl-64 pt-20 flex-1">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PMLayout;