import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import Logo from "../ui/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Define user type
interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  businessId?: number;
}

interface SupplierLayoutProps {
  children: ReactNode;
}

const SupplierLayout: React.FC<SupplierLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    staleTime: 300000, // 5 minutes
  });

  const handleLogout = async () => {
    try {
      // Send logout request to server - skip error handling for logout requests
      await apiRequest('POST', '/api/logout', {}, true);
      
      // Clear all application cache to ensure no user data remains
      queryClient.clear();
      
      // Specifically invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Notify user
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to the login page explicitly
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mr-3">
            <Logo color="white" size={60} />
          </div>
          <h1 className="text-xl font-bold">FastFire Parts Supply Dashboard</h1>
          
          <nav className="ml-12 hidden md:flex space-x-8">
            <Link href="/supplier/dashboard" className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/dashboard' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Dashboard
            </Link>
            <Link href="/supplier/orders" className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/orders' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Orders
            </Link>
            <Link href="/supplier/customers" className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/customers' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Customers
            </Link>
            <Link href="/supplier/parts" className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/parts' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Parts
            </Link>
          </nav>
          
          <div className="ml-auto flex items-center">
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-white relative">
                <i className="fas fa-bell"></i>
                <Badge className="absolute -top-1 -right-1 bg-secondary text-white h-5 w-5 flex items-center justify-center p-0">
                  3
                </Badge>
              </Button>
            </div>
            
            <div className="ml-4 flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="ml-2 text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4 text-xs bg-red-600 hover:bg-red-700 text-white border-none" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default SupplierLayout;
