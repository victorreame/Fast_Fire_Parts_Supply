import { useState } from "react";
import MobileLayout from "@/components/mobile/layout";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Filter orders based on search query and status
  const filteredOrders = orders
    ? orders.filter((order) => {
        const orderNumber = `ORD-${order.id.toString().padStart(5, '0')}`;
        const matchesSearch = searchQuery
          ? orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        const matchesStatus = statusFilter !== "all" 
          ? order.status === statusFilter
          : true;
        
        return matchesSearch && matchesStatus;
      })
    : [];

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

  return (
    <MobileLayout title="My Orders" showBackButton={false}>
      <div className="p-4 bg-neutral-100 border-b border-neutral-200">
        <div className="relative mb-3">
          <Input
            type="text"
            placeholder="Search by order number..."
            className="w-full p-3 pl-10 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-3.5 text-neutral-400"></i>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="p-4 border-b border-neutral-200">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28 mt-2" />
                    <div className="flex mt-2">
                      <Skeleton className="h-4 w-16 rounded mr-2" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="p-4 border-b border-neutral-200">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">
                    Order #: ORD-{order.id.toString().padStart(5, '0')}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </p>
                  <div className="flex mt-2">
                    <Badge variant="outline" className={getStatusBadgeClass(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-neutral-500 ml-2 flex items-center">
                      {order.items?.length || "0"} items
                    </span>
                  </div>
                </div>
                <Link href={`/order/${order.id}`}>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <i className="fas fa-chevron-right"></i>
                  </Button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No orders found matching your criteria.</p>
            <Link href="/parts">
              <Button variant="outline" className="mt-4">
                Browse Parts
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default OrdersPage;
