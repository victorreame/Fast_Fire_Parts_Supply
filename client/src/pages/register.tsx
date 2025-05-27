import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertTriangle, User, Mail, Phone, Lock, Building } from "lucide-react";

// Registration form schema
const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface InvitationDetails {
  invitation: {
    id: number;
    email: string;
    personalMessage?: string;
    createdAt: string;
    tokenExpiry: string;
  };
  projectManager: {
    name: string;
    businessId: number;
  } | null;
}

const RegisterPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);

  // Parse URL parameters for invitation token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('invitation_token');
    const email = urlParams.get('email');
    
    if (token) {
      setInvitationToken(token);
    }
    if (email) {
      setInvitationEmail(decodeURIComponent(email));
    }
  }, []);

  // Get invitation details if token is provided
  const { data: invitationDetails, isLoading: invitationLoading, error: invitationError } = useQuery<InvitationDetails>({
    queryKey: ['/api/tradie/invitations/token', invitationToken],
    enabled: !!invitationToken,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tradie/invitations/token/${invitationToken}`);
      return await response.json();
    },
  });

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: invitationEmail || "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false
    }
  });

  // Update email field when invitation email is loaded
  useEffect(() => {
    if (invitationEmail) {
      form.setValue('email', invitationEmail);
    }
  }, [invitationEmail, form]);

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const registrationData = {
        ...data,
        role: 'tradie',
        invitationToken: invitationToken || undefined
      };
      
      const response = await apiRequest('POST', '/api/users', registrationData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: invitationToken 
          ? "Your account has been created and you've joined the company. Please sign in to continue."
          : "Your account has been created successfully. Please sign in to continue.",
      });
      
      // Redirect to login page
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    registerMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isInvitationExpired = (expiryString: string) => {
    return new Date(expiryString) < new Date();
  };

  // Show loading state while checking invitation
  if (invitationToken && invitationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Validating invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if invitation is invalid
  if (invitationToken && invitationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This invitation link is invalid or has expired. Please contact the project manager for a new invitation.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => setLocation('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show expired invitation warning
  if (invitationDetails && isInvitationExpired(invitationDetails.invitation.tokenExpiry)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Invitation Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This invitation expired on {formatDate(invitationDetails.invitation.tokenExpiry)}. 
                Please contact the project manager for a new invitation.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => setLocation('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            🔥 Fire Parts Supply
          </CardTitle>
          <CardDescription className="text-center">
            {invitationDetails ? "Complete your registration to join the company" : "Create your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Invitation Details */}
          {invitationDetails && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Company Invitation</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>From: {invitationDetails.projectManager?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>Join their company team</span>
                </div>
                {invitationDetails.invitation.personalMessage && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <p className="text-sm italic">"{invitationDetails.invitation.personalMessage}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          placeholder="john@example.com" 
                          className="pl-10" 
                          {...field}
                          readOnly={!!invitationEmail}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        I accept the{" "}
                        <a href="/terms" className="text-blue-600 hover:underline">
                          Terms and Conditions
                        </a>
                        {" "}and{" "}
                        <a href="/privacy" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  invitationDetails ? "Join Company & Create Account" : "Create Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setLocation('/login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;