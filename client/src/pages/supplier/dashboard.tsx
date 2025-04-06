import { Link } from "wouter";
import SupplierLayout from "@/components/supplier/layout";
import StatsCard from "@/components/supplier/stats-card";
import OrdersTable from "@/components/supplier/orders-table";
import { useQuery } from "@tanstack/react-query";
import { FaShoppingCart, FaTruck, FaUsers, FaExclamationTriangle } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";

const SupplierDashboard = () => {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders?limit=5'],
  });

  return (
    <SupplierLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Dashboard</h2>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {isLoadingStats ? (
          // Skeleton loaders for stats
          Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            ))
        ) : (
          <>
            <StatsCard
              title="New Orders"
              value={stats?.newOrders || 0}
              change="12% from last week"
              changeType="positive"
              icon={<FaShoppingCart />}
              iconBgColor="bg-primary-100"
              iconColor="text-primary-600"
            />

            <StatsCard
              title="Pending Shipments"
              value={stats?.pendingShipments || 0}
              change="Same as last week"
              changeType="neutral"
              icon={<FaTruck />}
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />

            <StatsCard
              title="Active Customers"
              value={stats?.activeCustomers || 0}
              change="8% from last month"
              changeType="positive"
              icon={<FaUsers />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />

            <StatsCard
              title="Low Stock Items"
              value={stats?.lowStockItems || 0}
              change={`${stats?.lowStockItems || 0} more than last week`}
              changeType="negative"
              icon={<FaExclamationTriangle />}
              iconBgColor="bg-red-100"
              iconColor="text-red-600"
            />
          </>
        )}
      </div>

      {/* Recent Orders Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-neutral-800">Recent Orders</h3>
          <Link href="/supplier/orders" className="text-primary hover:text-primary-700 text-sm font-medium">
              View All Orders
          </Link>
        </div>
        
        {isLoadingOrders ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <OrdersTable orders={orders || []} />
        )}
      </div>
    </SupplierLayout>
  );
};

export default SupplierDashboard;
