import { useState } from "react";
import MobileLayout from "@/components/mobile/layout";
import JobCard from "@/components/mobile/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Job } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const newJobSchema = z.object({
  name: z.string().min(3, "Job name must be at least 3 characters"),
  jobNumber: z.string().min(3, "Job number must be at least 3 characters"),
  status: z.enum(["active", "pending", "completed"]),
});

type NewJobFormValues = z.infer<typeof newJobSchema>;

const JobSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isNewJobDialogOpen, setIsNewJobDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<NewJobFormValues>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      name: "",
      jobNumber: "",
      status: "active",
    },
  });

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const createJobMutation = useMutation({
    mutationFn: async (values: NewJobFormValues) => {
      return apiRequest("POST", "/api/jobs", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job created",
        description: "New job has been successfully created.",
      });
      setIsNewJobDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: NewJobFormValues) => {
    createJobMutation.mutate(values);
  };

  // Filter and sort jobs
  const filteredAndSortedJobs = jobs
    ? jobs
        .filter((job) =>
          searchQuery
            ? job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
        .sort((a, b) => {
          if (sortBy === "recent") {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          } else if (sortBy === "name") {
            return a.name.localeCompare(b.name);
          } else if (sortBy === "status") {
            return a.status.localeCompare(b.status);
          }
          return 0;
        })
    : [];

  return (
    <MobileLayout title="Job Search" showBackButton={true}>
      <div className="p-4 bg-neutral-100 border-b border-neutral-200">
        <div className="relative mb-3">
          <Input
            type="text"
            placeholder="Search jobs..."
            className="w-full p-3 pl-10 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-3.5 text-neutral-400"></i>
        </div>
        <div className="flex">
          <Dialog open={isNewJobDialogOpen} onOpenChange={setIsNewJobDialogOpen}>
            <DialogTrigger asChild>
              <Button className="px-3 py-1.5 bg-primary text-white rounded-md text-sm mr-2">
                Create New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
                          <Input placeholder="Enter job number" {...field} />
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={createJobMutation.isPending}>
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Sort by Recent</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="status">Sort by Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="p-4 border-b border-neutral-200">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28 mt-2" />
                    <div className="flex mt-2">
                      <Skeleton className="h-4 w-16 rounded mr-2" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
        ) : filteredAndSortedJobs.length > 0 ? (
          filteredAndSortedJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No jobs found. Create a new job to get started.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default JobSearchPage;
