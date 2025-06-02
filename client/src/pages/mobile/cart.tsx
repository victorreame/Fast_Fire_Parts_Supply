import { useState, useEffect, useMemo } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, MapPin, Building, FileText, Calendar, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CartPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // COMPLETE BLOCK: Check if user is an unapproved tradie or contractor and immediately redirect
  useEffect(() => {
    if ((user?.role === 'tradie' || user?.role === 'contractor') && user?.isApproved !== true) {
      console.log('SECURITY: Blocking unapproved tradie from accessing cart page');
      toast({
        title: "Access Blocked",
        description: "Your account requires Project Manager approval before accessing cart functionality. Please contact your Project Manager for immediate approval.",
        variant: "destructive",
      });
      // Immediate redirect to home page
      navigate('/');
      return;
    }
  }, [user, toast, navigate]);

  const [selectedJobId, setSelectedJobId] = useState<string>("none");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !user || !(user.role === 'tradie' || user.role === 'contractor') || user.isApproved === true,
  });

  // Fetch assigned jobs for current user
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<any[]>({
    queryKey: ['/api/user/jobs'],
    enabled: !!user,
  });

  // Group cart items by job
  const cartItemsByJob = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems)) return {};
    
    return (cartItems as any[]).reduce((groups: any, item: any) => {
      const jobKey = item.jobId || 'none';
      if (!groups[jobKey]) {
        groups[jobKey] = [];
      }
      groups[jobKey].push(item);
      return groups;
    }, {});
  }, [cartItems]);

  // Get selected job details
  const selectedJob = useMemo(() => {
    if (selectedJobId === "none" || !jobs || !Array.isArray(jobs)) return null;
    return jobs.find((job: any) => job.id.toString() === selectedJobId);
  }, [selectedJobId, jobs]);

  // Validation: Check if cart items belong to different jobs
  const hasMultipleJobs = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems)) return false;
    const jobIds = new Set((cartItems as any[]).map((item: any) => item.jobId).filter(Boolean));
    return jobIds.size > 1;
  }, [cartItems]);

  // Validation: Check job status
  const jobValidation = useMemo(() => {
    if (!selectedJob) return { isValid: true, message: "" };
    
    if (selectedJob.status === 'completed') {
      return { 
        isValid: false, 
        message: "Cannot order parts for completed jobs." 
      };
    }
    
    if (selectedJob.status === 'on_hold') {
      return { 
        isValid: false, 
        message: "This job is on hold. Contact your Project Manager before ordering." 
      };
    }
    
    return { isValid: true, message: "" };
  }, [selectedJob]);

  // Auto-populate delivery address from job location
  useEffect(() => {
    if (selectedJob && selectedJob.location) {
      setDeliveryAddress(selectedJob.location);
    } else {
      setDeliveryAddress("");
    }
  }, [selectedJob]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/orders", {
        jobId: selectedJobId && selectedJobId !== "none" ? parseInt(selectedJobId) : null,
        customerName: customerName.trim() || "Guest User",
        orderNumber: orderNumber.trim() || null,
        deliveryAddress: deliveryAddress.trim() || null,
        deliveryInstructions: deliveryInstructions.trim() || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/jobs'] });
      toast({
        title: "Order submitted successfully",
        description: selectedJob 
          ? `Your order for ${selectedJob.name} has been submitted for approval.`
          : "Your order has been submitted for approval.",
      });
      navigate("/orders");
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting order",
        description: error?.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = () => {
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
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

    // Validate job status
    if (!jobValidation.isValid) {
      toast({
        title: "Job validation failed",
        description: jobValidation.message,
        variant: "destructive",
      });
      return;
    }

    // Check for multiple jobs in cart
    if (hasMultipleJobs) {
      toast({
        title: "Multiple jobs detected",
        description: "Cannot submit order with parts from different jobs. Please place separate orders.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate();
  };

  return (
    <MobileLayout title="Shopping Cart" showBackButton={true} showCart={false}>
      <div className="space-y-4">
        {/* Job validation alerts */}
        {hasMultipleJobs && (
          <Alert className="mx-4 mt-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Your cart contains parts from multiple jobs. Please place separate orders for each job.
            </AlertDescription>
          </Alert>
        )}

        {!jobValidation.isValid && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {jobValidation.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected job information */}
        {selectedJob && (
          <Card className="mx-4 mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-blue-600" />
                Job Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedJob.name}</span>
                <Badge variant="outline" className="text-xs">
                  #{selectedJob.jobNumber}
                </Badge>
              </div>
              {selectedJob.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{selectedJob.location}</span>
                </div>
              )}
              {selectedJob.status && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <Badge 
                    variant={selectedJob.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs capitalize"
                  >
                    {selectedJob.status.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cart content */}
        {isLoadingCart ? (
          <div className="space-y-4 px-4">
            {Array(3).fill(0).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="w-3/4 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Array.isArray(cartItems) && cartItems.length > 0 ? (
          <div className="space-y-2 px-4">
            {cartItems.map((item: any) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-8 h-[calc(100vh-200px)] flex flex-col items-center justify-center">
            <div className="text-center">
              <i className="fas fa-shopping-cart text-4xl text-neutral-300 mb-4"></i>
              <p className="text-neutral-500 mb-4">Your cart is empty</p>
              <Button onClick={() => navigate("/parts")} className="bg-red-600 hover:bg-red-700 text-white">
                Browse Parts
              </Button>
            </div>
          </div>
        )}

        {/* Order form */}
        {Array.isArray(cartItems) && cartItems.length > 0 && (
          <Card className="mx-4 mb-20">
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName" className="text-sm font-medium">
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
                <Label htmlFor="orderNumber" className="text-sm font-medium">
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
                  <Label className="text-sm font-medium">
                    Assign to Job
                  </Label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No job selected</SelectItem>
                      {Array.isArray(jobs) && jobs.map((job: any) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.name} (#{job.jobNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="deliveryAddress" className="text-sm font-medium">
                  Delivery Address
                </Label>
                <Input
                  id="deliveryAddress"
                  placeholder={selectedJob ? "Auto-filled from job location" : "Enter delivery address"}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deliveryInstructions" className="text-sm font-medium">
                  Delivery Instructions (Optional)
                </Label>
                <Input
                  id="deliveryInstructions"
                  placeholder="Special instructions for delivery"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition"
                onClick={handleSubmitOrder}
                disabled={createOrderMutation.isPending || !jobValidation.isValid || hasMultipleJobs}
              >
                {createOrderMutation.isPending ? "Submitting..." : "Submit Order for Approval"}
              </Button>

              {selectedJob && (
                <p className="text-xs text-gray-500 text-center">
                  This order will be sent to your Project Manager for approval
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};

export default CartPage;