import { useParams, useLocation } from "wouter";
import MobileLayout from "@/components/mobile/layout";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
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

const OrderDetailsPage = () => {
  const { id } = useParams();
  const orderId = parseInt(id);
  const [_, navigate] = useLocation();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Find the order from the orders query result
  const order = orders?.find((o) => o.id === orderId);

  if (!order && !isLoading) {
    return (
      <MobileLayout title="Order Not Found" showBackButton={true}>
        <div className="p-8 text-center">
          <p className="text-neutral-500">The order you're looking for doesn't exist.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const formattedDate = order?.createdAt 
    ? format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")
    : "";

  return (
    <MobileLayout title="Order Details" showBackButton={true}>
      {isLoading ? (
        <div className="p-4">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="p-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">
                Order #: ORD-{order.id.toString().padStart(5, '0')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Date:</span>
                  <span className="text-sm font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Status:</span>
                  <Badge className={getStatusBadgeClass(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Items:</span>
                  <span className="text-sm font-medium">{order.items?.length || 0}</span>
                </div>
                {order.jobId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Job:</span>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm"
                      onClick={() => navigate(`/job/${order.jobId}`)}
                    >
                      View Job
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <h3 className="font-semibold mb-2">Order Items</h3>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.part.itemCode}</div>
                        <div className="text-sm text-neutral-500">{item.part.description}</div>
                        <div className="text-xs text-neutral-400">{item.part.pipeSize} | {item.part.type}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {["new", "processing"].includes(order.status) && (
            <div className="mt-6">
              <Button variant="secondary" className="w-full" onClick={() => navigate("/parts")}>
                Add More Parts
              </Button>
            </div>
          )}
        </div>
      )}
    </MobileLayout>
  );
};

export default OrderDetailsPage;
