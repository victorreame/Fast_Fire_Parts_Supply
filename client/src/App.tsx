import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";

// Mobile pages
import MobileHome from "@/pages/mobile/home";
import JobSearchPage from "@/pages/mobile/job-search";
import PartListPage from "@/pages/mobile/part-list";
import CartPage from "@/pages/mobile/cart";
import JobDetailsPage from "@/pages/mobile/job-details";
import OrdersPage from "@/pages/mobile/orders";
import OrderDetailsPage from "@/pages/mobile/order-details";
import FavoritesPage from "@/pages/mobile/favorites";
import AccountPage from "@/pages/mobile/account";
import SearchPage from "@/pages/mobile/search";

// Supplier pages
import SupplierDashboard from "@/pages/supplier/dashboard";
import SupplierOrders from "@/pages/supplier/orders";
import SupplierOrderDetails from "@/pages/supplier/order-details";
import SupplierParts from "@/pages/supplier/parts";
import SupplierCustomers from "@/pages/supplier/customers";

// Auth pages
import LoginPage from "@/pages/login";

// Not found
import NotFound from "@/pages/not-found";

// Define User type outside the component
interface User {
  id: number;
  username: string;
  role: string;
  businessId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function App() {
  const isMobile = useMobile();
  const [location, navigate] = useLocation();
  
  // Check auth status
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    // Don't redirect on mobile as it doesn't need login
    retry: isMobile ? 0 : 3
  });

  // Is this a supplier route?
  const isSupplierRoute = location.startsWith('/supplier');
  
  // For authentication redirects
  useEffect(() => {
    // If not authenticated and trying to access protected routes, redirect to login
    if (!isLoading && !user && location !== '/' && location !== '/login' && !location.startsWith('/mobile')) {
      navigate('/login');
      return;
    }
    
    // Route to appropriate dashboard based on user role
    if (user && (location === '/login' || location === '/')) {
      if (user.role === 'supplier') {
        navigate('/supplier/dashboard');
      } else {
        navigate('/mobile');
      }
    }
  }, [user, isLoading, location, navigate, isSupplierRoute]);
  
  // Handle loading state
  if (isLoading && isSupplierRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If authenticated but not a supplier, show not found for supplier routes
  if (isSupplierRoute && user && user.role !== 'supplier' && location !== '/login') {
    return <NotFound />;
  }

  return (
    <>
      <Switch>
        {/* Auth routes - make login the default route */}
        <Route path="/" component={LoginPage} />
        <Route path="/login" component={LoginPage} />
        
        {/* Mobile client routes */}
        <Route path="/mobile" component={MobileHome} />
        <Route path="/jobs" component={JobSearchPage} />
        <Route path="/parts" component={PartListPage} />
        <Route path="/parts/popular" component={() => <PartListPage key="popular" />} />
        <Route path="/search" component={SearchPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/job/:id" component={JobDetailsPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/order/:id" component={OrderDetailsPage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/account" component={AccountPage} />
        
        {/* Supplier dashboard routes - only accessible if role is supplier */}
        <Route path="/supplier/dashboard">
          {user?.role === 'supplier' ? <SupplierDashboard /> : <NotFound />}
        </Route>
        <Route path="/supplier/orders">
          {user?.role === 'supplier' ? <SupplierOrders /> : <NotFound />}
        </Route>
        <Route path="/supplier/orders/:id">
          {user?.role === 'supplier' ? <SupplierOrderDetails /> : <NotFound />}
        </Route>
        <Route path="/supplier/parts">
          {user?.role === 'supplier' ? <SupplierParts /> : <NotFound />}
        </Route>
        <Route path="/supplier/customers">
          {user?.role === 'supplier' ? <SupplierCustomers /> : <NotFound />}
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
