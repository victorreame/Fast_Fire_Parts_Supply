import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/lib/auth-guard";
import { AuthGuardMobile } from "@/components/auth-guard-mobile";
import SessionExpired from "@/components/session-expired";

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
import SupplierJobs from "@/pages/supplier/jobs";

// Project Manager pages
import PMDashboard from "@/pages/pm/dashboard";
import PMApprovals from "@/pages/pm/approvals";
import PMJobs from "@/pages/pm/jobs";
import JobDetail from "@/pages/pm/job-detail";
import PMParts from "@/pages/pm/parts";
import PMTradies from "@/pages/pm/tradies";
import PMNotifications from "@/pages/pm/notifications";

// Shared pages
import SupplierJobDetailsPage from "@/pages/job/[id]";

// Auth pages
import LoginPage from "@/pages/login";
import PendingApprovalPage from "@/pages/pending-approval";

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
  
  // Check auth status with a more reliable setup
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    // Configure proper retry and stale time values for auth
    staleTime: 5000, // Only refetch after 5 seconds
    retry: (failureCount, error) => {
      // Don't retry 401 errors (unauthorized)
      if (error instanceof Error && error.message.startsWith('401:')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2; 
    },
    // Use the properly configured query function for auth
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      // Return null for 401 responses
      if (res.status === 401) {
        return null;
      }
      
      // Throw error for other failed responses
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      // Return the authenticated user data
      return await res.json();
    }
  });

  // Is this a supplier route?
  const isSupplierRoute = location.startsWith('/supplier');
  
  // For authentication redirects
  useEffect(() => {
    // Skip during loading to avoid premature redirects
    if (isLoading) return;

    // For security - redirect unauthenticated protected route access to login
    if (!user) {
      // If trying to access a protected route without auth
      if (isSupplierRoute || location.startsWith('/pm/')) {
        navigate('/login');
        return;
      }
    }
    
    // Handle login and home page routing based on authentication status
    if (location === '/login' || location === '/') {
      if (user) {
        // User is authenticated - route to appropriate dashboard
        if (user.role === 'supplier' || user.role === 'admin') {
          navigate('/supplier/dashboard');
        } else if (user.role === 'project_manager') {
          navigate('/pm/dashboard');
        } else {
          navigate('/mobile');
        }
      } else {
        // No authenticated user, go to login
        if (location === '/') {
          navigate('/login');
        }
      }
      return;
    }
    
    // Check if session storage has a last route to prevent browser back issues
    const shouldForceLogout = sessionStorage.getItem('loggedOut') === 'true';
    if (shouldForceLogout && (isSupplierRoute || location.startsWith('/pm/'))) {
      sessionStorage.removeItem('loggedOut');
      navigate('/login');
      return;
    }

    // Role-based access control for routes
    if (user) {
      const isSupplier = user.role === 'supplier' || user.role === 'admin';
      const isProjectManager = user.role === 'project_manager';
      
      // Block suppliers from accessing mobile routes
      if (isSupplier && location.startsWith('/mobile')) {
        navigate('/supplier/dashboard');
        return;
      }
      
      // Block project managers from accessing mobile routes
      if (isProjectManager && location.startsWith('/mobile')) {
        navigate('/pm/dashboard');
        return;
      }
      
      // Block contractors from accessing supplier routes
      if (!isSupplier && isSupplierRoute) {
        if (isProjectManager) {
          navigate('/pm/dashboard');
        } else {
          navigate('/mobile');
        }
        return;
      }
      
      // Block non-project managers from accessing PM routes
      if (!isProjectManager && location.startsWith('/pm')) {
        if (isSupplier) {
          navigate('/supplier/dashboard');
        } else {
          navigate('/mobile');
        }
        return;
      }
    }
  }, [user, isLoading, location, navigate, isSupplierRoute]);
  
  // Handle loading state
  const isPMRoute = location.startsWith('/pm');
  
  if (isLoading && (isSupplierRoute || isPMRoute)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="mb-6">
          <img 
            src="/assets/firelogo.png" 
            alt="Fast Fire Parts Logo" 
            className="h-24 md:h-32 object-contain"
          />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  // If authenticated but not a supplier, show not found for supplier routes
  if (isSupplierRoute && user && user.role !== 'supplier' && user.role !== 'admin' && location !== '/login') {
    return <NotFound />;
  }
  
  // If authenticated but not a project manager, show not found for PM routes
  if (isPMRoute && user && user.role !== 'project_manager' && location !== '/login') {
    return <NotFound />;
  }

  return (
    <AuthProvider>
      <Switch>
        {/* Auth routes - default routes for user entry */}
        <Route path="/">
          {/* Intelligently redirect based on auth status and role */}
          {user 
            ? user.role === 'supplier' || user.role === 'admin'
              ? <SupplierDashboard />
              : user.role === 'project_manager'
                ? <PMDashboard />
                : <MobileHome />
            : <LoginPage />
          }
        </Route>
        <Route path="/login" component={LoginPage} />
        <Route path="/session-expired" component={SessionExpired} />
        <Route path="/pending-approval" component={PendingApprovalPage} />
        
        {/* Mobile client routes - protected with AuthGuardMobile */}
        <Route path="/mobile">
          <AuthGuardMobile>
            <MobileHome />
          </AuthGuardMobile>
        </Route>
        <Route path="/jobs">
          <AuthGuardMobile>
            <JobSearchPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/parts">
          <AuthGuardMobile>
            <PartListPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/parts/popular">
          <AuthGuardMobile>
            <PartListPage key="popular" />
          </AuthGuardMobile>
        </Route>
        <Route path="/search">
          <AuthGuardMobile>
            <SearchPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/cart">
          <AuthGuardMobile>
            <CartPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/job/:id">
          <AuthGuardMobile>
            <JobDetailsPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/orders">
          <AuthGuardMobile>
            <OrdersPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/order/:id">
          <AuthGuardMobile>
            <OrderDetailsPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/favorites">
          <AuthGuardMobile>
            <FavoritesPage />
          </AuthGuardMobile>
        </Route>
        <Route path="/account">
          <AuthGuardMobile>
            <AccountPage />
          </AuthGuardMobile>
        </Route>
        
        {/* Supplier dashboard routes - only accessible if role is supplier */}
        <Route path="/supplier/dashboard">
          {user?.role === 'supplier' || user?.role === 'admin' ? <SupplierDashboard /> : <NotFound />}
        </Route>
        <Route path="/supplier/orders">
          {user?.role === 'supplier' || user?.role === 'admin' ? <SupplierOrders /> : <NotFound />}
        </Route>
        <Route path="/supplier/orders/:id">
          {user?.role === 'supplier' || user?.role === 'admin' ? <SupplierOrderDetails /> : <NotFound />}
        </Route>
        <Route path="/supplier/parts">
          {user?.role === 'supplier' || user?.role === 'admin' ? <SupplierParts /> : <NotFound />}
        </Route>
        <Route path="/supplier/customers">
          {user?.role === 'supplier' || user?.role === 'admin' ? <SupplierCustomers /> : <NotFound />}
        </Route>
        <Route path="/supplier/jobs">
          {user?.role === 'supplier' || user?.role === 'admin' ? <SupplierJobs /> : <NotFound />}
        </Route>
        
        {/* Project Manager routes - only accessible if role is project_manager */}
        <Route path="/pm/dashboard">
          <AuthGuard requiredRole="project_manager">
            <PMDashboard />
          </AuthGuard>
        </Route>
        <Route path="/pm/approvals">
          <AuthGuard requiredRole="project_manager">
            <PMApprovals />
          </AuthGuard>
        </Route>
        <Route path="/pm/jobs">
          <AuthGuard requiredRole="project_manager">
            <PMJobs />
          </AuthGuard>
        </Route>
        <Route path="/pm/jobs/:id">
          <AuthGuard requiredRole="project_manager">
            <JobDetail />
          </AuthGuard>
        </Route>
        <Route path="/pm/parts">
          <AuthGuard requiredRole="project_manager">
            <PMParts />
          </AuthGuard>
        </Route>
        <Route path="/pm/tradies">
          <AuthGuard requiredRole="project_manager">
            <PMTradies />
          </AuthGuard>
        </Route>
        <Route path="/pm/notifications">
          <AuthGuard requiredRole="project_manager">
            <PMNotifications />
          </AuthGuard>
        </Route>
        
        {/* Job details page - role-specific with auth guards */}
        <Route path="/job/:id">
          {user?.role === 'supplier' || user?.role === 'admin' 
            ? <AuthGuard><SupplierJobDetailsPage /></AuthGuard> 
            : <AuthGuardMobile><JobDetailsPage /></AuthGuardMobile>
          }
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
