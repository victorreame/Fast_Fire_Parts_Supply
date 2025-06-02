import { Link } from "wouter";
import SupplierLayout from "@/components/supplier/layout";
import StatsCard from "@/components/supplier/stats-card";
import ResponsiveOrdersTable from "@/components/supplier/responsive-orders-table";
import { useQuery } from "@tanstack/react-query";
import { FaShoppingCart, FaTruck, FaUsers, FaExclamationTriangle } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BriefcaseIcon, 
  TrendingUpIcon, 
  BuildingIcon, 
  MapPinIcon,
  CalendarIcon,
  DollarSignIcon 
} from "lucide-react";

const SupplierDashboard = () => {
  const { data: stats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders?limit=5'],
  });

  // Query for recent jobs across all businesses
  const { data: recentJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs?limit=10&all=true'],
  });

  // Query for job analytics
  const { data: jobAnalytics = {}, isLoading: isLoadingJobAnalytics } = useQuery({
    queryKey: ['/api/analytics/jobs'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getJobStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'on_hold': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <SupplierLayout>
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-neutral-800">Dashboard</h2>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
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

      {/* Job Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
            <Button variant="outline" size="sm">
              View All Jobs
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingJobs ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentJobs && recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${getJobStatusColor(job.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>#{job.jobNumber}</span>
                          {job.businessName && (
                            <span className="flex items-center gap-1">
                              <BuildingIcon className="h-3 w-3" />
                              {job.businessName}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.status === 'active' ? 'default' : job.status === 'completed' ? 'secondary' : 'outline'}>
                        {job.status}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent jobs found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Job Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingJobAnalytics ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Jobs Created This Month */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Jobs This Month</span>
                  </div>
                  <span className="text-sm font-bold">{jobAnalytics.jobsThisMonth || 0}</span>
                </div>

                {/* Most Active Business */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Most Active Business</span>
                  </div>
                  <span className="text-xs text-gray-600">{jobAnalytics.mostActiveBusiness || 'N/A'}</span>
                </div>

                {/* Average Job Value */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSignIcon className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Avg Job Value</span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(jobAnalytics.avgJobValue || 0)}
                  </span>
                </div>

                {/* Job Completion Rate */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Completion Rate</span>
                  </div>
                  <span className="text-sm font-bold">
                    {jobAnalytics.completionRate || 0}%
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      View Job Reports
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Inventory Forecast
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-neutral-800">Recent Orders</h3>
          <Link href="/supplier/orders" className="text-primary hover:text-primary-700 text-xs sm:text-sm font-medium">
              View All Orders
          </Link>
        </div>
        
        {isLoadingOrders ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-8">
            <Skeleton className="h-48 md:h-64 w-full" />
          </div>
        ) : (
          <ResponsiveOrdersTable orders={orders} />
        )}
      </div>
    </SupplierLayout>
  );
};

export default SupplierDashboard;
