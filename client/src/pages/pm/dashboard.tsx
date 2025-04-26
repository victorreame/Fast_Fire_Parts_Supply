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
} from "lucide-react";

// Dashboard stats interface
interface DashboardStats {
  pendingApprovals: number;
  activeJobs: number;
  completedJobs: number;
  totalTradies: number;
  recentOrders: {
    id: number;
    orderNumber: string;
    status: string;
    customerName: string;
    createdAt: string;
  }[];
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

  // Query for recent notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications?limit=5');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
  });

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Welcome back, {user?.firstName}!</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Approvals */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.pendingApprovals || 0}
                  <Link href="/pm/approvals">
                    <Button variant="link" className="text-xs ml-2 h-auto p-0">
                      View all
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Active Jobs */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <ConstructionIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.activeJobs || 0}
                  <Link href="/pm/jobs">
                    <Button variant="link" className="text-xs ml-2 h-auto p-0">
                      Manage
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Completed Jobs */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle2Icon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.completedJobs || 0}</div>
              )}
            </CardContent>
          </Card>
          
          {/* Tradies Assigned */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tradies</CardTitle>
              <HardHatIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.totalTradies || 0}
                  <Link href="/pm/tradies">
                    <Button variant="link" className="text-xs ml-2 h-auto p-0">
                      Manage
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="col-span-2 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center">
                      <ClipboardListIcon className="h-8 w-8 text-gray-400 mr-4" />
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.customerName}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className={`mr-2 ${
                        order.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending_approval' ? 'Pending Approval' : 
                         order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <div className="text-sm text-gray-500 hidden md:block">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Link href="/pm/approvals">
                    <Button variant="outline" size="sm">View All Orders</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No recent orders
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <Link href="/pm/notifications">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Alert key={notification.id} className={`py-3 ${!notification.isRead ? 'bg-primary-50' : ''}`}>
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        {notification.type === 'approval' && <AlertCircleIcon className="h-4 w-4 text-yellow-500" />}
                        {notification.type === 'order' && <ClipboardListIcon className="h-4 w-4 text-blue-500" />}
                        {notification.type === 'job' && <ConstructionIcon className="h-4 w-4 text-green-500" />}
                        {notification.type === 'user' && <HardHatIcon className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="flex-1">
                        <AlertTitle className="text-sm font-medium mb-1">{notification.title}</AlertTitle>
                        <AlertDescription className="text-xs text-gray-500">
                          {notification.message}
                        </AlertDescription>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        <CalendarClockIcon className="h-3 w-3 inline mr-1" />
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No new notifications
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PMLayout>
  );
};

export default Dashboard;