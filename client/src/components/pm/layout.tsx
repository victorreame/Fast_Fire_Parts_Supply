import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link, useRoute } from "wouter";
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
  const [location, navigate] = useLocation();
  const { user, logoutMutation, refetchUser } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Effect to check authentication status when component mounts and on window focus
  useEffect(() => {
    // Function to validate auth
    const validateAuth = async () => {
      try {
        const currentUser = await refetchUser();
        if (!currentUser || currentUser.role !== 'project_manager') {
          toast({
            title: "Authentication Error",
            description: "Your session has expired or you're not authorized. Please log in again.",
            variant: "destructive",
          });
          // Redirect to login
          window.location.replace("/login");
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        // On error, redirect to login
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        window.location.replace("/login");
      }
    };
    
    // Validate on mount
    validateAuth();
    
    // Set up event listener for when window regains focus
    const handleFocus = () => validateAuth();
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchUser, toast, navigate]);

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
      <header className="bg-primary text-white shadow-md fixed top-0 left-0 right-0 z-20 h-16 md:h-20">
        <div className="flex items-center justify-between h-full max-w-full mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
            <div className="flex items-center gap-3">
              <Logo size={40} linkTo="/pm/dashboard" />
              <div className="flex flex-col md:flex-row md:items-center">
                <h1 className="text-lg font-bold hidden md:block whitespace-nowrap">Fast Fire Parts</h1>
                <span className="hidden md:block text-xs text-white/70 md:ml-3 whitespace-nowrap">Project Manager Portal</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white relative focus:outline-none focus:ring-2 focus:ring-white/30">
                  <BellIcon className="h-5 w-5" />
                  {unreadNotifications && unreadNotifications.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-secondary text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadNotifications.count > 9 ? '9+' : unreadNotifications.count}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/pm/notifications" className="w-full cursor-pointer">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="hidden md:flex items-center">
              <Avatar className="h-8 w-8 border-2 border-white/20">
                <AvatarFallback className="bg-primary-foreground text-white">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="ml-2 text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </span>
            </div>
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white border-none shadow-md" 
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
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="px-4 pt-5 pb-2 flex items-center">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarFallback className="bg-primary-foreground text-white">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </p>
                <p className="text-xs text-gray-300">Project Manager</p>
              </div>
            </div>
            
            <div className="flex-1 h-0 pt-3 pb-4 overflow-y-auto">
              <div className="px-4 mb-2">
                <span className="text-xs uppercase font-semibold tracking-wider text-white/50">Main Navigation</span>
              </div>
              <nav className="mt-2 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      location === item.href
                        ? 'bg-white/10 text-yellow-300 font-semibold shadow-md border-l-4 border-yellow-300'
                        : 'text-neutral-100/70 hover:bg-primary-foreground/20 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={`mr-3 ${location === item.href ? 'text-yellow-300' : 'text-white/70'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                ))}
              </nav>
              
              <div className="px-4 pt-4 pb-2 mt-4">
                <div className="py-3 px-3 bg-primary-foreground/20 rounded-lg">
                  <h3 className="text-xs font-medium text-white/70 mb-2">Need Help?</h3>
                  <p className="text-xs text-white/60 mb-3">Contact support for assistance.</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs justify-center bg-white/10 hover:bg-white/20 text-white"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <div className="flex-1 flex flex-col min-h-0 bg-primary pt-20">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="px-4 mb-4">
              <span className="text-xs uppercase font-semibold tracking-wider text-white/50">Main Navigation</span>
            </div>
            <nav className="flex-1 px-3 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    location === item.href
                      ? 'bg-white/10 text-yellow-300 font-semibold shadow-md border-l-4 border-yellow-300'
                      : 'text-neutral-100/70 hover:bg-primary-foreground/20 hover:text-white'
                  }`}
                >
                  <span className={`mr-3 ${location === item.href ? 'text-yellow-300' : 'text-white/70'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="px-4 pt-4 pb-2 mt-6">
              <div className="py-4 px-3 bg-primary-foreground/20 rounded-lg">
                <h3 className="text-xs font-medium text-white/70 mb-2">Need Help?</h3>
                <p className="text-xs text-white/60 mb-3">Contact support for assistance with order approvals or job management.</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full text-xs justify-center bg-white/10 hover:bg-white/20 text-white"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="md:pl-64 pt-16 md:pt-20 flex-1">
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PMLayout;