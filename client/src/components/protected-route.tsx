import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If user is not approved, redirect to pending page
  if (user.role !== 'supplier' && user.isApproved === false) {
    return <Redirect to="/pending-approval" />;
  }

  // Check role if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'supplier') {
      return <Redirect to="/supplier/dashboard" />;
    } else if (user.role === 'project_manager') {
      return <Redirect to="/pm/dashboard" />;
    } else {
      return <Redirect to="/mobile/jobs" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;