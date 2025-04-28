import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SessionExpired from '@/components/session-expired';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | string[];
  redirectPath?: string;
}

/**
 * AuthGuard component to protect routes that require authentication
 * This component will:
 * 1. Check if user is logged in
 * 2. Optionally check if user has the required role
 * 3. Redirect to login page if not authenticated
 * 4. Show a loading state while checking authentication
 */
export function AuthGuard({ 
  children, 
  requiredRole, 
  redirectPath = '/login' 
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Function to check authentication status
    const checkAuth = async () => {
      // If still loading, don't do anything yet
      if (isLoading) return;
      
      // If no user, redirect to login
      if (!user) {
        setIsAuthenticated(false);
        toast({
          title: "Authentication Required",
          description: "Your session has expired or you're not logged in. Please login to continue.",
          variant: "destructive",
        });
        navigate(redirectPath);
        return;
      }
      
      // If role is required, check if user has that role
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
          setIsAuthenticated(false);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          
          // Redirect based on role
          if (user.role === 'supplier' || user.role === 'admin') {
            navigate('/supplier/dashboard');
          } else if (user.role === 'project_manager') {
            navigate('/pm/dashboard');
          } else {
            navigate('/mobile');
          }
          return;
        }
      }
      
      // User is authenticated and has required role
      setIsAuthenticated(true);
    };
    
    // Check authentication on mount and when dependencies change
    checkAuth();
    
    // Also check auth when window regains focus (in case of logout in another tab)
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Check authentication periodically (every 5 minutes)
    const interval = setInterval(checkAuth, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user, isLoading, requiredRole, navigate, redirectPath, toast]);
  
  // Show loading state while checking authentication
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Show the SessionExpired component if not authenticated
  if (!isAuthenticated) {
    return <SessionExpired />;
  }
  
  // If authenticated, render children
  return <>{children}</>;
}

/**
 * A higher-order component to apply AuthGuard to a component
 */
export function withAuthGuard(
  Component: React.ComponentType<any>,
  requiredRole?: string | string[],
  redirectPath?: string
) {
  return function WithAuthGuard(props: any) {
    return (
      <AuthGuard requiredRole={requiredRole} redirectPath={redirectPath}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}