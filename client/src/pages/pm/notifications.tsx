import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PMLayout from "@/components/pm/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellIcon,
  BellOffIcon,
  CheckCircleIcon,
  TrashIcon,
  EyeIcon,
  ClipboardListIcon,
  ConstructionIcon,
  UsersIcon,
  Loader2Icon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Notification interface
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  entityId: number | null;
  entityType: string | null;
  createdAt: string;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Queries
  const {
    data: notifications,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/notifications');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
  });

  // Filter notifications based on active tab
  const filteredNotifications = notifications?.filter((notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'order') return notification.type === 'order';
    if (activeTab === 'job') return notification.type === 'job';
    if (activeTab === 'user') return notification.type === 'user';
    return true;
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const response = await apiRequest('PUT', '/api/notifications/mark-read', { ids: notificationIds });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications marked as read",
        description: `${selectedNotifications.length} notification(s) marked as read.`,
      });
      
      // Reset selected notifications
      setSelectedNotifications([]);
      setSelectAll(false);
      
      // Refetch notifications
      refetchNotifications();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationsMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const response = await apiRequest('DELETE', '/api/notifications', { ids: notificationIds });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications deleted",
        description: `${selectedNotifications.length} notification(s) deleted.`,
      });
      
      // Reset selected notifications
      setSelectedNotifications([]);
      setSelectAll(false);
      
      // Refetch notifications
      refetchNotifications();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', '/api/notifications/mark-all-read', {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read.",
      });
      
      // Reset selected notifications
      setSelectedNotifications([]);
      setSelectAll(false);
      
      // Refetch notifications
      refetchNotifications();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && filteredNotifications) {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, id]);
    } else {
      setSelectedNotifications(prev => prev.filter(nId => nId !== id));
    }
  };

  const handleMarkAsRead = () => {
    if (selectedNotifications.length === 0) return;
    markAsReadMutation.mutate(selectedNotifications);
  };

  const handleDeleteNotifications = () => {
    if (selectedNotifications.length === 0) return;
    deleteNotificationsMutation.mutate(selectedNotifications);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ClipboardListIcon className="h-5 w-5 text-blue-500" />;
      case 'job':
        return <ConstructionIcon className="h-5 w-5 text-green-500" />;
      case 'user':
        return <UsersIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatNotificationTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getEntityLink = (notification: Notification) => {
    if (!notification.entityType || !notification.entityId) return null;
    
    switch (notification.entityType) {
      case 'order':
        return `/pm/approvals?id=${notification.entityId}`;
      case 'job':
        return `/pm/jobs?id=${notification.entityId}`;
      case 'user':
        return `/pm/tradies?id=${notification.entityId}`;
      default:
        return null;
    }
  };

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 mr-2" />
            )}
            Mark All as Read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Notification Center</CardTitle>
              <CardDescription>
                View and manage your notifications
              </CardDescription>
            </div>
            {selectedNotifications.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={markAsReadMutation.isPending}
                >
                  {markAsReadMutation.isPending ? (
                    <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <EyeIcon className="h-4 w-4 mr-1" />
                  )}
                  Mark as Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteNotifications}
                  disabled={deleteNotificationsMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  {deleteNotificationsMutation.isPending ? (
                    <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <TrashIcon className="h-4 w-4 mr-1" />
                  )}
                  Delete
                </Button>
              </div>
            )}
          </div>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="order">Orders</TabsTrigger>
              <TabsTrigger value="job">Jobs</TabsTrigger>
              <TabsTrigger value="user">Users</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredNotifications && filteredNotifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all notifications"
                    />
                  </TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[120px] text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => {
                  const entityLink = getEntityLink(notification);
                  
                  return (
                    <TableRow key={notification.id} className={!notification.isRead ? "bg-primary-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNotifications.includes(notification.id)}
                          onCheckedChange={(checked) => handleSelectNotification(notification.id, !!checked)}
                          aria-label={`Select notification ${notification.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {notification.title}
                              {!notification.isRead && (
                                <Badge variant="secondary" className="ml-2">New</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{notification.message}</div>
                            {entityLink && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-blue-600"
                                asChild
                              >
                                <a href={entityLink}>View details</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            notification.type === 'order'
                              ? 'text-blue-700 bg-blue-50'
                              : notification.type === 'job'
                              ? 'text-green-700 bg-green-50'
                              : notification.type === 'user'
                              ? 'text-orange-700 bg-orange-50'
                              : ''
                          }
                        >
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {formatNotificationTime(notification.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <BellOffIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No notifications found</p>
              <p className="text-sm mt-1">
                {activeTab === 'all'
                  ? "You're all caught up"
                  : activeTab === 'unread'
                  ? "No unread notifications"
                  : `No ${activeTab} notifications`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PMLayout>
  );
};

export default NotificationsPage;