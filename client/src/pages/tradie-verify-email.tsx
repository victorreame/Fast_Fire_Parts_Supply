import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/logo";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const TradieVerifyEmail = () => {
  const [match, params] = useRoute("/tradie/verify-email/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Verify email token
  const { 
    data, 
    isError, 
    isLoading,
    isSuccess
  } = useQuery({
    queryKey: ['/api/tradie/verify-email', token],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const response = await fetch(`/api/tradie/verify-email/${token}`);
        if (!response.ok) {
          throw new Error('Invalid or expired verification token');
        }
        return response.json();
      } catch (error) {
        console.error('Error verifying email:', error);
        throw error;
      }
    },
    enabled: !!token,
    retry: false
  });

  // If no token is provided, show invalid state
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-red-600 text-white p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 flex items-center justify-center mb-2">
                <Logo size={80} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-1">FastFire Parts Supply</CardTitle>
            <CardDescription className="text-white opacity-90">Email Verification</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Invalid Verification Link</AlertTitle>
              <AlertDescription>
                The verification link is invalid or missing. Please ensure you've clicked on the correct link from your verification email.
              </AlertDescription>
            </Alert>
            <div className="text-center mt-4">
              <Link href="/login">
                <Button className="bg-red-600 hover:bg-red-700">Back to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-red-600 text-white p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 flex items-center justify-center mb-2">
                <Logo size={80} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-1">FastFire Parts Supply</CardTitle>
            <CardDescription className="text-white opacity-90">Email Verification</CardDescription>
          </CardHeader>

          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
            <p>Verifying your email address...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-red-600 text-white p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 flex items-center justify-center mb-2">
                <Logo size={80} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-1">FastFire Parts Supply</CardTitle>
            <CardDescription className="text-white opacity-90">Email Verification</CardDescription>
          </CardHeader>

          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Verification Failed</h2>
            <p className="text-gray-600 mb-4">
              The verification link is invalid or has expired. Please request a new verification email or contact support.
            </p>
            <Link href="/login">
              <Button className="bg-red-600 hover:bg-red-700">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-red-600 text-white p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-24 h-24 flex items-center justify-center mb-2">
              <Logo size={80} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold mb-1">FastFire Parts Supply</CardTitle>
          <CardDescription className="text-white opacity-90">Email Verification</CardDescription>
        </CardHeader>

        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Email Verified Successfully!</h2>
          
          <div className="space-y-4 text-gray-600">
            <p>
              Your email address has been verified successfully. Your account is now pending approval from your Project Manager.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md text-left">
              <h3 className="font-medium text-blue-800 mb-2">What's Next?</h3>
              <p>
                You'll receive a notification once your account has been approved. After approval, you can log in and start using the platform.
              </p>
            </div>
            
            <p>
              Thank you for your patience during this process.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-6 bg-gray-50 flex justify-center">
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700">
              Go to Login Page
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TradieVerifyEmail;