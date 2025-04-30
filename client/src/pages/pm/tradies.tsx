import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PMLayout from "@/components/pm/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HardHatIcon,
  UserPlusIcon,
  SearchIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// User interface
interface Tradie {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isApproved: boolean;
  businessId: number | null;
  businessName: string | null;
  createdAt: string;
}

// Job assignment interface
interface JobAssignment {
  id: number;
  jobId: number;
  jobName: string;
  jobNumber: string;
  role: string;
  assignedAt: string;
  status: string;
}

// Define the invitation form schema
const inviteFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const TradieManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showTradieDetails, setShowTradieDetails] = useState(false);
  const [selectedTradie, setSelectedTradie] = useState<Tradie | null>(null);
  const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Form setup
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Queries
  const {
    data: activeTradies,
    isLoading: activeTradiesLoading,
    refetch: refetchActiveTradies,
  } = useQuery<Tradie[]>({
    queryKey: ['/api/pm/tradies', 'active'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pm/tradies/approved');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch active tradies:", error);
        return [];
      }
    },
  });

  const {
    data: pendingTradies,
    isLoading: pendingTradiesLoading,
    refetch: refetchPendingTradies,
  } = useQuery<Tradie[]>({
    queryKey: ['/api/pm/tradies', 'pending'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pm/tradies/pending');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch pending tradies:", error);
        return [];
      }
    },
    enabled: activeTab === "pending", // Only fetch when tab is active
  });

  // Fetch tradie job assignments
  const fetchTradieJobs = async (tradieId: number) => {
    try {
      const response = await apiRequest('GET', `/api/pm/tradies/${tradieId}/jobs`);
      const data = await response.json();
      setJobAssignments(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch tradie jobs:", error);
      setJobAssignments([]);
      return [];
    }
  };

  // Mutations
  const inviteTradieMutation = useMutation({
    mutationFn: async (tradieData: InviteFormValues) => {
      const response = await apiRequest('POST', '/api/pm/tradies/invite', {
        ...tradieData,
        role: 'tradie',
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The tradie invitation has been sent successfully.",
      });
      
      // Close form and reset
      setShowInviteForm(false);
      form.reset();
      
      // Refetch tradies
      refetchPendingTradies();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveTradieMutation = useMutation({
    mutationFn: async (tradieId: number) => {
      const response = await apiRequest('PUT', `/api/pm/tradies/${tradieId}/approve`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tradie approved",
        description: "The tradie has been approved successfully.",
      });
      
      // Close dialog
      setShowApproveDialog(false);
      setSelectedTradie(null);
      
      // Refetch tradies
      refetchPendingTradies();
      refetchActiveTradies();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve tradie. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectTradieMutation = useMutation({
    mutationFn: async (tradieId: number) => {
      const response = await apiRequest('PUT', `/api/pm/tradies/${tradieId}/reject`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tradie rejected",
        description: "The tradie account has been rejected.",
      });
      
      // Close dialog
      setShowRejectDialog(false);
      setSelectedTradie(null);
      
      // Refetch tradies
      refetchPendingTradies();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject tradie. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleInviteTradie = () => {
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setShowInviteForm(true);
  };

  const handleViewTradie = async (tradie: Tradie) => {
    setSelectedTradie(tradie);
    await fetchTradieJobs(tradie.id);
    setShowTradieDetails(true);
  };

  const handleApproveTradie = (tradie: Tradie) => {
    setSelectedTradie(tradie);
    setShowApproveDialog(true);
  };

  const handleRejectTradie = (tradie: Tradie) => {
    setSelectedTradie(tradie);
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = () => {
    if (selectedTradie) {
      approveTradieMutation.mutate(selectedTradie.id);
    }
  };

  const handleRejectConfirm = () => {
    if (selectedTradie) {
      rejectTradieMutation.mutate(selectedTradie.id);
    }
  };

  const handleInviteSubmit = (values: InviteFormValues) => {
    inviteTradieMutation.mutate(values);
  };

  // Filter tradies based on search query
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

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tradie Management</h1>
        <Button onClick={handleInviteTradie}>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Invite Tradie
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search tradies by name, email or phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Tradies</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingTradies && pendingTradies.length > 0 && (
              <Badge className="ml-2 bg-primary text-white">{pendingTradies.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Tradies</CardTitle>
              <CardDescription>
                Manage all approved tradies in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTradiesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filterTradies(activeTradies).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTradies(activeTradies).map((tradie) => (
                      <TableRow key={tradie.id}>
                        <TableCell>
                          <div className="font-medium">
                            {tradie.firstName} {tradie.lastName}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">{tradie.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{tradie.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{tradie.phone || "—"}</TableCell>
                        <TableCell>{tradie.businessName || "Not assigned"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTradie(tradie)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <HardHatIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No active tradies found</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Invite tradies to get started"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tradies</CardTitle>
              <CardDescription>
                Review and approve tradie registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTradiesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filterTradies(pendingTradies).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTradies(pendingTradies).map((tradie) => (
                      <TableRow key={tradie.id}>
                        <TableCell>
                          <div className="font-medium">
                            {tradie.firstName} {tradie.lastName}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">{tradie.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{tradie.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{tradie.phone || "—"}</TableCell>
                        <TableCell>{new Date(tradie.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTradie(tradie)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">View</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveTradie(tradie)}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectTradie(tradie)}
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Reject</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <HardHatIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No pending tradie requests</p>
                  <p className="text-sm mt-1">All caught up! Check back later for new requests.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Tradie Dialog */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Tradie</DialogTitle>
            <DialogDescription>
              Send an invitation to a tradie to join the platform.
              They will receive an email with a registration link.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
            <p className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mr-2 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
              <span>
                The tradie will need to complete their registration and verify their email before they can access the system. You'll need to approve their account after they complete these steps.
              </span>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInviteSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" type="email" {...field} />
                    </FormControl>
                    <FormDescription>
                      An invitation link will be sent to this email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || inviteTradieMutation.isPending}
                >
                  {form.formState.isSubmitting || inviteTradieMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Tradie Details Dialog */}
      <Dialog open={showTradieDetails} onOpenChange={setShowTradieDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tradie Details</DialogTitle>
            <DialogDescription>
              {selectedTradie && (
                <div className="text-sm text-gray-500">
                  {selectedTradie.firstName} {selectedTradie.lastName}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTradie && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm flex items-center">
                      <HardHatIcon className="h-4 w-4 mr-2 text-orange-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <dl className="space-y-3">
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Full Name:</dt>
                        <dd className="text-sm">
                          {selectedTradie.firstName} {selectedTradie.lastName}
                        </dd>
                      </div>
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Username:</dt>
                        <dd className="text-sm">{selectedTradie.username}</dd>
                      </div>
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Email:</dt>
                        <dd className="text-sm flex items-center">
                          <MailIcon className="h-4 w-4 mr-1 text-gray-400" />
                          <a
                            href={`mailto:${selectedTradie.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {selectedTradie.email}
                          </a>
                        </dd>
                      </div>
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Phone:</dt>
                        <dd className="text-sm flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {selectedTradie.phone ? (
                            <a
                              href={`tel:${selectedTradie.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedTradie.phone}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not provided</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Business:</dt>
                        <dd className="text-sm flex items-center">
                          <BuildingIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {selectedTradie.businessName || "Not assigned"}
                        </dd>
                      </div>
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Joined On:</dt>
                        <dd className="text-sm">
                          {new Date(selectedTradie.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex items-start">
                        <dt className="w-28 text-sm font-medium text-gray-500">Status:</dt>
                        <dd className="text-sm">
                          <Badge className={selectedTradie.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {selectedTradie.isApproved ? "Approved" : "Pending Approval"}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-2 text-blue-500" />
                      Job Assignments ({jobAssignments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="max-h-60 overflow-y-auto">
                      {jobAssignments.length > 0 ? (
                        <div className="space-y-4">
                          {jobAssignments.map((assignment) => (
                            <div key={assignment.id} className="border rounded-md p-3">
                              <div className="font-medium">{assignment.jobName}</div>
                              <div className="text-sm text-gray-500">Job #: {assignment.jobNumber}</div>
                              <div className="flex justify-between mt-2">
                                <Badge variant="outline">{assignment.role}</Badge>
                                <Badge
                                  className={
                                    assignment.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : assignment.status === 'planned'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : assignment.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {assignment.status.replace('_', ' ').charAt(0).toUpperCase() +
                                    assignment.status.replace('_', ' ').slice(1)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <BuildingIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p>No job assignments</p>
                          <p className="text-xs">This tradie is not assigned to any jobs yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => setShowTradieDetails(false)}>
                  Close
                </Button>
                {!selectedTradie.isApproved && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setShowTradieDetails(false);
                        handleApproveTradie(selectedTradie);
                      }}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        setShowTradieDetails(false);
                        handleRejectTradie(selectedTradie);
                      }}
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Tradie Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Tradie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedTradie?.firstName} {selectedTradie?.lastName}?
              This will grant them access to the system and they'll be able to work on assigned jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveTradieMutation.isPending}
            >
              {approveTradieMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Tradie Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Tradie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedTradie?.firstName} {selectedTradie?.lastName}?
              This will prevent them from accessing the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectTradieMutation.isPending}
            >
              {rejectTradieMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PMLayout>
  );
};

export default TradieManagement;