import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BellRing, Check, X, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MobileNavbar from "@/components/mobile/navbar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

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

interface TradieInvitation {
  id: number;
  projectManagerId: number;
  status: string;
  notes?: string;
  invitationDate: string;
  projectManagerName?: string;
}

const MobileNotificationsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [, navigate] = useLocation();

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    staleTime: 30000 // 30 seconds
  });

  // Fetch PM invitations
  const { data: invitations, isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery<TradieInvitation[]>({
    queryKey: ['/api/tradies/invitations'],
    staleTime: 30000, // 30 seconds
    enabled: user?.role === 'contractor', // Only fetch if user is a tradie
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("PUT", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      refetchNotifications();
    }
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest("POST", `/api/tradies/invitations/${invitationId}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: "Invitation Accepted",
        description: "You've accepted the Project Manager's invitation. Your access has been expanded.",
      });
      refetchInvitations();
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Accept",
        description: error.message || "An error occurred while processing your request.",
        variant: "destructive",
      });
    }
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest("POST", `/api/tradies/invitations/${invitationId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Invitation Declined",
        description: "You've declined the Project Manager's invitation.",
      });
      refetchInvitations();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Decline",
        description: error.message || "An error occurred while processing your request.",
        variant: "destructive",
      });
    }
  });

  // Auto-refresh notifications every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refetchNotifications();
      refetchInvitations();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [refetchNotifications, refetchInvitations]);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'order_status' && notification.relatedId) {
      navigate(`/order/${notification.relatedId}`);
    } else if (notification.type === 'job_assignment' && notification.relatedId) {
      navigate(`/job/${notification.relatedId}`);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread'
      ? notifications?.filter(n => !n.isRead)
      : activeTab === 'connections'
        ? notifications?.filter(n => n.type === 'connection_request' || n.type === 'connection_accepted')
        : notifications?.filter(n => n.type === activeTab);

  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {notifications?.filter(n => !n.isRead).length > 0 && (
                <Badge className="ml-2 bg-red-500">{notifications.filter(n => !n.isRead).length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="connections">
              Connections
              {pendingInvitations.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingInvitations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="p-4">
          {notificationsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <BellRing className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-180px)]">
              {pendingInvitations.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm mb-2 text-gray-500">CONNECTION REQUESTS</h3>
                  {pendingInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={() => acceptInvitationMutation.mutate(invitation.id)}
                      onReject={() => rejectInvitationMutation.mutate(invitation.id)}
                      isPending={acceptInvitationMutation.isPending || rejectInvitationMutation.isPending}
                    />
                  ))}
                </div>
              )}
              <div>
                <h3 className="font-medium text-sm mb-2 text-gray-500">NOTIFICATIONS</h3>
                {filteredNotifications?.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="unread" className="p-4">
          {notificationsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredNotifications?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Check className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>No unread notifications</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-180px)]">
              {filteredNotifications?.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="connections" className="p-4">
          {invitationsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : pendingInvitations.length === 0 && !notifications?.find(n => n.type === 'connection_request' || n.type === 'connection_accepted') ? (
            <div className="text-center py-10 text-gray-500">
              <User className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>No connection requests</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-180px)]">
              {pendingInvitations.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-sm mb-2 text-gray-500">PENDING REQUESTS</h3>
                  {pendingInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={() => acceptInvitationMutation.mutate(invitation.id)}
                      onReject={() => rejectInvitationMutation.mutate(invitation.id)}
                      isPending={acceptInvitationMutation.isPending || rejectInvitationMutation.isPending}
                    />
                  ))}
                </div>
              )}
              {notifications?.filter(n => n.type === 'connection_request' || n.type === 'connection_accepted').length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2 text-gray-500">CONNECTION HISTORY</h3>
                  {notifications
                    .filter(n => n.type === 'connection_request' || n.type === 'connection_accepted')
                    .map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                      />
                    ))}
                </div>
              )}
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      <MobileNavbar />
    </div>
  );
};

// Notification Card Component
const NotificationCard = ({ notification, onClick }: { notification: Notification, onClick: () => void }) => {
  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'order_status':
        return <Badge className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">OS</Badge>;
      case 'connection_request':
      case 'connection_accepted':
        return <User className="h-6 w-6 text-green-600" />;
      case 'job_assignment':
        return <Badge className="h-8 w-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">JA</Badge>;
      default:
        return <BellRing className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <Card
      className={`mb-3 p-3 cursor-pointer transition-colors ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className={`font-semibold text-sm ${notification.isRead ? 'text-gray-800' : 'text-black'}`}>{notification.title}</h3>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
      </div>
      {!notification.isRead && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></div>
      )}
    </Card>
  );
};

// Invitation Card Component
const InvitationCard = ({ 
  invitation, 
  onAccept, 
  onReject, 
  isPending 
}: { 
  invitation: TradieInvitation, 
  onAccept: () => void, 
  onReject: () => void,
  isPending: boolean
}) => {
  return (
    <Card className="mb-3 p-4 border-l-4 border-l-yellow-500">
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold">Connection Request</h3>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(invitation.invitationDate), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm mb-4">
          {invitation.projectManagerName || `Project Manager (ID: ${invitation.projectManagerId})`} is requesting to connect with you. 
          {invitation.notes && <span className="block mt-2 italic">"${invitation.notes}"</span>}
        </p>
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={onReject}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
            Decline
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={onAccept}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MobileNotificationsPage;