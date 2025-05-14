import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth, User } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import SessionExpired from './session-expired';

interface AuthGuardMobileProps {
  children: ReactNode;
  redirectPath?: string;
}

/**
 * A component that guards routes requiring authentication in the mobile interface.
 * Similar to AuthGuard but tailored for mobile pages.
 */
export function AuthGuardMobile({ children, redirectPath = '/login' }: AuthGuardMobileProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Function to check authentication status
    const checkAuth = async () => {
      // Wait for auth state to resolve
      if (isLoading) return;
      
      // Check for logged out flag in session storage to prevent back button issues
      const hasLoggedOut = sessionStorage.getItem('loggedOut') === 'true';
      if (hasLoggedOut) {
        setIsAuthenticated(false);
        // Clear the flag so it doesn't affect new logins
        sessionStorage.removeItem('loggedOut');
        
        // Inform user and redirect to login
        toast({
          title: "Session Ended",
          description: "Your session has ended. Please log in again to continue.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      // If no user, redirect to login
      if (!user) {
        setIsAuthenticated(false);
        toast({
          title: "Sign in Required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        navigate(redirectPath);
        return;
      }
      
      // Check approval status for tradies
      const currentPath = window.location.pathname;
      if (user?.role === 'tradie' && !user?.isApproved) {
        // Allow access only to specific pages for unapproved tradies
        const allowedPaths = [
          '/mobile', 
          '/account', 
          '/parts',
          '/parts/popular'
        ];
        const isAllowedPath = allowedPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'));
        
        if (!isAllowedPath) {
          setIsAuthenticated(false);
          toast({
            title: "Limited Access",
            description: "You need to accept a Project Manager invitation to access this feature.",
            variant: "destructive",
          });
          navigate('/mobile');
          return;
        }
      }
      
      // User is authenticated and has access to the current path
      setIsAuthenticated(true);
    };
    
    // Check auth on mount and when dependencies change
    checkAuth();
    
    // Also check auth when window regains focus (for logout in another tab)
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Clear any old cache in headers
    const setNoCacheHeaders = () => {
      // Apply cache control through meta tags since we can't modify response headers directly
      const metaCache = document.createElement('meta');
      metaCache.httpEquiv = 'Cache-Control';
      metaCache.content = 'no-cache, no-store, must-revalidate';
      document.head.appendChild(metaCache);
      
      const metaPragma = document.createElement('meta');
      metaPragma.httpEquiv = 'Pragma';
      metaPragma.content = 'no-cache';
      document.head.appendChild(metaPragma);
      
      const metaExpires = document.createElement('meta');
      metaExpires.httpEquiv = 'Expires';
      metaExpires.content = '0';
      document.head.appendChild(metaExpires);
    };
    
    setNoCacheHeaders();
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isLoading, navigate, redirectPath, toast]);
  
  // Show loading state while checking authentication
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
 * A higher-order component to apply AuthGuardMobile to a component
 */
export function withMobileAuthGuard(
  Component: React.ComponentType<any>,
  redirectPath?: string
) {
  return function WithMobileAuthGuard(props: any) {
    return (
      <AuthGuardMobile redirectPath={redirectPath}>
        <Component {...props} />
      </AuthGuardMobile>
    );
  };
}