import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  skipErrorHandling: boolean = false
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Special handling for auth-related requests
  const authRelatedUrls = ['/api/login', '/api/logout', '/api/register'];
  const isAuthRequest = authRelatedUrls.includes(url);
  
  // Skip error handling for auth requests or when explicitly requested
  if (!skipErrorHandling && !isAuthRequest) {
    await throwIfResNotOk(res);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      // Handle 401 unauthorized based on the requested behavior
      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        } else {
          const text = await res.text();
          throw new Error(`401: ${text || 'Unauthorized'}`);
        }
      }

      // Handle other error responses
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }

      // Parse the JSON response
      return await res.json();
    } catch (err) {
      // Rethrow all errors but provide better debug info
      if (err instanceof Error) {
        console.error(`Query failed for ${queryKey[0]}:`, err.message);
      }
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Use a more reasonable stale time to allow some caching but not too much
      staleTime: 60000, // 1 minute
      retry: (failureCount, error) => {
        // Don't retry on unauthorized errors
        if (error instanceof Error && error.message.startsWith('401:')) {
          return false;
        }
        // Don't retry on forbidden errors
        if (error instanceof Error && error.message.startsWith('403:')) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
