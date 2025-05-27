import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Mail, UserCheck, UserX, AlertTriangle, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: string;
}

const NotificationBadge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Get unread notifications count
  const { data: unreadCount, refetch: refetchCount } = useQuery<number>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications/unread/count');
      return await response.json();
    },
  });

  // Get recent notifications (latest 10)
  const { data: notifications, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', 'recent'],
    enabled: !!user && isOpen,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications?limit=10');
      return await response.json();
    },
  });

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('PUT', '/api/notifications/all/read');
      refetchNotifications();
      refetchCount();
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to update notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation_received':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'invitation_accepted':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'invitation_rejected':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'access_removed':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'tradie_removed_confirmation':
        return <Building className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invitation_received':
        return 'border-l-blue-500 bg-blue-50';
      case 'invitation_accepted':
        return 'border-l-green-500 bg-green-50';
      case 'invitation_rejected':
        return 'border-l-red-500 bg-red-50';
      case 'access_removed':
        return 'border-l-orange-500 bg-orange-50';
      case 'tradie_removed_confirmation':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  // Get priority for notification type (higher number = higher priority)
  const getNotificationPriority = (type: string) => {
    switch (type) {
      case 'invitation_received':
        return 3;
      case 'invitation_accepted':
      case 'invitation_rejected':
        return 2;
      case 'access_removed':
      case 'tradie_removed_confirmation':
        return 1;
      default:
        return 0;
    }
  };

  // Sort notifications by priority and then by date
  const sortedNotifications = notifications?.sort((a, b) => {
    const priorityDiff = getNotificationPriority(b.type) - getNotificationPriority(a.type);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) || [];

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              {unreadCount && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <Separator />
          
          <ScrollArea className="h-96">
            <CardContent className="p-0">
              {sortedNotifications.length > 0 ? (
                <div className="space-y-1">
                  {sortedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                        !notification.isRead ? getNotificationColor(notification.type) : 'border-l-gray-200 bg-white'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up! No new notifications.</p>
                </div>
              )}
              
              {sortedNotifications.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to full notifications page
                      window.location.href = user.role === 'tradie' ? '/mobile/notifications' : '/pm/notifications';
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBadge;