import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { FaHome, FaClipboardList, FaStar, FaUser } from "react-icons/fa";
import Logo from "../ui/logo";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
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

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 300000, // 5 minutes
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      navigate('/login');
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
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          {showBackButton ? (
            <button onClick={() => window.history.back()} className="mr-2">
              <i className="fas fa-arrow-left"></i>
            </button>
          ) : (
            <div className="mr-2">
              <Logo color="white" size={32} />
            </div>
          )}
          <h1 className="text-xl font-bold">{title || "FastFire Parts"}</h1>
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
            location === '/' ? 'text-primary-700' : 'text-neutral-500'
          }`}>
            <FaHome className="text-lg mb-1" />
            <span>Home</span>
          </Link>
          <Link href="/orders" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/orders' ? 'text-primary-700' : 'text-neutral-500'
          }`}>
            <FaClipboardList className="text-lg mb-1" />
            <span>Orders</span>
          </Link>
          <Link href="/favorites" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/favorites' ? 'text-primary-700' : 'text-neutral-500'
          }`}>
            <FaStar className="text-lg mb-1" />
            <span>Favorites</span>
          </Link>
          <Link href="/account" className={`py-3 px-4 flex flex-col items-center text-xs font-medium ${
            location === '/account' ? 'text-primary-700' : 'text-neutral-500'
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
