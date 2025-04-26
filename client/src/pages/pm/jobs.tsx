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
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  EyeIcon,
  HardHatIcon,
  PackageIcon,
  ConstructionIcon,
  BuildingIcon,
  UsersIcon,
  CalendarIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Job interface
interface Job {
  id: number;
  name: string;
  jobNumber: string;
  status: string;
  location: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  businessId: number;
  businessName: string;
  clientId: number | null;
  clientName: string | null;
  projectManagerId: number | null;
  projectManagerName: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  tradiesCount: number;
  hasOrders: boolean;
}

// Client interface
interface Client {
  id: number;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
}

// Tradie interface
interface Tradie {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  businessId: number | null;
  role: string;
}

// JobTradie interface
interface JobTradie {
  id: number;
  jobId: number;
  userId: number;
  role: string;
  assignedAt: string;
  assignedBy: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

// Job part interface
interface JobPart {
  id: number;
  jobId: number;
  partId: number;
  quantity: number;
  part: {
    id: number;
    item_code: string;
    description: string;
    type: string;
    pipeSize: string;
    image: string | null;
  };
}

// Define the form schema
const jobFormSchema = z.object({
  name: z.string().min(2, "Job name must be at least 2 characters"),
  jobNumber: z.string().min(1, "Job number is required"),
  status: z.string().default("planned"),
  location: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  clientId: z.number().optional().nullable(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

const JobManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobTradies, setJobTradies] = useState<JobTradie[]>([]);
  const [jobParts, setJobParts] = useState<JobPart[]>([]);
  const [showAssignTradie, setShowAssignTradie] = useState(false);
  const [availableTradies, setAvailableTradies] = useState<Tradie[]>([]);
  const [selectedTradie, setSelectedTradie] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("tradie");

  // Form setup
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      name: "",
      jobNumber: "",
      status: "planned",
      location: "",
      description: "",
      startDate: null,
      endDate: null,
      clientId: null,
    },
  });

  // Queries
  const {
    data: activeJobs,
    isLoading: activeJobsLoading,
    refetch: refetchActiveJobs,
  } = useQuery<Job[]>({
    queryKey: ['/api/jobs', 'active', user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/jobs/pm');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch active jobs:", error);
        return [];
      }
    },
  });

  const {
    data: completedJobs,
    isLoading: completedJobsLoading,
    refetch: refetchCompletedJobs,
  } = useQuery<Job[]>({
    queryKey: ['/api/jobs', 'completed', user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/jobs/pm/completed');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch completed jobs:", error);
        return [];
      }
    },
    enabled: activeTab === "completed", // Only fetch when tab is active
  });

  const {
    data: clients,
    isLoading: clientsLoading,
  } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/clients');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        return [];
      }
    },
  });

  // Fetch job details, tradies and parts
  const fetchJobDetails = async (jobId: number) => {
    try {
      await Promise.all([
        fetchJobTradies(jobId),
        fetchJobParts(jobId),
      ]);
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const fetchJobTradies = async (jobId: number) => {
    try {
      const response = await apiRequest('GET', `/api/jobs/${jobId}/users`);
      const data = await response.json();
      setJobTradies(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch job tradies:", error);
      setJobTradies([]);
      return [];
    }
  };

  const fetchJobParts = async (jobId: number) => {
    try {
      const response = await apiRequest('GET', `/api/jobs/${jobId}/parts`);
      const data = await response.json();
      setJobParts(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch job parts:", error);
      setJobParts([]);
      return [];
    }
  };

  const fetchAvailableTradies = async () => {
    try {
      const response = await apiRequest('GET', '/api/users/tradies');
      const data = await response.json();
      setAvailableTradies(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch available tradies:", error);
      setAvailableTradies([]);
      return [];
    }
  };

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: async (jobData: JobFormValues) => {
      const response = await apiRequest('POST', '/api/jobs', jobData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job created",
        description: "The job has been created successfully.",
      });
      
      // Close form and reset
      setShowJobForm(false);
      form.reset();
      
      // Refetch jobs
      refetchActiveJobs();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, jobData }: { id: number; jobData: JobFormValues }) => {
      const response = await apiRequest('PUT', `/api/jobs/${id}`, jobData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job updated",
        description: "The job has been updated successfully.",
      });
      
      // Close form and reset
      setShowJobForm(false);
      form.reset();
      setIsEditMode(false);
      setSelectedJob(null);
      
      // Refetch jobs
      refetchActiveJobs();
      if (activeTab === "completed") refetchCompletedJobs();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pm/dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignTradieMutation = useMutation({
    mutationFn: async ({ jobId, userId, role }: { jobId: number; userId: number; role: string }) => {
      const response = await apiRequest('POST', `/api/jobs/${jobId}/users`, { userId, role });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tradie assigned",
        description: "The tradie has been assigned to the job successfully.",
      });
      
      // Close dialog and reset
      setShowAssignTradie(false);
      setSelectedTradie(null);
      setSelectedRole("tradie");
      
      // Refetch job tradies
      if (selectedJob) {
        fetchJobTradies(selectedJob.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign tradie. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeTradieMutation = useMutation({
    mutationFn: async ({ jobId, assignmentId }: { jobId: number; assignmentId: number }) => {
      const response = await apiRequest('DELETE', `/api/jobs/${jobId}/users/${assignmentId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tradie removed",
        description: "The tradie has been removed from the job.",
      });
      
      // Refetch job tradies
      if (selectedJob) {
        fetchJobTradies(selectedJob.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove tradie. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateJob = () => {
    setIsEditMode(false);
    setSelectedJob(null);
    form.reset({
      name: "",
      jobNumber: "",
      status: "planned",
      location: "",
      description: "",
      startDate: null,
      endDate: null,
      clientId: null,
    });
    setShowJobForm(true);
  };

  const handleEditJob = (job: Job) => {
    setIsEditMode(true);
    setSelectedJob(job);
    
    form.reset({
      name: job.name,
      jobNumber: job.jobNumber,
      status: job.status,
      location: job.location || "",
      description: job.description || "",
      startDate: job.startDate || null,
      endDate: job.endDate || null,
      clientId: job.clientId,
    });
    
    setShowJobForm(true);
  };

  const handleViewJob = async (job: Job) => {
    setSelectedJob(job);
    await fetchJobDetails(job.id);
    setShowJobDetails(true);
  };

  const handleAssignTradie = async () => {
    if (!selectedJob) return;
    await fetchAvailableTradies();
    setShowAssignTradie(true);
  };

  const handleRemoveTradie = (assignmentId: number) => {
    if (!selectedJob) return;
    
    if (confirm("Are you sure you want to remove this tradie from the job?")) {
      removeTradieMutation.mutate({
        jobId: selectedJob.id,
        assignmentId
      });
    }
  };

  const handleAssignTradieSubmit = () => {
    if (!selectedJob || !selectedTradie) return;
    
    assignTradieMutation.mutate({
      jobId: selectedJob.id,
      userId: selectedTradie,
      role: selectedRole
    });
  };

  const handleJobFormSubmit = (values: JobFormValues) => {
    if (isEditMode && selectedJob) {
      updateJobMutation.mutate({
        id: selectedJob.id,
        jobData: values
      });
    } else {
      createJobMutation.mutate(values);
    }
  };

  // Filter jobs based on search query
  const filterJobs = (jobs: Job[] | undefined) => {
    if (!jobs) return [];
    if (!searchQuery) return jobs;
    
    const query = searchQuery.toLowerCase();
    return jobs.filter(
      job =>
        job.name.toLowerCase().includes(query) ||
        job.jobNumber.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.clientName?.toLowerCase().includes(query)
    );
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Job Management</h1>
        <Button onClick={handleCreateJob}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search jobs by name, number, location, or client..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed Jobs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription>
                Manage all current and planned jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeJobsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activeJobs && activeJobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job # / Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead className="hidden md:table-cell">Tradies</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterJobs(activeJobs).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.jobNumber}</div>
                          <div className="text-sm text-gray-500">{job.name}</div>
                        </TableCell>
                        <TableCell>{job.clientName || "No client"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              job.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : job.status === 'planned'
                                ? 'bg-yellow-100 text-yellow-800'
                                : job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {job.status.replace('_', ' ').charAt(0).toUpperCase() +
                              job.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {job.location || "Not specified"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {job.tradiesCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewJob(job)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditJob(job)}
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Edit</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <BuildingIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No active jobs found</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Click the 'Create Job' button to create a new job"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Jobs</CardTitle>
              <CardDescription>
                View history of completed jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedJobsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : completedJobs && completedJobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job # / Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Completion Date</TableHead>
                      <TableHead className="hidden md:table-cell">Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterJobs(completedJobs).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.jobNumber}</div>
                          <div className="text-sm text-gray-500">{job.name}</div>
                        </TableCell>
                        <TableCell>{job.clientName || "No client"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(job.endDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {job.startDate && job.endDate
                            ? `${Math.ceil(
                                (new Date(job.endDate).getTime() -
                                  new Date(job.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )} days`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJob(job)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <BuildingIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No completed jobs found</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Completed jobs will appear here"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Job Dialog */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Job" : "Create New Job"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the job details below"
                : "Fill in the details to create a new job"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleJobFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="jobNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. JOB-2023-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No client</SelectItem>
                          {clients &&
                            clients.map((client) => (
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
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Job location (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter job description (optional)"
                        {...field}
                        rows={4}
                      />
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
                    setShowJobForm(false);
                    form.reset();
                    setIsEditMode(false);
                    setSelectedJob(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting ||
                    createJobMutation.isPending ||
                    updateJobMutation.isPending
                  }
                >
                  {form.formState.isSubmitting ||
                  createJobMutation.isPending ||
                  updateJobMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{isEditMode ? "Update Job" : "Create Job"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Job Details Dialog */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              {selectedJob && (
                <div className="text-sm text-gray-500">
                  {selectedJob.jobNumber} - {selectedJob.name}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Job Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status:</dt>
                        <dd>
                          <Badge
                            className={
                              selectedJob.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : selectedJob.status === 'planned'
                                ? 'bg-yellow-100 text-yellow-800'
                                : selectedJob.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : selectedJob.status === 'on_hold'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {selectedJob.status.replace('_', ' ').charAt(0).toUpperCase() +
                              selectedJob.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Location:</dt>
                        <dd>{selectedJob.location || "Not specified"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Start Date:</dt>
                        <dd>{formatDate(selectedJob.startDate)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">End Date:</dt>
                        <dd>{formatDate(selectedJob.endDate)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Client & Business
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Client:</dt>
                        <dd>{selectedJob.clientName || "Not assigned"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Business:</dt>
                        <dd>{selectedJob.businessName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Created By:</dt>
                        <dd>{selectedJob.createdByName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Created On:</dt>
                        <dd>{formatDate(selectedJob.createdAt)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <ConstructionIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-sm">
                      {selectedJob.description || "No description provided"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center">
                      <HardHatIcon className="h-5 w-5 mr-2 text-orange-500" />
                      Tradies Assigned
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAssignTradie}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="max-h-60 overflow-y-auto">
                      {jobTradies.length > 0 ? (
                        <div className="divide-y">
                          {jobTradies.map((assignment) => (
                            <div key={assignment.id} className="py-3 flex justify-between items-center">
                              <div>
                                <div className="font-medium">
                                  {assignment.user.firstName} {assignment.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{assignment.user.email}</div>
                                <div className="text-xs text-gray-500">
                                  <Badge variant="secondary" className="mt-1">
                                    {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => handleRemoveTradie(assignment.id)}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <HardHatIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p>No tradies assigned</p>
                          <p className="text-xs">Click Assign to add tradies to this job</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base font-medium flex items-center">
                      <PackageIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Parts Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="max-h-60 overflow-y-auto">
                      {jobParts.length > 0 ? (
                        <div className="divide-y">
                          {jobParts.map((jobPart) => (
                            <div key={jobPart.id} className="py-3 flex justify-between items-center">
                              <div>
                                <div className="font-medium">{jobPart.part.item_code}</div>
                                <div className="text-sm text-gray-500">
                                  {jobPart.part.description}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">Qty: {jobPart.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <PackageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p>No parts added</p>
                          <p className="text-xs">Parts will be listed here once added to the job</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => setShowJobDetails(false)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowJobDetails(false);
                      handleEditJob(selectedJob);
                    }}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit Job
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Tradie Dialog */}
      <Dialog open={showAssignTradie} onOpenChange={setShowAssignTradie}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tradie to Job</DialogTitle>
            <DialogDescription>
              Select a tradie to assign to this job
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tradie" className="text-sm font-medium">
                Select Tradie
              </label>
              <Select
                onValueChange={(value) => setSelectedTradie(parseInt(value))}
                value={selectedTradie?.toString()}
              >
                <SelectTrigger id="tradie">
                  <SelectValue placeholder="Select a tradie" />
                </SelectTrigger>
                <SelectContent>
                  {availableTradies.map((tradie) => (
                    <SelectItem key={tradie.id} value={tradie.id.toString()}>
                      {tradie.firstName} {tradie.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select
                onValueChange={setSelectedRole}
                value={selectedRole}
                defaultValue="tradie"
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tradie">Tradie</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignTradie(false);
                setSelectedTradie(null);
                setSelectedRole("tradie");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTradieSubmit}
              disabled={!selectedTradie || assignTradieMutation.isPending}
            >
              {assignTradieMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <HardHatIcon className="mr-2 h-4 w-4" />
                  Assign to Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PMLayout>
  );
};

export default JobManagement;