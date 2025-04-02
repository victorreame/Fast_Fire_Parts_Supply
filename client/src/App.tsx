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

function App() {
  const isMobile = useMobile();
  const [location] = useLocation();
  
  // Check auth status
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Handle loading state
  if (isLoading && location !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const [_, navigate] = useLocation();
  
  // Check if user is not authenticated and not on login page
  if (!user && location !== '/login') {
    navigate('/login');
    return null;
  }

  // Route to appropriate dashboard based on user role
  if (user && location === '/') {
    if (user.role === 'supplier') {
      navigate('/supplier/dashboard');
      return null;
    }
  }

  return (
    <>
      <Switch>
        {/* Auth routes */}
        <Route path="/login" component={LoginPage} />
        
        {/* Mobile client routes */}
        <Route path="/" component={MobileHome} />
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
