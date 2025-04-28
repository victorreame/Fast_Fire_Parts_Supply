import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define user type
export interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  businessId?: number;
  isApproved?: boolean;
}

export type LoginData = {
  username: string;
  password: string;
};

export type RegisterData = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  businessId?: number;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  refetchUser: () => Promise<User | null>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        // Add cache-busting query parameter instead of using headers
        const timestamp = new Date().getTime();
        const res = await apiRequest("GET", `/api/user?_=${timestamp}`);
        if (res.status === 401) {
          return null;
        }
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    // Reduce cache time to prevent stale authentication state
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Prevent background refetches on window focus to use our controlled auth checks
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on role
      if (user.role === 'supplier') {
        window.location.href = "/supplier/dashboard";
      } else if (user.role === 'project_manager') {
        window.location.href = "/pm/dashboard";
      } else {
        window.location.href = "/mobile/jobs";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: user.isApproved 
          ? "Your account has been created. You can now log in." 
          : "Your account has been created and is pending approval. You will be notified when approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Add cache-busting parameter to the logout request
      const timestamp = new Date().getTime();
      const response = await apiRequest("POST", `/api/logout?_=${timestamp}`);
      return response.json();
    },
    onSuccess: () => {
      // Clear all queries and cache
      queryClient.clear();
      queryClient.resetQueries();
      queryClient.setQueryData(["/api/user"], null);
      
      // Force clear localStorage and set logout flag in sessionStorage
      try {
        localStorage.removeItem('lastRoute');
        // Clear most session data but keep a flag to prevent back button navigation
        const keys = Object.keys(sessionStorage);
        for (const key of keys) {
          if (key !== 'loggedOut') {
            sessionStorage.removeItem(key);
          }
        }
        // Set a flag to indicate the user has logged out
        sessionStorage.setItem('loggedOut', 'true');
      } catch (e) {
        console.error("Failed to clear storage:", e);
      }
      
      // Use replacement instead of regular navigation to prevent back button issues
      window.location.replace("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
      
      // Even on error, attempt to force logout on the client side
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      
      // Set logout flag even on error
      try {
        localStorage.removeItem('lastRoute');
        const keys = Object.keys(sessionStorage);
        for (const key of keys) {
          if (key !== 'loggedOut') {
            sessionStorage.removeItem(key);
          }
        }
        sessionStorage.setItem('loggedOut', 'true');
      } catch (e) {
        console.error("Failed to clear storage:", e);
      }
      
      window.location.replace("/login");
    },
  });

  // Create a wrapper for refetch that returns user data
  const refetchUser = async () => {
    const result = await refetch();
    return result.data || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}