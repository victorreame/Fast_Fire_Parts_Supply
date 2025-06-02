import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PMLayout from "@/components/pm/layout";
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Package, 
  Plus, 
  Trash2, 
  Save,
  X,
  MapPin,
  Calendar,
  User,
  Building,
  DollarSign,
  FileText,
  MoreHorizontal,
  UserPlus,
  PackagePlus,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Types
interface JobDetails {
  id: number;
  name: string;
  jobNumber: string;
  location: string;
  status: string;
  description: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface JobPart {
  id: number;
  jobId: number;
  partId: number;
  quantity: number;
  notes?: string;
  addedAt: string;
  part: {
    id: number;
    item_code: string;
    description: string;
    type: string;
    pipe_size: string;
    price_t1: number;
    price_t2: number;
    price_t3: number;
    category?: string;
    image?: string;
  };
}

interface JobUser {
  id: number;
  jobId: number;
  userId: number;
  assignedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AvailablePart {
  id: number;
  item_code: string;
  description: string;
  type: string;
  pipe_size: string;
  price_t1: number;
  price_t2: number;
  price_t3: number;
  category?: string;
  image?: string;
  in_stock: number;
}

interface AvailableTradie {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isApproved: boolean;
}

// Form schemas
const editJobSchema = z.object({
  name: z.string().min(3, "Job name must be at least 3 characters"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  status: z.string(),
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

const addPartSchema = z.object({
  partId: z.number(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

type EditJobFormValues = z.infer<typeof editJobSchema>;
type AddPartFormValues = z.infer<typeof addPartSchema>;

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-500 text-white";
    case "completed":
      return "bg-gray-500 text-white";
    case "on_hold":
      return "bg-orange-500 text-white";
    default:
      return "bg-blue-500 text-white";
  }
}

export default function JobDetails() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isAssignTradieOpen, setIsAssignTradieOpen] = useState(false);
  const [isAddPartsOpen, setIsAddPartsOpen] = useState(false);
  const [selectedTradie, setSelectedTradie] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [partSearchTerm, setPartSearchTerm] = useState("");

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery<JobDetails>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

  // Fetch job parts
  const { data: jobParts, isLoading: partsLoading } = useQuery<JobPart[]>({
    queryKey: [`/api/jobs/${jobId}/parts`],
    enabled: !!jobId,
  });

  // Fetch job users
  const { data: jobUsers, isLoading: usersLoading } = useQuery<JobUser[]>({
    queryKey: [`/api/jobs/${jobId}/users`],
    enabled: !!jobId,
  });

  // Fetch available parts for adding
  const { data: availableParts } = useQuery<AvailablePart[]>({
    queryKey: [`/api/jobs/${jobId}/available-parts`],
    enabled: !!jobId && isAddPartsOpen,
  });

  // Fetch available tradies for assignment
  const { data: availableTradies } = useQuery<AvailableTradie[]>({
    queryKey: ['/api/pm/tradies/approved'],
    enabled: isAssignTradieOpen,
  });

  // Edit job form
  const editForm = useForm<EditJobFormValues>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      status: "active",
      clientId: "",
      startDate: "",
      endDate: "",
      budget: "",
      notes: "",
    },
  });

  // Add part form
  const addPartForm = useForm<AddPartFormValues>({
    resolver: zodResolver(addPartSchema),
    defaultValues: {
      partId: 0,
      quantity: 1,
      notes: "",
    },
  });

  // Update form when job data loads
  useEffect(() => {
    if (job) {
      editForm.reset({
        name: job.name,
        location: job.location,
        description: job.description,
        status: job.status,
        clientId: job.clientId?.toString() || "",
        startDate: job.startDate ? job.startDate.split('T')[0] : "",
        endDate: job.endDate ? job.endDate.split('T')[0] : "",
        budget: job.budget?.toString() || "",
        notes: job.notes || "",
      });
    }
  }, [job, editForm]);

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (jobData: EditJobFormValues) => {
      const formattedData = {
        ...jobData,
        clientId: jobData.clientId ? parseInt(jobData.clientId) : undefined,
        budget: jobData.budget ? parseFloat(jobData.budget) : undefined,
      };
      
      const res = await apiRequest('PUT', `/api/jobs/${jobId}`, formattedData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update job');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      setIsEditingJob(false);
      toast({
        title: "Job updated successfully",
        description: "The job details have been updated.",
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
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/jobs/${jobId}/assign`, { userId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to assign tradie');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/users`] });
      setIsAssignTradieOpen(false);
      setSelectedTradie("");
      toast({
        title: "Tradie assigned successfully",
        description: "The tradie has been assigned to this job.",
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
  const removeTradieutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/${jobId}/users/${userId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove tradie');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/users`] });
      toast({
        title: "Tradie removed successfully",
        description: "The tradie has been removed from this job.",
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

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: async (partData: AddPartFormValues) => {
      const res = await apiRequest('POST', `/api/jobs/${jobId}/parts`, partData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add part');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/parts`] });
      setIsAddPartsOpen(false);
      addPartForm.reset();
      setSelectedPart(null);
      toast({
        title: "Part added successfully",
        description: "The part has been added to this job.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding part",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Remove part mutation
  const removePartMutation = useMutation({
    mutationFn: async (partId: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/${jobId}/parts/${partId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove part');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/parts`] });
      toast({
        title: "Part removed successfully",
        description: "The part has been removed from this job.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing part",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter available parts
  const filteredParts = availableParts?.filter(part =>
    part.item_code.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(partSearchTerm.toLowerCase())
  ) || [];

  if (jobLoading) {
    return (
      <PMLayout>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PMLayout>
    );
  }

  if (!job) {
    return (
      <PMLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
                <p className="text-gray-500">The job you're looking for doesn't exist.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/pm/jobs')}
                >
                  Back to Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PMLayout>
    );
  }

  return (
    <PMLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/pm/dashboard')}
            className="p-0 h-auto"
          >
            Dashboard
          </Button>
          <span>/</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/pm/jobs')}
            className="p-0 h-auto"
          >
            Jobs
          </Button>
          <span>/</span>
          <span className="text-gray-900">{job.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/pm/jobs')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
              <p className="text-gray-600">#{job.jobNumber}</p>
            </div>
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingJob(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Job
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Location:</span>
                    <span>{job.location}</span>
                  </div>
                  {job.budget && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Budget:</span>
                      <span>${job.budget.toLocaleString()}</span>
                    </div>
                  )}
                  {job.startDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Start Date:</span>
                      <span>{new Date(job.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {job.endDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">End Date:</span>
                      <span>{new Date(job.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{job.description}</p>
                </div>
                {job.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-600">{job.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Job Parts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Job Parts ({jobParts?.length || 0})
                </CardTitle>
                <Dialog open={isAddPartsOpen} onOpenChange={setIsAddPartsOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <PackagePlus className="h-4 w-4" />
                      Add Parts
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add Parts to Job</DialogTitle>
                      <DialogDescription>
                        Select parts from the catalog to add to this job.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search parts by item code or description..."
                          value={partSearchTerm}
                          onChange={(e) => setPartSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-96 overflow-y-auto border rounded">
                        {filteredParts.map((part) => (
                          <div
                            key={part.id}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                              selectedPart === part.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => {
                              setSelectedPart(part.id);
                              addPartForm.setValue('partId', part.id);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{part.item_code}</h4>
                                <p className="text-sm text-gray-600">{part.description}</p>
                                <p className="text-xs text-gray-500">
                                  {part.type} • {part.pipe_size}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${part.price_t2}</p>
                                <p className="text-xs text-gray-500">{part.in_stock} in stock</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedPart && (
                        <Form {...addPartForm}>
                          <form onSubmit={addPartForm.handleSubmit((data) => addPartMutation.mutate(data))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={addPartForm.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                      <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={addPartForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Special instructions or notes..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsAddPartsOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={addPartMutation.isPending}>
                                {addPartMutation.isPending ? "Adding..." : "Add Part"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {partsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobParts?.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No parts assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">Add parts to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobParts?.map((jobPart) => (
                        <TableRow key={jobPart.id}>
                          <TableCell className="font-medium">{jobPart.part.item_code}</TableCell>
                          <TableCell>{jobPart.part.description}</TableCell>
                          <TableCell>{jobPart.quantity}</TableCell>
                          <TableCell>${jobPart.part.price_t2}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Part</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this part from the job?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removePartMutation.mutate(jobPart.partId)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Team */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team ({jobUsers?.length || 0})
                </CardTitle>
                <Dialog open={isAssignTradieOpen} onOpenChange={setIsAssignTradieOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Assign
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Tradie to Job</DialogTitle>
                      <DialogDescription>
                        Select an approved tradie to assign to this job.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedTradie} onValueChange={setSelectedTradie}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tradie" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTradies?.map((tradie) => (
                            <SelectItem key={tradie.id} value={tradie.id.toString()}>
                              {tradie.firstName} {tradie.lastName} ({tradie.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAssignTradieOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => assignTradieMutation.mutate(parseInt(selectedTradie))}
                        disabled={!selectedTradie || assignTradieMutation.isPending}
                      >
                        {assignTradieMutation.isPending ? "Assigning..." : "Assign Tradie"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-[120px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobUsers?.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No team members assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobUsers?.map((jobUser) => (
                      <div key={jobUser.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {jobUser.user.firstName} {jobUser.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{jobUser.user.email}</p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {jobUser.user.firstName} {jobUser.user.lastName} from this job?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeTradieutation.mutate(jobUser.userId)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Job Dialog */}
        <Dialog open={isEditingJob} onOpenChange={setIsEditingJob}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
              <DialogDescription>
                Update the job details and information.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateJobMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
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
                  control={editForm.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditingJob(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateJobMutation.isPending}>
                    {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PMLayout>
  );
}