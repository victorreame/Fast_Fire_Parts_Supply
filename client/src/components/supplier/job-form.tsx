import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertJobSchema, Job } from "@shared/schema";

interface JobFormProps {
  job: Job | null;
  onSuccess: () => void;
}

const formSchema = insertJobSchema.extend({
  name: z.string().optional(), // Make name optional as we'll use description as the main title
  jobNumber: z.string().min(2, "Job number is required"),
  description: z.string().min(3, "Description must be at least 3 characters"), // Make description required
  isPublic: z.boolean().optional().default(false),
  businessId: z.number().optional().nullable(),
  status: z.enum(["active", "pending", "completed"]).default("active"),
});

const JobForm = ({ job, onSuccess }: JobFormProps) => {
  const { toast } = useToast();
  
  const { data: businesses } = useQuery({
    queryKey: ['/api/businesses'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: job?.name || "",
      jobNumber: job?.jobNumber || "",
      location: job?.location || "",
      description: job?.description || "",
      isPublic: job?.isPublic || false,
      businessId: job?.businessId || null,
      status: (job?.status as "active" | "pending" | "completed") || "active",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Set name to be the same as description since we're using description as the main title
      // And keep location as empty string since we're removing it
      const apiData = {
        name: data.description, // Use description as the name
        job_number: data.jobNumber,
        location: "", // Empty location as we're removing this field
        description: data.description,
        is_public: data.isPublic,
        business_id: data.businessId,
        status: data.status,
      };
      
      return job
        ? apiRequest("PUT", `/api/jobs/${job.id}`, apiData)
        : apiRequest("POST", "/api/jobs", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: job ? "Job updated" : "Job created",
        description: job
          ? "The job has been updated successfully."
          : "A new job has been created successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${job ? "update" : "create"} job. Please check your inputs and try again.`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createJobMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter job title/description"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
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
          name="businessId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Business (optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {businesses?.map((business) => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.name}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Public Job</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Make this job visible to all contractors
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? "Saving..." : job ? "Update Job" : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default JobForm;