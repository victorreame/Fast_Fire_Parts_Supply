import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlusIcon, EyeIcon, UserMinusIcon, RefreshCwIcon, MailIcon, SearchIcon, XIcon } from "lucide-react";
import { PMLayout } from "@/components/pm-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { inviteFormSchema } from "@shared/schema";

// Types
interface Tradie {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  displayStatus: string;
  businessId?: number;
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
}

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const TradieInviteManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedTradie, setSelectedTradie] = useState<Tradie | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<TradieInvitation | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [removeReason, setRemoveReason] = useState("");

  // Form setup
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      personalMessage: "",
    },
  });

  // Queries
  const { data: companyTradies, isLoading: companyTradiesLoading, refetch: refetchCompanyTradies } = useQuery<Tradie[]>({
    queryKey: ['/api/pm/tradies/company'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pm/tradies/company');
      return await response.json();
    },
  });

  const { data: pendingInvitations, isLoading: pendingInvitationsLoading, refetch: refetchPendingInvitations } = useQuery<TradieInvitation[]>({
    queryKey: ['/api/pm/invitations/pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pm/invitations/pending');
      return await response.json();
    },
  });

  // Mutations
  const inviteTradieMutation = useMutation({
    mutationFn: async (tradieData: InviteFormValues) => {
      const response = await apiRequest('POST', '/api/pm/tradies/invite', tradieData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The tradie invitation has been sent successfully.",
      });
      
      setShowInviteForm(false);
      form.reset();
      refetchPendingInvitations();
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeTradieMutation = useMutation({
    mutationFn: async ({ tradieId, reason }: { tradieId: number; reason?: string }) => {
      const response = await apiRequest('POST', `/api/pm/tradies/${tradieId}/remove`, { reason });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tradie removed",
        description: "The tradie has been removed from your company.",
      });
      
      setShowRemoveDialog(false);
      setSelectedTradie(null);
      setRemoveReason("");
      refetchCompanyTradies();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove tradie. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('POST', `/api/pm/invitations/${invitationId}/resend`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "The invitation has been resent successfully.",
      });
      
      setShowResendDialog(false);
      setSelectedInvitation(null);
      refetchPendingInvitations();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('POST', `/api/pm/invitations/${invitationId}/cancel`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled successfully.",
      });
      
      setShowCancelDialog(false);
      setSelectedInvitation(null);
      refetchPendingInvitations();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleInviteTradie = () => {
    setShowInviteForm(true);
  };

  const handleInviteSubmit = (values: InviteFormValues) => {
    inviteTradieMutation.mutate(values);
  };

  const handleRemoveTradie = (tradie: Tradie) => {
    setSelectedTradie(tradie);
    setShowRemoveDialog(true);
  };

  const handleRemoveConfirm = () => {
    if (selectedTradie) {
      removeTradieMutation.mutate({ 
        tradieId: selectedTradie.id, 
        reason: removeReason || undefined 
      });
    }
  };

  const handleResendInvitation = (invitation: TradieInvitation) => {
    setSelectedInvitation(invitation);
    setShowResendDialog(true);
  };

  const handleResendConfirm = () => {
    if (selectedInvitation) {
      resendInvitationMutation.mutate(selectedInvitation.id);
    }
  };

  const handleCancelInvitation = (invitation: TradieInvitation) => {
    setSelectedInvitation(invitation);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    if (selectedInvitation) {
      cancelInvitationMutation.mutate(selectedInvitation.id);
    }
  };

  // Filter functions
  const filterTradies = (tradies: Tradie[] | undefined) => {
    if (!tradies) return [];
    if (!searchQuery) return tradies;
    
    const query = searchQuery.toLowerCase();
    return tradies.filter(
      tradie =>
        tradie.firstName.toLowerCase().includes(query) ||
        tradie.lastName.toLowerCase().includes(query) ||
        tradie.email.toLowerCase().includes(query) ||
        (tradie.phone && tradie.phone.includes(query))
    );
  };

  const filterInvitations = (invitations: TradieInvitation[] | undefined) => {
    if (!invitations) return [];
    if (!searchQuery) return invitations;
    
    const query = searchQuery.toLowerCase();
    return invitations.filter(
      invitation =>
        invitation.email.toLowerCase().includes(query) ||
        (invitation.phone && invitation.phone.includes(query))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case "Removed":
        return <Badge variant="destructive">Removed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tradie Invite Management</h1>
        <Button onClick={handleInviteTradie}>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Invite Tradie
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company Tradies</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Tradies</CardTitle>
              <CardDescription>
                Manage tradies in your company. You can remove tradies or re-invite removed ones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyTradiesLoading ? (
                <div className="text-center py-4">Loading tradies...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTradies(companyTradies)?.map((tradie) => (
                      <TableRow key={tradie.id}>
                        <TableCell className="font-medium">
                          {tradie.firstName} {tradie.lastName}
                        </TableCell>
                        <TableCell>{tradie.email}</TableCell>
                        <TableCell>{tradie.phone || '-'}</TableCell>
                        <TableCell>{getStatusBadge(tradie.displayStatus)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {tradie.isApproved ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveTradie(tradie)}
                              >
                                <UserMinusIcon className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleInviteTradie}
                              >
                                <MailIcon className="h-4 w-4 mr-1" />
                                Re-invite
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterTradies(companyTradies)?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No tradies found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage invitations you've sent to tradies. You can resend or cancel pending invitations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitationsLoading ? (
                <div className="text-center py-4">Loading invitations...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Expires Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterInvitations(pendingInvitations)?.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>{invitation.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(invitation.status)}
                            {isExpired(invitation.tokenExpiry) && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                        <TableCell>{formatDate(invitation.tokenExpiry)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation)}
                              disabled={invitation.status !== 'pending'}
                            >
                              <RefreshCwIcon className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation)}
                              disabled={invitation.status !== 'pending'}
                            >
                              <XIcon className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filterInvitations(pendingInvitations)?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No pending invitations found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Form Dialog */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Tradie</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInviteSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="tradie@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Message (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add a personal message for the tradie..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteTradieMutation.isPending}>
                  {inviteTradieMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Tradie Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tradie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedTradie?.firstName} {selectedTradie?.lastName} from your company? 
              This will revoke their access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="remove-reason">Reason (optional)</Label>
            <Textarea
              id="remove-reason"
              placeholder="Provide a reason for removal..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeTradieMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeTradieMutation.isPending ? "Removing..." : "Remove Tradie"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Invitation Dialog */}
      <AlertDialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resend the invitation to {selectedInvitation?.email}? 
              This will generate a new token and reset the expiry date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResendConfirm}
              disabled={resendInvitationMutation.isPending}
            >
              {resendInvitationMutation.isPending ? "Resending..." : "Resend Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to {selectedInvitation?.email}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={cancelInvitationMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelInvitationMutation.isPending ? "Cancelling..." : "Cancel Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PMLayout>
  );
};

export default TradieInviteManagement;