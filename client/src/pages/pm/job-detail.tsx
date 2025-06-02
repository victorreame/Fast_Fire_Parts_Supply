import { useState, useEffect } from "react";
import PmLayout from "@/components/pm/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ArrowLeft, Edit, Users, Package, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";

function getStatusColor(status: string): string {
  switch (status) {
    case "Not Started":
      return "bg-slate-400";
    case "In Progress":
      return "bg-blue-400";
    case "Completed":
      return "bg-green-400";
    case "On Hold":
      return "bg-amber-400";
    default:
      return "bg-slate-400";
  }
}

// Job update form schema
const jobUpdateSchema = z.object({
  name: z.string().min(3, "Job name must be at least 3 characters"),
  jobNumber: z.string().min(1, "Job number is required"),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type JobUpdateValues = z.infer<typeof jobUpdateSchema>;

// Tradie assignment form schema
const assignTradieSchema = z.object({
  userId: z.string().min(1, "You must select a tradie")
});

type AssignTradieValues = z.infer<typeof assignTradieSchema>;

export default function JobDetail() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { id } = useParams();
  const jobId = parseInt(id);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  // Fetch job details
  const { data: job, isLoading } = useQuery({
    queryKey: ['/api/pm/jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/pm/jobs/${jobId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch job details');
      }
      return response.json();
    },
    enabled: !isNaN(jobId)
  });
  
  // Fetch tradies for assignment
  const { data: tradies } = useQuery({
    queryKey: ['/api/pm/tradies'],
    queryFn: async () => {
      const response = await fetch('/api/pm/tradies');
      if (!response.ok) {
        throw new Error('Failed to fetch tradies');
      }
      return response.json();
    }
  });
  
  // Fetch clients for job update
  const { data: clients } = useQuery({
    queryKey: ['/api/pm/clients'],
    queryFn: async () => {
      const response = await fetch('/api/pm/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    }
  });
  
  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (jobData: JobUpdateValues) => {
      // Convert clientId to number if it exists
      if (jobData.clientId) {
        jobData.clientId = parseInt(jobData.clientId) as any;
      }
      
      const res = await apiRequest('PUT', `/api/pm/jobs/${jobId}`, jobData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update job');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pm/jobs', jobId] });
      setIsEditDialogOpen(false);
      toast({
        title: "Job updated",
        description: "The job has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Assign tradie mutation
  const assignTradieMutation = useMutation({
    mutationFn: async (data: AssignTradieValues) => {
      const res = await apiRequest('POST', `/api/pm/jobs/${jobId}/assign`, {
        userId: parseInt(data.userId)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to assign tradie');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pm/jobs', jobId] });
      setIsAssignDialogOpen(false);
      toast({
        title: "Tradie assigned",
        description: "The tradie has been assigned to this job",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error assigning tradie",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove tradie mutation
  const removeTradieMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const res = await apiRequest('DELETE', `/api/pm/jobs/${jobId}/users/${assignmentId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove tradie');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pm/jobs', jobId] });
      toast({
        title: "Tradie removed",
        description: "The tradie has been removed from this job",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing tradie",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Forms setup
  const updateForm = useForm<JobUpdateValues>({
    resolver: zodResolver(jobUpdateSchema),
    defaultValues: {
      name: job?.name || "",
      jobNumber: job?.jobNumber || "",
      clientId: job?.clientId ? job.clientId.toString() : undefined,
      location: job?.location || "",
      description: job?.description || "",
      status: job?.status || "Not Started",
      startDate: job?.startDate ? new Date(job.startDate).toISOString().split('T')[0] : "",
      endDate: job?.endDate ? new Date(job.endDate).toISOString().split('T')[0] : "",
      notes: job?.notes || "",
    },
  });
  
  // Reset form values when job data changes
  useEffect(() => {
    if (job) {
      updateForm.reset({
        name: job.name,
        jobNumber: job.jobNumber,
        location: job.location || "",
        description: job.description || "",
        status: job.status,
        startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : "",
        endDate: job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : "",
        notes: job.notes || "",
      });
    }
  }, [job, updateForm]);
  
  const assignForm = useForm<AssignTradieValues>({
    resolver: zodResolver(assignTradieSchema),
    defaultValues: {
      userId: "",
    }
  });
  
  const onSubmitUpdate = (values: JobUpdateValues) => {
    updateJobMutation.mutate(values);
  };
  
  const onSubmitAssign = (values: AssignTradieValues) => {
    assignTradieMutation.mutate(values);
  };
  
  if (isLoading || !job) {
    return (
      <PmLayout>
        <div className="container mx-auto py-6 flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PmLayout>
    );
  }
  
  const assignedTradies = job.assignedUsers || [];
  const jobOrders = job.orders || [];
  
  return (
    <PmLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6 gap-2">
          <Button variant="ghost" onClick={() => navigate('/pm/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Jobs
          </Button>
          <h1 className="text-3xl font-bold ml-4">{job.name}</h1>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle>Job Details</CardTitle>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">Job Number</span>
                    <span className="text-lg font-medium">{job.jobNumber}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Client</span>
                    <span className="text-lg font-medium">{job.client?.name || 'No client assigned'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Start Date</span>
                    <span className="text-lg font-medium">
                      {job.startDate ? new Date(job.startDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">End Date</span>
                    <span className="text-lg font-medium">
                      {job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground block">Location</span>
                  <span className="text-lg font-medium">{job.location || 'No location set'}</span>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground block">Description</span>
                  <p className="text-lg">{job.description || 'No description provided'}</p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground block">Notes</span>
                  <p className="text-lg">{job.notes || 'No notes provided'}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Tabs defaultValue="orders">
                <TabsList>
                  <TabsTrigger value="orders">
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="tradies">
                    <Users className="mr-2 h-4 w-4" />
                    Assigned Tradies
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Associated Orders</CardTitle>
                      <CardDescription>Orders created for this job</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {jobOrders.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No orders associated with this job yet</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order #</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {jobOrders.map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>
                                  <Badge variant={order.status === 'approved' ? 'success' : 
                                                (order.status === 'rejected' ? 'destructive' : 'default')}>
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{order.items?.length || 0} items</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => navigate(`/pm/orders/${order.id}`)}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tradies">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Assigned Tradies</CardTitle>
                          <CardDescription>Team members working on this job</CardDescription>
                        </div>
                        <Button onClick={() => setIsAssignDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Assign Tradie
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {assignedTradies.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No tradies assigned to this job yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignedTradies.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {assignment.user?.firstName?.[0] || assignment.user?.username?.[0] || 'T'}
                                    {assignment.user?.lastName?.[0] || ''}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {assignment.user?.firstName} {assignment.user?.lastName || assignment.user?.username}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{assignment.user?.email}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeTradieMutation.mutate(assignment.id)}
                                disabled={removeTradieMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">Current Status</span>
                    <Badge className={`${getStatusColor(job.status)} mt-1`}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground block">Assigned Tradies</span>
                    <span className="text-lg font-medium">{assignedTradies.length}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground block">Orders</span>
                    <span className="text-lg font-medium">{jobOrders.length}</span>
                  </div>
                  
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-2">Update Status</span>
                    <div className="grid grid-cols-1 gap-2">
                      {['Not Started', 'In Progress', 'On Hold', 'Completed'].map((status) => (
                        <Button 
                          key={status}
                          variant={job.status === status ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => {
                            updateJobMutation.mutate({
                              ...updateForm.getValues(),
                              status
                            });
                          }}
                          disabled={updateJobMutation.isPending || job.status === status}
                        >
                          <CircleCheck className={`mr-2 h-4 w-4 ${job.status === status ? "opacity-100" : "opacity-0"}`} />
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update the job details and information.
            </DialogDescription>
          </DialogHeader>

          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter job name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="jobNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unique job number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={updateForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location/Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job location or address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed job description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateJobMutation.isPending}
                  className="w-full mt-4"
                >
                  {updateJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Job"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Assign Tradie Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Tradie</DialogTitle>
            <DialogDescription>
              Assign a tradie to work on this job.
            </DialogDescription>
          </DialogHeader>

          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Tradie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tradie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tradies?.map((tradie: any) => (
                          <SelectItem key={tradie.id} value={tradie.id.toString()}>
                            {tradie.firstName} {tradie.lastName || tradie.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={assignTradieMutation.isPending}
                  className="w-full mt-4"
                >
                  {assignTradieMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Tradie"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PmLayout>
  );
}