import React from "react";
import { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface OrdersTableProps {
  orders: (Order & { business: any; items: any[] })[];
}

const ResponsiveOrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-blue-100 text-blue-800">New</Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-green-100 text-green-800">Shipped</Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Display as cards on mobile
  const mobileView = (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden border border-neutral-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-base text-neutral-900">
                  ORD-{order.id.toString().padStart(5, '0')}
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "N/A"}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <p className="text-neutral-500">Customer:</p>
                <p className="font-medium">{order.business?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-neutral-500">Price Tier:</p>
                <p className="font-medium">{order.business?.priceTier || "T3"}</p>
              </div>
              <div>
                <p className="text-neutral-500">Items:</p>
                <p className="font-medium">{order.items?.length || 0}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-neutral-200 flex justify-end">
              <Link href={`/supplier/orders/${order.id}`}>
                <Button size="sm" className="text-primary bg-primary/10 hover:bg-primary/20">
                  View Order
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Display as table on desktop
  const desktopView = (
    <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Order ID
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Customer
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total Items
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Price Tier
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-neutral-200">
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  ORD-{order.id.toString().padStart(5, '0')}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {order.business?.name || "Unknown"}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "N/A"}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {order.items?.length || 0}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {order.business?.priceTier || "T3"}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/supplier/orders/${order.id}`}>
                    <Button variant="link" className="text-primary hover:text-primary-900">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
};

export default ResponsiveOrdersTable;