import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, ArrowLeftIcon } from "lucide-react";

const PendingApprovalPage = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();

  // If user is already approved, redirect to appropriate dashboard
  useEffect(() => {
    if (user && user.isApproved) {
      if (user.role === 'supplier') {
        navigate('/supplier/dashboard');
      } else if (user.role === 'project_manager') {
        navigate('/pm/dashboard');
      } else {
        navigate('/mobile');
      }
    }
  }, [user, navigate]);

  // If no user is logged in, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4 text-yellow-500">
            <AlertTriangleIcon className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Account Pending Approval</CardTitle>
          <CardDescription className="text-center">
            Your account is pending approval from an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-3">
              Thank you for registering with Fast Fire Parts. Your account has been created
              successfully, but it needs to be approved by a project manager or administrator 
              before you can access the system.
            </p>
            <p>
              Once your account is approved, you will receive a notification and will be able
              to log in and use the system. This typically takes 1-2 business days.
            </p>
          </div>
          
          {user && (
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium text-sm mb-2">Your Account Information:</h3>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</li>
                <li><span className="font-medium">Email:</span> {user.email}</li>
                <li><span className="font-medium">Role:</span> {user.role === 'project_manager' ? 'Project Manager' : 'Tradie'}</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleLogout}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Return to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;