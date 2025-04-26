import { useState } from "react";
import PmLayout from "@/components/pm/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Users, FileText, CheckCircle2, Circle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Job creation form schema
const jobFormSchema = z.object({
  name: z.string().min(3, "Job name must be at least 3 characters"),
  jobNumber: z.string().min(1, "Job number is required"),
  clientId: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default("Not Started"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

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

export default function PmJobs() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch PM jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/pm/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/pm/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    }
  });

  // Fetch clients for assignment
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

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: JobFormValues) => {
      // Convert clientId to number if it exists
      if (jobData.clientId) {
        jobData.clientId = parseInt(jobData.clientId) as any;
      }
      
      const res = await apiRequest('POST', '/api/pm/jobs', jobData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create job');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pm/jobs'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Job created",
        description: "The job has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating job",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Form setup
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      name: "",
      jobNumber: "",
      clientId: undefined,
      location: "",
      description: "",
      status: "Not Started",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });

  const onSubmit = (values: JobFormValues) => {
    createJobMutation.mutate(values);
  };

  return (
    <PmLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Job Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={18} />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
                <DialogDescription>
                  Create a new job and assign it to tradies.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                            <Input placeholder="Enter unique job number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                      disabled={createJobMutation.isPending}
                      className="w-full mt-4"
                    >
                      {createJobMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Job"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !jobs?.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No Jobs Found</CardTitle>
              <CardDescription>
                You don't have any jobs assigned yet. Create a new job to get started.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Job
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.jobNumber}</TableCell>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.clientName}</TableCell>
                    <TableCell>
                      {job.startDate && new Date(job.startDate).toLocaleDateString()} - 
                      {job.endDate && new Date(job.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/pm/jobs/${job.id}`)}
                          title="View job details"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/pm/jobs/${job.id}/tradies`)}
                          title="Manage tradies"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PmLayout>
  );
}