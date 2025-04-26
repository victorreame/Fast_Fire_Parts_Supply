import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PMLayout from "@/components/pm/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  AlertTriangleIcon,
  Clock8Icon,
  Loader2Icon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Order interface
interface Order {
  id: number;
  orderNumber: string;
  status: string;
  businessId: number;
  businessName: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  jobId: number | null;
  jobName: string | null;
  totalItems: number;
  totalPrice: number;
  requestedBy: number;
  requestorName: string;
  notes: string | null;
  approvedBy: number | null;
  approvalDate: string | null;
}

// Order item interface
interface OrderItem {
  id: number;
  orderId: number;
  partId: number;
  quantity: number;
  priceAtOrder: number;
  part: {
    id: number;
    item_code: string;
    description: string;
    type: string;
    pipeSize: string;
    image: string | null;
  };
}

const OrderApprovals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Query for pending orders
  const { 
    data: pendingOrders, 
    isLoading: pendingOrdersLoading,
    refetch: refetchPendingOrders
  } = useQuery<Order[]>({
    queryKey: ['/api/pm/orders/pending'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pm/orders/pending');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch pending orders:", error);
        return [];
      }
    },
  });

  // Query for recently approved orders
  const { 
    data: approvedOrders, 
    isLoading: approvedOrdersLoading,
    refetch: refetchApprovedOrders
  } = useQuery<Order[]>({
    queryKey: ['/api/pm/orders/approved', user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pm/orders/approved');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch approved orders:", error);
        return [];
      }
    },
    enabled: activeTab === "approved", // Only fetch when tab is active
  });

  // Query for order items
  const fetchOrderItems = async (orderId: number) => {
    try {
      // The items are already included in the order data from our API
      // But if we need to fetch them separately:
      const response = await apiRequest('GET', `/api/orders/${orderId}/items`);
      const items = await response.json();
      setOrderItems(items);
      return items;
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      setOrderItems([]);
      return [];
    }
  };

  // Approve order mutation
  const approveMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/approve`, { notes });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order approved",
        description: "The order has been approved successfully.",
      });
      
      // Close dialog and reset form
      setApproveDialogOpen(false);
      setApprovalNotes("");
      setSelectedOrder(null);
      
      // Refetch orders
      refetchPendingOrders();
      refetchApprovedOrders();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject order mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/reject`, { reason });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order rejected",
        description: "The order has been rejected.",
      });
      
      // Close dialog and reset form
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedOrder(null);
      
      // Refetch orders
      refetchPendingOrders();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setViewDetailsOpen(true);
  };

  const handleApproveClick = (order: Order) => {
    setSelectedOrder(order);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (order: Order) => {
    setSelectedOrder(order);
    setRejectDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedOrder) {
      approveMutation.mutate({
        orderId: selectedOrder.id,
        notes: approvalNotes,
      });
    }
  };

  const handleRejectConfirm = () => {
    if (selectedOrder && rejectionReason.trim() !== "") {
      rejectMutation.mutate({
        orderId: selectedOrder.id,
        reason: rejectionReason,
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Order Approvals</h1>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingOrders && pendingOrders.length > 0 && (
              <Badge className="ml-2 bg-primary text-white">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Recently Approved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>
                Orders waiting for your approval before processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrdersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : pendingOrders && pendingOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Requestor</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="hidden md:table-cell">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.jobName || "No job"}</TableCell>
                        <TableCell>{order.requestorName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{order.totalItems}</TableCell>
                        <TableCell className="text-right">{formatCurrency(order.totalPrice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">View</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveClick(order)}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectClick(order)}
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Reject</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <Clock8Icon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No orders pending approval</p>
                  <p className="text-sm mt-1">All caught up! Check back later for new orders.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Recently Approved Orders</CardTitle>
              <CardDescription>
                Orders you have approved in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedOrdersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : approvedOrders && approvedOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Approved</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.jobName || "No job"}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {order.approvalDate ? new Date(order.approvalDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(order.totalPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <AlertTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No approved orders found</p>
                  <p className="text-sm mt-1">You haven't approved any orders recently.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Order Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="text-sm text-gray-500">
                  Order #{selectedOrder.orderNumber} - Requested by {selectedOrder.requestorName} on{' '}
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Job Information</h3>
                  <p className="text-sm">
                    {selectedOrder.jobName || "No job assigned"}
                    {selectedOrder.jobName && ` (ID: ${selectedOrder.jobId})`}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Business</h3>
                  <p className="text-sm">{selectedOrder.businessName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Status</h3>
                  <Badge
                    className={
                      selectedOrder.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedOrder.status === 'pending_approval'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedOrder.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {selectedOrder.status === 'pending_approval'
                      ? 'Pending Approval'
                      : selectedOrder.status.charAt(0).toUpperCase() +
                        selectedOrder.status.slice(1)}
                  </Badge>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-semibold mb-1">Order Notes</h3>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold mb-2">Order Items</h3>
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.length > 0 ? (
                        orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.part.item_code}</TableCell>
                            <TableCell>
                              {item.part.description} - {item.part.type} {item.part.pipeSize}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.priceAtOrder)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.priceAtOrder * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            Loading items...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4">
                <div className="text-sm">
                  Total Items: <span className="font-semibold">{selectedOrder.totalItems}</span>
                </div>
                <div>
                  <span className="text-sm mr-2">Total Amount:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(selectedOrder.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
            {selectedOrder && selectedOrder.status === 'pending_approval' && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setViewDetailsOpen(false);
                    handleApproveClick(selectedOrder);
                  }}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approve Order
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    setViewDetailsOpen(false);
                    handleRejectClick(selectedOrder);
                  }}
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Reject Order
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Order Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this order? This will allow the order to proceed to
              processing and fulfillment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="approvalNotes" className="text-sm font-medium mb-2 block">
              Add notes (optional):
            </label>
            <Textarea
              id="approvalNotes"
              placeholder="Any comments or instructions for this approval..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setApproveDialogOpen(false);
                setApprovalNotes("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Approve Order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Order Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this order? Please provide a reason for the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="rejectionReason" className="text-sm font-medium mb-2 block">
              Reason for rejection: <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="rejectionReason"
              placeholder="Please explain why this order is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
              required
            />
            {rejectionReason.trim() === "" && (
              <p className="text-sm text-red-500 mt-1">
                A reason for rejection is required
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectMutation.isPending || rejectionReason.trim() === ""}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircleIcon className="mr-2 h-4 w-4" />
                  Reject Order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PMLayout>
  );
};

export default OrderApprovals;