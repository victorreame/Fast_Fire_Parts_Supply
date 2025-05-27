import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/mobile/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { BellRing, Check, X, User, Bell, Loader2, MailIcon, ClockIcon, AlertTriangleIcon, BuildingIcon, CalendarIcon } from "lucide-react";

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
  tradieId?: number;
  email: string;
  phone?: string;
  invitationToken: string;
  tokenExpiry: string;
  status: string;
  createdAt: string;
  responseDate?: string;
  personalMessage?: string;
  projectManagerName?: string;
}

const NotificationsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invitations");
  const [selectedInvitation, setSelectedInvitation] = useState<TradieInvitation | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Get all notifications for the current user
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  // Get tradie invitations
  const { data: invitations, isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery<TradieInvitation[]>({
    queryKey: ['/api/tradie/invitations'],
    enabled: !!user && user.role === 'tradie',
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('POST', `/api/tradie/invitations/${invitationId}/accept`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Accepted!",
        description: `Welcome to ${data.companyName || 'the company'}! You now have full access to the platform.`,
      });
      
      setShowAcceptDialog(false);
      setSelectedInvitation(null);
      refetchInvitations();
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      
      // Redirect to dashboard after successful acceptance
      setTimeout(() => {
        window.location.href = '/mobile/home';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('POST', `/api/tradie/invitations/${invitationId}/reject`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Declined",
        description: "You have declined the company invitation.",
      });
      
      setShowRejectDialog(false);
      setSelectedInvitation(null);
      refetchInvitations();
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Helper functions
  const isExpired = (tokenExpiry: string) => {
    return new Date(tokenExpiry) < new Date();
  };

  const getTimeRemaining = (tokenExpiry: string) => {
    const now = new Date();
    const expiry = new Date(tokenExpiry);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return "Less than 1 hour remaining";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handlers
  const handleAcceptInvitation = (invitation: TradieInvitation) => {
    setSelectedInvitation(invitation);
    setShowAcceptDialog(true);
  };

  const handleRejectInvitation = (invitation: TradieInvitation) => {
    setSelectedInvitation(invitation);
    setShowRejectDialog(true);
  };

  const handleAcceptConfirm = () => {
    if (selectedInvitation) {
      acceptInvitationMutation.mutate(selectedInvitation.id);
    }
  };

  const handleRejectConfirm = () => {
    if (selectedInvitation) {
      rejectInvitationMutation.mutate(selectedInvitation.id);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  // Filter invitations
  const pendingInvitations = invitations?.filter((inv: TradieInvitation) => inv.status === 'pending') || [];
  const respondedInvitations = invitations?.filter((inv: TradieInvitation) => inv.status !== 'pending') || [];
  
  // Filter invitation notifications
  const otherNotifications = notifications?.filter((n: Notification) => n.type !== 'company_invitation') || [];

  const getStatusBadge = (status: string, tokenExpiry: string) => {
    if (isExpired(tokenExpiry) && status === 'pending') {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending Response</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (notificationsLoading || invitationsLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        {user?.role === 'tradie' && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <MailIcon className="h-4 w-4" />
                Company Invitations
                {pendingInvitations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                General
                {otherNotifications.filter(n => !n.isRead).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                    {otherNotifications.filter(n => !n.isRead).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invitations" className="mt-6">
              <div className="space-y-6">
                {pendingInvitations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangleIcon className="h-5 w-5 text-orange-600" />
                      Pending Invitations
                    </h3>
                    <div className="space-y-4">
                      {pendingInvitations.map((invitation) => (
                        <InvitationCard
                          key={invitation.id}
                          invitation={invitation}
                          onAccept={handleAcceptInvitation}
                          onReject={handleRejectInvitation}
                          isExpired={isExpired(invitation.tokenExpiry)}
                          timeRemaining={getTimeRemaining(invitation.tokenExpiry)}
                          getStatusBadge={getStatusBadge}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {respondedInvitations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      Previous Responses
                    </h3>
                    <div className="space-y-4">
                      {respondedInvitations.map((invitation) => (
                        <Card key={invitation.id} className="border-l-4 border-l-gray-300">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <BuildingIcon className="h-5 w-5 text-gray-600" />
                                  Company Invitation
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  From: {invitation.projectManagerName || 'Project Manager'}
                                </CardDescription>
                              </div>
                              {getStatusBadge(invitation.status, invitation.tokenExpiry)}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Invited:</span>
                                  <p>{formatDate(invitation.createdAt)}</p>
                                </div>
                                {invitation.responseDate && (
                                  <div>
                                    <span className="font-medium text-gray-600">Responded:</span>
                                    <p>{formatDate(invitation.responseDate)}</p>
                                  </div>
                                )}
                              </div>
                              {invitation.personalMessage && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm italic">"{invitation.personalMessage}"</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {pendingInvitations.length === 0 && respondedInvitations.length === 0 && (
                  <div className="text-center py-12">
                    <MailIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations</h3>
                    <p className="text-gray-500">You don't have any company invitations at this time.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="general" className="mt-6">
              <div className="space-y-4">
                {otherNotifications.length > 0 ? (
                  otherNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BellRing className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">You're all caught up! No new notifications.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {user?.role !== 'tradie' && (
          <div className="space-y-4">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <BellRing className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up! No new notifications.</p>
              </div>
            )}
          </div>
        )}

        {/* Accept Invitation Dialog */}
        <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Accept Company Invitation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to accept this invitation from {selectedInvitation?.projectManagerName}? 
                You will gain full access to their company's platform and be able to view jobs and place orders.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowAcceptDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAcceptConfirm}
                disabled={acceptInvitationMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {acceptInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Invitation Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                Decline Company Invitation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to decline this invitation from {selectedInvitation?.projectManagerName}? 
                This action cannot be undone, and you would need a new invitation to join their company.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowRejectDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRejectConfirm}
                disabled={rejectInvitationMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Declining...
                  </>
                ) : (
                  'Decline Invitation'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
};

const InvitationCard = ({ 
  invitation, 
  onAccept, 
  onReject, 
  isExpired, 
  timeRemaining, 
  getStatusBadge, 
  formatDate 
}: { 
  invitation: TradieInvitation, 
  onAccept: (inv: TradieInvitation) => void,
  onReject: (inv: TradieInvitation) => void,
  isExpired: boolean,
  timeRemaining: string,
  getStatusBadge: (status: string, expiry: string) => JSX.Element,
  formatDate: (date: string) => string
}) => {
  return (
    <Card className={`border-l-4 ${isExpired ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BuildingIcon className="h-5 w-5 text-blue-600" />
              Company Invitation
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              From: {invitation.projectManagerName || 'Project Manager'}
            </CardDescription>
          </div>
          {getStatusBadge(invitation.status, invitation.tokenExpiry)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Invited:</span>
              <span>{formatDate(invitation.createdAt)}</span>
            </div>
            <div className={`flex items-center gap-2 ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium">Status:</span>
              <span>{timeRemaining}</span>
            </div>
          </div>
          
          {invitation.personalMessage && (
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-1">Personal Message:</p>
              <p className="text-sm italic">"{invitation.personalMessage}"</p>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-100 border border-red-300 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-800">This invitation has expired</p>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Contact the project manager for a new invitation if you're still interested.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      {!isExpired && (
        <CardFooter className="pt-0">
          <div className="flex gap-3 w-full">
            <Button 
              onClick={() => onReject(invitation)}
              variant="outline" 
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button 
              onClick={() => onAccept(invitation)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

const NotificationCard = ({ notification, onClick }: { notification: Notification, onClick: () => void }) => {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
              {notification.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {notification.message}
            </CardDescription>
          </div>
          <Badge variant={notification.isRead ? "outline" : "secondary"}>
            {notification.isRead ? "Read" : "New"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-gray-500">
          {new Date(notification.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </CardContent>
    </Card>
  );
};

export default NotificationsPage;