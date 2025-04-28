import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
      const response = await apiRequest("POST", "/api/login", {
        username,
        password,
      });
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
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });

        // Use direct navigation for more reliable redirection
        if (data.role === "supplier" || data.role === "admin") {
          window.location.href = "/supplier/dashboard";
        } else if (data.role === "project_manager") {
          window.location.href = "/pm/dashboard";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
        {/* Red header section with logo and title */}
        <div className="bg-red-600 p-6 text-center text-white">
          <div className="flex justify-center mb-3">
            <div className="w-48 h-48 flex items-center justify-center mb-2">
              <Logo size={130} />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">FastFire Parts Supply</h1>
          <p className="text-sm opacity-90">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 mt-4"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 text-center text-sm">
        <p className="font-medium text-gray-700 mb-1">Demo Credentials</p>
        <div className="bg-white p-3 rounded-md shadow-sm inline-block">
          <p className="mb-1">
            <span className="font-semibold">Contractor:</span> john.doe /
            password123
          </p>
          <p>
            <span className="font-semibold">Supplier:</span> admin / admin123
          </p>
          <p>
            <span className="font-semibold">Project Manager:</span> pm /
            manager123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
