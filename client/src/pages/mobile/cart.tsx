import { useState } from "react";
import MobileLayout from "@/components/mobile/layout";
import CartItem from "@/components/mobile/cart-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Label } from "@/components/ui/label";

const CartPage = () => {
  const [selectedJobId, setSelectedJobId] = useState<string>("none");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery({
    queryKey: ['/api/cart'],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/orders", {
        jobId: selectedJobId && selectedJobId !== "none" ? parseInt(selectedJobId) : null,
        customerName: customerName.trim() || "Guest User",
        orderNumber: orderNumber.trim() || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Order submitted",
        description: "Your order has been successfully submitted to the supplier.",
      });
      navigate("/orders");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = () => {
    if (!cartItems || (cartItems as any[]).length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add items before submitting an order.",
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue with the order.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate();
  };

  return (
    <MobileLayout title="Shopping Cart" showBackButton={true} showCart={false}>
      {isLoadingCart ? (
        // Loading skeleton
        <div>
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="p-4 border-b border-neutral-200">
                <div className="flex justify-between items-center">
                  <div className="w-3/4">
                    <div className="flex items-start">
                      <Skeleton className="h-6 w-16 rounded mr-2" />
                      <Skeleton className="h-6 w-10 rounded" />
                    </div>
                    <Skeleton className="h-5 w-48 mt-2" />
                    <div className="flex items-center mt-2">
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
        </div>
      ) : cartItems && (cartItems as any[]).length > 0 ? (
        <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
          {(cartItems as any[]).map((item: any) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-8 h-[calc(100vh-170px)] flex flex-col items-center justify-center">
          <div className="text-center">
            <i className="fas fa-shopping-cart text-4xl text-neutral-300 mb-4"></i>
            <p className="text-neutral-500 mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/parts")} className="bg-red-600 hover:bg-red-700 text-white">
              Browse Parts
            </Button>
          </div>
        </div>
      )}

      {cartItems && (cartItems as any[]).length > 0 && (
        <div className="p-4 bg-white border-t border-neutral-200 sticky bottom-14">
          <div className="space-y-3">
            <div>
              <Label htmlFor="customerName" className="text-sm font-medium text-neutral-700">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="orderNumber" className="text-sm font-medium text-neutral-700">
                Order/PO Number (Optional)
              </Label>
              <Input
                id="orderNumber"
                placeholder="Enter order or PO number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {(!user || user.role !== 'tradie' || user.isApproved) && (
              <div>
                <Label className="block text-sm font-medium text-neutral-700">
                  Assign to Job (Optional)
                </Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No job selected</SelectItem>
                    {jobs.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.name} ({job.jobNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition mt-2"
              onClick={handleSubmitOrder}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default CartPage;
