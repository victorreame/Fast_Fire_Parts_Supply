import { useParams, useLocation } from "wouter";
import SupplierLayout from "@/components/supplier/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const SupplierOrderDetails = () => {
  const { id } = useParams();
  const orderId = parseInt(id);
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Find the order from the orders query result
  const order = orders?.find((o) => o.id === orderId);

  const updateOrderMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PUT", `/api/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order updated",
        description: "Order status has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    updateOrderMutation.mutate(status);
  };

  if (!order && !isLoading) {
    return (
      <SupplierLayout>
        <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Order Not Found</h2>
          <p className="text-neutral-500 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/supplier/orders")}>
            Back to Orders
          </Button>
        </div>
      </SupplierLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case "shipped":
        return <Badge className="bg-green-100 text-green-800">Shipped</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formattedDate = order?.createdAt 
    ? format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")
    : "";

  // Calculate total price
  const totalPrice = order?.items?.reduce((sum, item) => {
    return sum + (item.priceAtOrder * item.quantity);
  }, 0) || 0;

  return (
    <SupplierLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">
          Order Details
        </h2>
        <Button variant="outline" onClick={() => navigate("/supplier/orders")}>
          Back to Orders
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order #: ORD-{order.id.toString().padStart(5, '0')}</CardTitle>
                <CardDescription>{formattedDate}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Status</h3>
                    <div className="flex items-center justify-between">
                      <div>{getStatusBadge(order.status)}</div>
                      <Select value={newStatus || order.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Customer</h3>
                    <p>{order.business?.name || "Unknown"}</p>
                  </div>
                  
                  {order.business?.address && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Address</h3>
                      <p>{order.business.address}</p>
                    </div>
                  )}
                  
                  {order.business?.phone && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Phone</h3>
                      <p>{order.business.phone}</p>
                    </div>
                  )}
                  
                  {order.business?.email && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Email</h3>
                      <p>{order.business.email}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Price Tier</h3>
                    <p>{order.business?.priceTier || "T3"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Total</h3>
                    <p className="text-lg font-bold">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {order.items?.length || 0} items in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.part.itemCode}
                        </TableCell>
                        <TableCell>{item.part.description}</TableCell>
                        <TableCell>{item.part.pipeSize}</TableCell>
                        <TableCell>{item.part.type}</TableCell>
                        <TableCell>{formatPrice(item.priceAtOrder)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.priceAtOrder * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={6} className="text-right font-bold">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatPrice(totalPrice)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </SupplierLayout>
  );
};

export default SupplierOrderDetails;
