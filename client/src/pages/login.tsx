import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/logo";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/login", { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: "Welcome!",
        description: "You have successfully logged in.",
      });
      
      // Force refresh the user query to ensure App.tsx picks up the logged-in state
      import("@/lib/queryClient").then(({ queryClient }) => {
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        // Use direct navigation for more reliable redirection
        if (data.role === "supplier" || data.role === "admin") {
          window.location.href = "/supplier/dashboard";
        } else {
          window.location.href = "/mobile";
        }
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Red top bar */}
      <div className="w-full bg-red-600 h-12 shadow-md"></div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden">
          {/* Red accent strip at the top of the card */}
          <div className="h-2 bg-red-600 w-full"></div>
          
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex items-center justify-center text-primary-600 mb-2">
              <Logo size={50} />
            </div>
            <CardTitle className="text-2xl font-bold">FastFire Parts Supply</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <div className="fixed bottom-4 left-0 right-0 text-center text-sm">
        <p className="font-medium text-primary-600 mb-1">Demo Credentials</p>
        <div className="bg-white p-2 rounded-md shadow-sm inline-block">
          <p className="mb-1"><span className="font-semibold">Contractor:</span> john.doe / password123</p>
          <p><span className="font-semibold">Supplier:</span> admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
