import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Temporary simple layout wrapper
const MobileLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {children}
    </div>
  </div>
);
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircleIcon, XCircleIcon, MailIcon, ClockIcon, BuildingIcon } from "lucide-react";

interface TradieInvitation {
  id: number;
  projectManagerId: number;
  email: string;
  phone?: string;
  personalMessage?: string;
  status: string;
  createdAt: string;
  tokenExpiry: string;
  companyName?: string;
  pmName?: string;
}

const TradieInvitations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvitation, setSelectedInvitation] = useState<TradieInvitation | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch pending invitations for this tradie
  const { data: invitations, isLoading } = useQuery<TradieInvitation[]>({
    queryKey: ['/api/tradie/invitations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tradie/invitations');
      return await response.json();
    },
    enabled: !!user && user.role === 'tradie',
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('POST', `/api/tradie/invitations/${invitationId}/accept`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Accepted!",
        description: "You've successfully joined the company. Welcome aboard!",
      });
      setShowAcceptDialog(false);
      setSelectedInvitation(null);
      queryClient.invalidateQueries({ queryKey: ['/api/tradie/invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
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
        description: "You've declined the company invitation.",
      });
      setShowRejectDialog(false);
      setSelectedInvitation(null);
      queryClient.invalidateQueries({ queryKey: ['/api/tradie/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Invitations</h1>
          <p className="text-gray-600">Review and respond to company invitations</p>
        </div>

        {invitations && invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className={`${isExpired(invitation.tokenExpiry) ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <BuildingIcon className="h-5 w-5 mr-2 text-blue-500" />
                      {invitation.companyName || 'Company Invitation'}
                    </CardTitle>
                    <Badge 
                      variant={isExpired(invitation.tokenExpiry) ? "secondary" : "default"}
                      className={isExpired(invitation.tokenExpiry) ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-800"}
                    >
                      {isExpired(invitation.tokenExpiry) ? "Expired" : "Pending"}
                    </Badge>
                  </div>
                  <CardDescription>
                    From: {invitation.pmName || 'Project Manager'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {invitation.personalMessage && (
                      <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800 font-medium mb-1">Personal Message:</p>
                        <p className="text-sm text-blue-700">{invitation.personalMessage}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>
                        Expires: {new Date(invitation.tokenExpiry).toLocaleDateString()}
                      </span>
                    </div>

                    {!isExpired(invitation.tokenExpiry) && (
                      <div className="flex gap-3 pt-3">
                        <Button
                          onClick={() => handleAcceptInvitation(invitation)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={acceptInvitationMutation.isPending}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectInvitation(invitation)}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                          disabled={rejectInvitationMutation.isPending}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MailIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invitations</h3>
            <p className="text-gray-600">You don't have any pending company invitations.</p>
          </div>
        )}

        {/* Accept Confirmation Dialog */}
        <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Accept Company Invitation?</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to join {selectedInvitation?.companyName || 'this company'}. 
                This will give you access to company jobs, orders, and full platform features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAcceptConfirm}
                className="bg-green-600 hover:bg-green-700"
                disabled={acceptInvitationMutation.isPending}
              >
                {acceptInvitationMutation.isPending ? "Accepting..." : "Accept Invitation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline Company Invitation?</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to decline the invitation from {selectedInvitation?.companyName || 'this company'}. 
                You can continue as an independent tradie with limited access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRejectConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={rejectInvitationMutation.isPending}
              >
                {rejectInvitationMutation.isPending ? "Declining..." : "Decline Invitation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
};

export default TradieInvitations;