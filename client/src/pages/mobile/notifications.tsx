import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/mobile/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { BellRing, Check, X, User, Bell, Loader2 } from "lucide-react";

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

const NotificationsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invitations");

  // Get all notifications for the current user
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  // Get tradie invitations
  const { data: invitations, isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery({
    queryKey: ['/api/tradies/invitations'],
    enabled: !!user && user.role === 'tradie',
    onError: (error: Error) => {
      toast({
        title: "Error loading invitations",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest('POST', `/api/tradies/invitations/${invitationId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation accepted",
        description: "You've accepted the invitation from the project manager.",
      });
      refetchInvitations();
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error accepting invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest('POST', `/api/tradies/invitations/${invitationId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation rejected",
        description: "You've rejected the invitation from the project manager.",
      });
      refetchInvitations();
      refetchNotifications();
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      refetchNotifications();
    }
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', '/api/notifications/all/read');
    },
    onSuccess: () => {
      refetchNotifications();
      toast({
        title: "All notifications marked as read",
      });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleAcceptInvitation = (invitationId: number) => {
    acceptInvitationMutation.mutate(invitationId);
  };

  const handleRejectInvitation = (invitationId: number) => {
    rejectInvitationMutation.mutate(invitationId);
  };

  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || [];
  const acceptedInvitations = invitations?.filter(inv => inv.status === 'accepted') || [];
  const rejectedInvitations = invitations?.filter(inv => inv.status === 'rejected') || [];
  
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const readNotifications = notifications?.filter(n => n.isRead) || [];

  return (
    <MobileLayout title="Notifications" showBackButton>
      <div className="container pb-16">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invitations">
              Invitations
              {pendingInvitations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="mt-4">
            {invitationsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingInvitations.length === 0 && acceptedInvitations.length === 0 && rejectedInvitations.length === 0 ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No invitations</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You don't have any invitations from project managers yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-3">Pending Invitations</h3>
                    <div className="space-y-3">
                      {pendingInvitations.map(invitation => (
                        <InvitationCard 
                          key={invitation.id} 
                          invitation={invitation} 
                          onAccept={() => handleAcceptInvitation(invitation.id)}
                          onReject={() => handleRejectInvitation(invitation.id)}
                          isPending={acceptInvitationMutation.isPending || rejectInvitationMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {acceptedInvitations.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-3">Accepted Invitations</h3>
                    <div className="space-y-3">
                      {acceptedInvitations.map(invitation => (
                        <Card key={invitation.id} className="bg-green-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              Connected with {invitation.projectManagerName || 'Project Manager'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Accepted on {new Date(invitation.invitationDate).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          {invitation.notes && (
                            <CardContent className="pt-0">
                              <p className="text-sm">{invitation.notes}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {rejectedInvitations.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-3">Rejected Invitations</h3>
                    <div className="space-y-3">
                      {rejectedInvitations.map(invitation => (
                        <Card key={invitation.id} className="bg-red-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                              <X className="h-4 w-4 mr-2 text-red-600" />
                              Declined {invitation.projectManagerName || 'Project Manager'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Rejected on {new Date(invitation.invitationDate).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          {invitation.notes && (
                            <CardContent className="pt-0">
                              <p className="text-sm">{invitation.notes}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-4">
            {notificationsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : unreadNotifications.length === 0 && readNotifications.length === 0 ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You don't have any notifications yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {unreadNotifications.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-lg">Unread Notifications</h3>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                      >
                        {markAllAsReadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Mark all as read
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {unreadNotifications.map(notification => (
                        <NotificationCard 
                          key={notification.id} 
                          notification={notification} 
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {readNotifications.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-3">Previous Notifications</h3>
                    <div className="space-y-3">
                      {readNotifications.map(notification => (
                        <NotificationCard 
                          key={notification.id} 
                          notification={notification} 
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

const NotificationCard = ({ notification, onClick }: { notification: Notification, onClick: () => void }) => {
  return (
    <Card 
      className={`${notification.isRead ? 'bg-white' : 'bg-blue-50'} cursor-pointer`}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base flex items-center">
          <BellRing className="h-4 w-4 mr-2 text-blue-600" />
          {notification.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {new Date(notification.createdAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm">{notification.message}</p>
      </CardContent>
    </Card>
  );
};

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
    <Card className="bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Request from {invitation.projectManagerName || 'Project Manager'}
        </CardTitle>
        <CardDescription className="text-xs">
          Received on {new Date(invitation.invitationDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {invitation.notes && (
          <p className="text-sm mb-3">{invitation.notes}</p>
        )}
        <p className="text-sm">
          Do you want to connect with this project manager? This will allow them to assign you to jobs and manage your orders.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={onAccept}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Accept
        </Button>
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onReject}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
          Decline
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationsPage;