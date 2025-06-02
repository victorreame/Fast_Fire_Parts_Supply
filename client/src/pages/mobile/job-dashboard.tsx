import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  BriefcaseIcon,
  MapPinIcon,
  UsersIcon,
  PackageIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SearchIcon,
  PhoneIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  DollarSignIcon,
} from "lucide-react";

// Job interface for mobile dashboard
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
  projectManagerId?: number;
  projectManagerName?: string;
  projectManagerPhone?: string;
}

// User job stats interface
interface JobStats {
  assignedJobs: number;
  completedJobs: number;
  activeOrders: number;
  totalOrderValue: number;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    status: string;
    jobName: string;
    jobNumber: string;
    amount: number;
    createdAt: string;
  }>;
}

const JobDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Query for user's assigned jobs
  const { data: userJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['/api/user/jobs'],
    enabled: !!user,
  });

  // Query for job statistics
  const { data: jobStats, isLoading: statsLoading } = useQuery<JobStats>({
    queryKey: ['/api/user/job-stats'],
    enabled: !!user,
  });

  // Query for current job (if selected)
  const { data: currentJob, isLoading: currentJobLoading } = useQuery<Job>({
    queryKey: ['/api/jobs', selectedJobId],
    enabled: !!selectedJobId,
  });

  const activeJobs = userJobs?.filter(job => job.status === 'active') || [];
  const displayJob = currentJob || (activeJobs.length > 0 ? activeJobs[0] : null);

  // Helper functions
  const getJobStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'on_hold': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'destructive';
      default: return 'outline';
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

  if (jobsLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!userJobs || userJobs.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Jobs Assigned</h3>
          <p className="text-gray-500 mb-6">
            You haven't been assigned to any jobs yet. Contact your project manager to get started.
          </p>
          <Link href="/mobile/parts">
            <Button variant="outline">
              Browse Parts Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Current Job Selector */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        
        {/* Current Job Selector */}
        {activeJobs.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Job</label>
            <Select value={selectedJobId?.toString() || ""} onValueChange={(value) => setSelectedJobId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select current job" />
              </SelectTrigger>
              <SelectContent>
                {activeJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.name} (#{job.jobNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Assigned Jobs</p>
                <p className="text-2xl font-bold text-blue-900">
                  {statsLoading ? <Skeleton className="h-6 w-8" /> : jobStats?.assignedJobs || userJobs.length}
                </p>
              </div>
              <BriefcaseIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Orders</p>
                <p className="text-2xl font-bold text-green-900">
                  {statsLoading ? <Skeleton className="h-6 w-8" /> : jobStats?.activeOrders || 0}
                </p>
              </div>
              <PackageIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Job Information */}
      {displayJob && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getJobStatusColor(displayJob.status)}`} />
                Current Job
              </CardTitle>
              <Badge variant={getJobStatusBadge(displayJob.status)}>
                {displayJob.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{displayJob.name}</h3>
              <p className="text-sm text-gray-600">Job #{displayJob.jobNumber}</p>
            </div>

            {displayJob.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4" />
                {displayJob.location}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 text-gray-500" />
                <span>{displayJob.tradieCount} tradies</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <PackageIcon className="h-4 w-4 text-gray-500" />
                <span>{displayJob.orderCount} orders</span>
              </div>
            </div>

            {/* Project Manager Contact */}
            {displayJob.projectManagerName && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Project Manager</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{displayJob.projectManagerName}</p>
                  <div className="flex gap-2">
                    {displayJob.projectManagerPhone && (
                      <Button size="sm" variant="outline" className="px-2">
                        <PhoneIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="px-2">
                      <MessageSquareIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link href={`/mobile/parts?job=${displayJob.id}`}>
                <Button className="w-full" size="sm">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search Parts
                </Button>
              </Link>
              <Link href={`/mobile/cart?job=${displayJob.id}`}>
                <Button variant="outline" className="w-full" size="sm">
                  <ShoppingCartIcon className="h-4 w-4 mr-2" />
                  View Cart
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Assigned Jobs List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">My Assigned Jobs</CardTitle>
          <Button variant="ghost" size="sm">
            <ClockIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {userJobs.map((job) => (
            <div key={job.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getJobStatusColor(job.status)}`} />
                  <h4 className="font-medium text-sm">{job.name}</h4>
                </div>
                <Badge variant={getJobStatusBadge(job.status)} className="text-xs">
                  {job.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>#{job.jobNumber}</span>
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" />
                    {job.tradieCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <PackageIcon className="h-3 w-3" />
                    {job.orderCount}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setSelectedJobId(job.id)}
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Orders by Job */}
      {jobStats?.recentOrders && jobStats.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobStats.recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {order.jobName} (#{order.jobNumber})
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={order.status === 'approved' ? 'default' : order.status === 'pending_approval' ? 'secondary' : 'outline'} className="text-xs">
                    {order.status === 'pending_approval' ? 'Pending' : order.status}
                  </Badge>
                  <span className="text-xs font-medium">{formatCurrency(order.amount)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Personal Job Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            My Job Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : jobStats?.completedJobs || 0}
              </p>
              <p className="text-sm text-gray-600">Completed Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatCurrency(jobStats?.totalOrderValue || 0)}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Job completion rate</span>
              <span className="text-sm font-medium">
                {jobStats?.assignedJobs && jobStats.assignedJobs > 0 
                  ? Math.round((jobStats.completedJobs / jobStats.assignedJobs) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobDashboard;