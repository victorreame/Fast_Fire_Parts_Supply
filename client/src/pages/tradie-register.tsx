import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/ui/logo";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const TradieRegisterPage = () => {
  const [match, params] = useRoute("/tradie/register/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [invitationId, setInvitationId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "supplier" || user.role === "admin") {
        navigate("/supplier/dashboard");
      } else if (user.role === "project_manager") {
        navigate("/pm/dashboard");
      } else {
        navigate("/mobile");
      }
    }
  }, [user, navigate]);

  // Verify invitation token
  const { 
    data: invitation, 
    isError: invitationError, 
    isLoading: verifyingInvitation 
  } = useQuery({
    queryKey: ['/api/tradie/invitations/verify', token],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const response = await fetch(`/api/tradie/invitations/verify/${token}`);
        if (!response.ok) {
          throw new Error('Invalid or expired invitation');
        }
        return response.json();
      } catch (error) {
        console.error('Error verifying invitation:', error);
        throw error;
      }
    },
    enabled: !!token,
    retry: false
  });

  // Set invitation details once verified
  useEffect(() => {
    if (invitation) {
      setInvitationId(invitation.id);
      setEmail(invitation.email);
    }
  }, [invitation]);

  // Register tradie mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tradie/register/tradie", {
        invitationId,
        firstName,
        lastName,
        username,
        password,
        phone
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account before logging in.",
      });
      navigate("/tradie/registration-success");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    },
  });

  // Form validation
  const validateForm = () => {
    if (!firstName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return false;
    }

    if (!lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your last name.",
        variant: "destructive",
      });
      return false;
    }

    if (!username.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return false;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms Not Accepted",
        description: "You must accept the terms and conditions to register.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      registerMutation.mutate();
    }
  };

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
            <CardDescription className="text-white opacity-90">Tradie Registration</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Invalid Registration Link</AlertTitle>
              <AlertDescription>
                The registration link is invalid or missing. Please ensure you've clicked on the correct link from your invitation email.
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

  // Loading state while verifying invitation
  if (verifyingInvitation) {
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
            <CardDescription className="text-white opacity-90">Verifying Invitation</CardDescription>
          </CardHeader>

          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
            <p>Verifying your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If invitation verification failed
  if (invitationError || !invitation) {
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
            <CardDescription className="text-white opacity-90">Tradie Registration</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Invalid or Expired Invitation</AlertTitle>
              <AlertDescription>
                This invitation link is invalid or has expired. Please contact your project manager for a new invitation.
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

  // Main registration form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl overflow-hidden border-0 shadow-lg">
        <div className="grid md:grid-cols-2">
          <div className="bg-red-600 p-6 text-white">
            <div className="flex justify-center mb-3">
              <div className="w-24 h-24 flex items-center justify-center mb-2">
                <Logo size={80} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1 text-center">FastFire Parts Supply</h1>
            <p className="text-sm opacity-90 text-center mb-6">Tradie Registration</p>
            
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold mb-3">Join Our Network of Professionals</h2>
              <p className="mb-4">
                As a registered tradie with FastFire Parts Supply, you'll gain access to:
              </p>
              <ul className="space-y-2 list-disc pl-4">
                <li>Streamlined parts ordering for your fire sprinkler projects</li>
                <li>Job tracking and management tools</li>
                <li>Direct communication with project managers</li>
                <li>Priority access to new part releases and promotions</li>
                <li>Real-time order status updates</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Your Account</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                You've been invited as <span className="font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="flex items-start space-x-2 mt-4">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <Label 
                  htmlFor="terms" 
                  className="text-sm text-gray-600 font-normal"
                >
                  I agree to the <Link href="/terms" className="text-red-600 hover:underline">Terms and Conditions</Link> and <Link href="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 mt-4"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="text-center mt-4">
                <Link href="/login" className="text-red-600 hover:underline text-sm">
                  Already have an account? Login
                </Link>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default TradieRegisterPage;