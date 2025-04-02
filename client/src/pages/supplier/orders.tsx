import { useState } from "react";
import SupplierLayout from "@/components/supplier/layout";
import OrdersTable from "@/components/supplier/orders-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const SupplierOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Filter orders based on search query and status
  const filteredOrders = orders
    ? orders.filter((order) => {
        const matchesSearch = searchQuery
          ? (order.business?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             `ORD-${order.id.toString().padStart(5, '0')}`.includes(searchQuery))
          : true;
        
        const matchesStatus = statusFilter !== "all" 
          ? order.status === statusFilter
          : true;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <SupplierLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Orders</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search orders by customer or order ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-neutral-400"></i>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <OrdersTable orders={filteredOrders} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          <p className="text-neutral-500">No orders found matching your criteria.</p>
        </div>
      )}
    </SupplierLayout>
  );
};

export default SupplierOrders;
