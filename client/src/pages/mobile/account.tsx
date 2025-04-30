import { useState } from "react";
import MobileLayout from "@/components/mobile/layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// Define business type
interface Business {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  priceTier?: string;
}

const AccountPage = () => {
  const [_, navigate] = useLocation();
  const { user, isLoading: authLoading, logoutMutation } = useAuth();

  // Fetch business data for the user's business if they have one
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses'],
    enabled: !!user?.businessId,
  });

  // Find the user's business in the businesses array
  const business = user?.businessId 
    ? businesses.find(b => b.id === user.businessId) 
    : null;

  // Handle logout using the standardized logout mutation from auth context
  const handleLogout = () => {
    logoutMutation.mutate();
    // All handling (API call, cache clearing, redirect, etc.) is done by the mutation
  };

  return (
    <MobileLayout title="Account" showBackButton={false}>
      <div className="p-4">
        {authLoading ? (
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-24 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarFallback className="text-xl">{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{`${user?.firstName || ''} ${user?.lastName || ''}`}</CardTitle>
                    <CardDescription>{user?.role === 'contractor' ? 'Contractor' : 'Supplier'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Email:</span>
                    <span className="text-sm font-medium">{user?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Phone:</span>
                    <span className="text-sm font-medium">{user?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Username:</span>
                    <span className="text-sm font-medium">{user?.username}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {business && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Business Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Name:</span>
                      <span className="text-sm font-medium">{business.name}</span>
                    </div>
                    {business.address && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Address:</span>
                        <span className="text-sm font-medium text-right max-w-[60%]">{business.address}</span>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Phone:</span>
                        <span className="text-sm font-medium">{business.phone}</span>
                      </div>
                    )}
                    {business.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Email:</span>
                        <span className="text-sm font-medium">{business.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Price Tier:</span>
                      <span className="text-sm font-medium">{business.priceTier || 'T3'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-6">
              <Separator className="mb-6" />
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default AccountPage;