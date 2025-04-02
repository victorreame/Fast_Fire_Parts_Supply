import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import Logo from "../ui/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SupplierLayoutProps {
  children: ReactNode;
}

const SupplierLayout: React.FC<SupplierLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 300000, // 5 minutes
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      window.location.href = '/login';
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
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
            <Logo color="white" />
          </div>
          <h1 className="text-xl font-bold">FastFire Parts Supply Dashboard</h1>
          
          <nav className="ml-12 hidden md:flex space-x-8">
            <Link href="/supplier/dashboard">
              <a className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/dashboard' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Dashboard
              </a>
            </Link>
            <Link href="/supplier/orders">
              <a className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/orders' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Orders
              </a>
            </Link>
            <Link href="/supplier/customers">
              <a className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/customers' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Customers
              </a>
            </Link>
            <Link href="/supplier/parts">
              <a className={`px-3 py-2 text-sm font-medium ${
                location === '/supplier/parts' 
                  ? 'text-white border-b-2 border-secondary' 
                  : 'text-neutral-300 hover:text-white'
              }`}>
                Parts
              </a>
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
              <Button variant="ghost" size="icon" className="ml-1 h-4 w-4 text-xs text-neutral-300" onClick={handleLogout}>
                <i className="fas fa-chevron-down"></i>
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
