import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { FaHome, FaClipboardList, FaStar, FaUser } from "react-icons/fa";
import Logo from "../ui/logo";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showCart?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  showCart = true,
}) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  // Define cart item type
  interface CartItem {
    id: number;
    userId: number;
    partId: number;
    quantity: number;
  }

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    staleTime: 300000, // 5 minutes
  });

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: true, // Always fetch cart items for mobile
  });

  const handleLogout = async () => {
    try {
      // Send logout request to server - skip error handling for logout requests
      const response = await apiRequest('POST', '/api/logout', {}, true);
      
      // Clear all application cache to ensure no user data remains
      queryClient.clear();
      
      // Specifically invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      // Close user menu
      setIsUserMenuOpen(false);
      
      // Redirect to the home/login page
      navigate('/');
      
      // Notify user
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
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
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 to-red-800 text-white py-3 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          {showBackButton ? (
            <button onClick={() => window.history.back()} className="mr-2">
              <i className="fas fa-arrow-left"></i>
            </button>
          ) : (
            <div className="mr-3">
              <Logo size={40} linkTo="/" />
            </div>
          )}
          <h1 className="text-xl font-bold flex items-center">{title || "FastFire Parts"}</h1>
        </div>
        <div className="flex items-center">
          {showCart && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <i className="fas fa-shopping-cart"></i>
              {cartItems.length > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 bg-secondary text-white h-5 w-5 flex items-center justify-center p-0"
                >
                  {cartItems.length}
                </Badge>
              )}
            </Button>
          )}

          <Sheet open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Account</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button variant="default" className="w-full" onClick={() => navigate('/login')}>
                      Login
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-neutral-200 sticky bottom-0">
        <div className="flex justify-around">
          <Link href="/" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            <FaHome className="text-lg mb-1" />
            <span>Home</span>
          </Link>
          <Link href="/orders" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/orders' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            <FaClipboardList className="text-lg mb-1" />
            <span>Orders</span>
          </Link>
          <Link href="/favorites" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/favorites' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            <FaStar className="text-lg mb-1" />
            <span>Favorites</span>
          </Link>
          <Link href="/account" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/account' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            <FaUser className="text-lg mb-1" />
            <span>Account</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
