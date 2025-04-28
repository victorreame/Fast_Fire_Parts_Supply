import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import Logo from "@/components/ui/logo";

/**
 * Component that shows a session expired message and redirects to login
 * This component is used when a user's session expires and they need to login again
 */
export function SessionExpired() {
  const [, navigate] = useLocation();
  
  // Clear all authentication data on mount
  useEffect(() => {
    // Clear any cached auth data
    queryClient.clear();
    queryClient.resetQueries();
    queryClient.setQueryData(["/api/user"], null);
    
    // Clear storage data but set logout flag
    try {
      localStorage.removeItem('lastRoute');
      // Clear session data but keep logout flag
      const keys = Object.keys(sessionStorage);
      for (const key of keys) {
        if (key !== 'loggedOut') {
          sessionStorage.removeItem(key);
        }
      }
      // Set flag to prevent back button navigation
      sessionStorage.setItem('loggedOut', 'true');
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
    
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      window.location.replace("/login");
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  const handleLogin = () => {
    window.location.replace("/login");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 mb-2">
            <Logo size={64} />
          </div>
          <CardTitle className="text-2xl text-red-600">Session Expired</CardTitle>
          <CardDescription>
            Your session has expired or you're not authorized to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-gray-600 mb-4">
            For your security, you have been logged out due to inactivity or invalid authentication.
          </p>
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <p className="text-sm text-yellow-700">
              You will be redirected to the login page automatically in a few seconds.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleLogin}>
            Login Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SessionExpired;