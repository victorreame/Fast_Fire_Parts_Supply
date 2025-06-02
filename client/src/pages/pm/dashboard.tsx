import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import PMLayout from "@/components/pm/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ConstructionIcon,
  HardHatIcon,
  CalendarClockIcon,
  BriefcaseIcon,
  PlusIcon,
  MapPinIcon,
  UsersIcon,
  PackageIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ClockIcon,
  FileTextIcon,
  BuildingIcon,
} from "lucide-react";

// Dashboard stats interface
interface DashboardStats {
  pendingApprovals: number;
  activeJobs: number;
  completedJobs: number;
  totalTradies: number;
  jobsThisMonth: number;
  totalJobOrders: number;
  avgJobBudget: number;
  onHoldJobs: number;
  recentOrders: {
    id: number;
    orderNumber: string;
    status: string;
    customerName: string;
    jobName?: string;
    jobNumber?: string;
    createdAt: string;
  }[];
}

// Job interface for dashboard
interface Job {
  id: number;
  name: string;
  jobNumber: string;
  status: string;
  location?: string;
  budget?: number;
  createdAt: string;
  tradieCount: number;
  orderCount: number;
}

// Recent notifications interface
interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();

  // Query for dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/pm/dashboard/stats'],
  });

  // Query for recent jobs
  const { data: recentJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/jobs?limit=5&sort=recent');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        return [];
      }
    },
  });

  // Query for pending orders by job
  const { data: pendingOrdersByJob, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/pm/orders/pending/by-job'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/pm/orders/pending/by-job');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch pending orders by job:", error);
        return [];
      }
    },
  });

  // Query for recent notifications
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{notifications: Notification[]}>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications?limit=5');
        if (!response.ok) return { notifications: [] };
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { notifications: [] };
      }
    },
  });

  const notifications = notificationsData?.notifications || [];

  // Helper functions for job status colors
  const getJobStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'on_hold': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link href="/pm/jobs">
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <PlusIcon className="h-4 w-4" />
              New Job
            </Button>
          </Link>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Welcome back, {user?.firstName}!</h2>
        
        {/* Enhanced Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Jobs */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Active Jobs</CardTitle>
              <BriefcaseIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-blue-700">
                  {stats?.activeJobs || 0}
                  <Link href="/pm/jobs">
                    <Button variant="ghost" size="sm" className="ml-2 text-xs text-blue-600 hover:text-blue-700">
                      View All
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Pending Approvals</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-orange-700">
                  {stats?.pendingApprovals || 0}
                  <Link href="/pm/approvals">
                    <Button variant="ghost" size="sm" className="ml-2 text-xs text-orange-600 hover:text-orange-700">
                      Review
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs This Month */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Jobs This Month</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-700">
                  {stats?.jobsThisMonth || 0}
                  <div className="text-xs text-green-600 mt-1">
                    +{((stats?.jobsThisMonth || 0) * 100 / Math.max((stats?.activeJobs || 1), 1)).toFixed(0)}% growth
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Average Job Budget */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Avg Job Budget</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(stats?.avgJobBudget || 0)}
                  <div className="text-xs text-purple-600 mt-1">
                    {stats?.totalJobOrders || 0} total orders
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Jobs */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5" />
                My Recent Jobs
              </CardTitle>
              <Link href="/pm/jobs">
                <Button variant="outline" size="sm">
                  View All Jobs
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
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
                  {recentJobs.slice(0, 5).map((job) => (
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
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
                              {job.tradieCount} tradies
                            </span>
                            <span className="flex items-center gap-1">
                              <PackageIcon className="h-3 w-3" />
                              {job.orderCount} orders
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={job.status === 'active' ? 'default' : job.status === 'completed' ? 'secondary' : 'outline'}>
                          {job.status}
                        </Badge>
                        <Link href={`/pm/jobs/${job.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No jobs found</p>
                  <Link href="/pm/jobs">
                    <Button className="mt-4" size="sm">
                      Create Your First Job
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Orders by Job */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Pending Orders by Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                  ))}
                </div>
              ) : pendingOrdersByJob && pendingOrdersByJob.length > 0 ? (
                <div className="space-y-3">
                  {pendingOrdersByJob.slice(0, 6).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.jobName || `Job #${item.jobNumber}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.orderCount} pending order{item.orderCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {item.orderCount}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/pm/approvals">
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      View All Pending
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2Icon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No pending orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <Link href="/pm/notifications">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent notifications</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BuildingIcon className="h-5 w-5" />
                Job Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Active Jobs Progress */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Active Jobs</span>
                  </div>
                  <span className="text-sm font-bold">{stats?.activeJobs || 0}</span>
                </div>

                {/* Completed Jobs Progress */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-sm font-medium">Completed Jobs</span>
                  </div>
                  <span className="text-sm font-bold">{stats?.completedJobs || 0}</span>
                </div>

                {/* On Hold Jobs */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium">On Hold Jobs</span>
                  </div>
                  <span className="text-sm font-bold">{stats?.onHoldJobs || 0}</span>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Link href="/pm/jobs" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Jobs
                      </Button>
                    </Link>
                    <Link href="/pm/tradies" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Tradies
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PMLayout>
  );
};

export default Dashboard;