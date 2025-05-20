import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { FaHome, FaClipboardList, FaStar, FaUser, FaBell } from "react-icons/fa";
import Logo from "../ui/logo";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, User } from "@/hooks/use-auth";

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

  // Use auth hook for user data and logout functionality
  const { user, logoutMutation } = useAuth();

  // Define cart item type
  interface CartItem {
    id: number;
    userId: number;
    partId: number;
    quantity: number;
  }

  // Check if user is an unapproved tradie or contractor - extra explicit check
  const isUnapprovedTradie = (user?.role === 'tradie' || user?.role === 'contractor') && user?.isApproved !== true;
  
  console.log(`Mobile layout - User approval status check:`);
  console.log(`Role: ${user?.role}, isApproved value: ${user?.isApproved}`);
  console.log(`isUnapprovedTradie: ${isUnapprovedTradie}`);

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: showCart && !isUnapprovedTradie // Don't fetch cart data for unapproved tradies
  });

  // Use the standardized logout function
  const handleLogout = () => {
    try {
      // Close the user menu first
      setIsUserMenuOpen(false);

      // Use the proper logout mutation from auth context
      logoutMutation.mutate();

      // The logoutMutation handles:
      // 1. API request to server
      // 2. Clearing query cache
      // 3. Setting sessionStorage flags to prevent back button issues
      // 4. Redirecting to login page
      // 5. Showing toast notification
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
      {/* Limited Access Banner */}
      {user?.role === 'tradie' && user?.isApproved !== true && (
        <div className="bg-amber-600 text-white text-xs py-2 text-center font-bold flex items-center justify-center">
          <ShieldAlert className="h-3 w-3 mr-1" />
          RESTRICTED ACCESS MODE - Approval required for ordering parts
        </div>
      )}

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
          <div className="flex flex-col">
            <h1 className="text-xl font-bold flex items-center">{title || "FastFire Parts"}</h1>

            {/* Show status badge for unapproved tradies */}
            {user?.role === 'tradie' && !user?.isApproved && (
              <Badge variant="outline" className="text-xs bg-yellow-800 text-white border-yellow-700 mt-1">
                Limited Access Mode
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {showCart && !isUnapprovedTradie && (
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
                        <p className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.role === 'tradie' && (user.status === 'unassigned' || user.status === 'pending_invitation') && (
                          <div className="mt-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-sm font-medium inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                            </svg>
                            Limited Access
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        {logoutMutation.isPending ? "Logging out..." : "Logout"}
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
          <Link href="/" className={`py-3 px-2 flex flex-col items-center text-xs font-medium ${
            location === '/' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            <FaHome className="text-lg mb-1" />
            <span>Home</span>
          </Link>
          <Link href="/notifications" className={`py-3 px-2 flex flex-col items-center text-xs font-medium ${
            location === '/notifications' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            <div className="relative">
              <FaBell className="text-lg mb-1" />
              {/* Notification indicator dot for unread notifications */}
              {user?.role === 'tradie' && !user?.isApproved && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <span>Alerts</span>
          </Link>

          {/* Only show Orders tab for approved tradies */}
          {(!user?.role || user?.role !== 'tradie' || user?.isApproved) && (
            <Link href="/orders" className={`py-3 px-2 flex flex-col items-center text-xs font-medium ${
              location === '/orders' ? 'text-red-600' : 'text-neutral-500'
            }`}>
              <FaClipboardList className="text-lg mb-1" />
              <span>Orders</span>
            </Link>
          )}

          {/* Show Favorites tab for all users */}
            <Link href="/favorites" className={`py-3 px-2 flex flex-col items-center text-xs font-medium ${
              location === '/favorites' ? 'text-red-600' : 'text-neutral-500'
            }`}>
              <FaStar className="text-lg mb-1" />
              <span>Favorites</span>
            </Link>

          <Link href="/account" className={`py-3 px-2 flex flex-col items-center text-xs font-medium ${
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