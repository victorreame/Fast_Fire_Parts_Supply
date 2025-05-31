import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PMLayout from "@/components/pm/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Mail, UserCheck, UserX, AlertTriangle, Building, Search, Filter, CheckCircle, Clock, Loader2 } from "lucide-react";

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

const PMNotificationsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Get all notifications with filtering and pagination
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/notifications', activeTab, searchQuery, typeFilter, page],
    enabled: !!user,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(activeTab !== 'all' && { read: activeTab === 'read' ? 'true' : 'false' }),
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });
      
      const response = await apiRequest('GET', `/api/notifications?${params}`);
      return await response.json();
    },
  });

  const notifications: Notification[] = notificationsData?.notifications || [];
  const totalCount = notificationsData?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get unread count
  const { data: unreadCountData } = useQuery<{count: number}>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = unreadCountData?.count || 0;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', '/api/notifications/all/read');
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk mark selected as read
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  
  const markSelectedAsReadMutation = useMutation({
    mutationFn: async (notificationIds: number[]) => {
      await Promise.all(
        notificationIds.map(id => apiRequest('PUT', `/api/notifications/${id}/read`))
      );
    },
    onSuccess: () => {
      toast({
        title: "Selected notifications marked as read",
        description: `${selectedNotifications.length} notifications updated.`,
      });
      setSelectedNotifications([]);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation_received':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'invitation_accepted':
        return <UserCheck className="h-5 w-5 text-green-600" />;
      case 'invitation_rejected':
        return <UserX className="h-5 w-5 text-red-600" />;
      case 'access_removed':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'tradie_removed_confirmation':
        return <Building className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invitation_received':
        return 'border-l-blue-500';
      case 'invitation_accepted':
        return 'border-l-green-500';
      case 'invitation_rejected':
        return 'border-l-red-500';
      case 'access_removed':
        return 'border-l-orange-500';
      case 'tradie_removed_confirmation':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-500';
    }
  };

  // Format notification type for display
  const formatNotificationType = (type: string) => {
    switch (type) {
      case 'invitation_received':
        return 'Invitation Received';
      case 'invitation_accepted':
        return 'Invitation Accepted';
      case 'invitation_rejected':
        return 'Invitation Rejected';
      case 'access_removed':
        return 'Access Removed';
      case 'tradie_removed_confirmation':
        return 'Access Updated';
      default:
        return 'General';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Handle notification selection
  const toggleNotificationSelection = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    setSelectedNotifications(unreadIds);
  };

  const handleDeselectAll = () => {
    setSelectedNotifications([]);
  };

  // Filter notifications by tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      case 'invitations':
        return notifications.filter(n => 
          ['invitation_received', 'invitation_accepted', 'invitation_rejected'].includes(n.type)
        );
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <PMLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with invitations, responses, and team changes
            </p>
          </div>
          
          {unreadCount && unreadCount > 0 && (
            <Button 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invitation_received">Invitations Received</SelectItem>
                  <SelectItem value="invitation_accepted">Acceptances</SelectItem>
                  <SelectItem value="invitation_rejected">Rejections</SelectItem>
                  <SelectItem value="tradie_removed_confirmation">Access Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount || 0})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations
            </TabsTrigger>
            <TabsTrigger value="read">
              Read
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedNotifications.length} notification(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                      >
                        Deselect All
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => markSelectedAsReadMutation.mutate(selectedNotifications)}
                        disabled={markSelectedAsReadMutation.isPending}
                      >
                        Mark as Read
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {activeTab === 'unread' && filteredNotifications.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Quick actions for unread notifications
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        Select All Unread
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications List */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      getNotificationColor(notification.type)
                    } ${!notification.isRead ? 'bg-blue-50/30' : ''} ${
                      selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={() => toggleNotificationSelection(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <CardTitle className={`text-base ${
                                !notification.isRead ? 'font-semibold' : 'font-medium text-gray-700'
                              }`}>
                                {notification.title}
                              </CardTitle>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            
                            <CardDescription className={`mt-1 ${
                              !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.message}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="text-xs">
                            {formatNotificationType(notification.type)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No notifications found
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'unread' 
                        ? "You're all caught up! No unread notifications." 
                        : searchQuery || typeFilter !== 'all'
                        ? "Try adjusting your filters to see more notifications."
                        : "You don't have any notifications yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PMLayout>
  );
};

export default PMNotificationsPage;