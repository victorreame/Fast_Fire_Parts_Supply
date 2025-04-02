import { useParams, useLocation } from "wouter";
import MobileLayout from "@/components/mobile/layout";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartCard from "@/components/mobile/part-card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const JobDetailsPage = () => {
  const { id } = useParams();
  const jobId = parseInt(id);
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data: jobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts/popular'],
  });

  // Find the job from the jobs query result
  const job = jobs?.find((j: Job) => j.id === jobId);

  const updateJobMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/jobs/${jobId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job updated",
        description: "Job status has been successfully updated.",
      });
      setIsUpdateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = () => {
    if (newStatus) {
      updateJobMutation.mutate();
    }
  };

  const openUpdateDialog = () => {
    setNewStatus(job?.status || "");
    setIsUpdateDialogOpen(true);
  };

  if (!job && !isLoadingParts) {
    return (
      <MobileLayout title="Job Not Found" showBackButton={true}>
        <div className="p-8 text-center">
          <p className="text-neutral-500">The job you're looking for doesn't exist.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/jobs")}>
            Back to Jobs
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const statusBadgeVariant = () => {
    switch (job?.status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const formattedDate = job?.updatedAt 
    ? format(new Date(job.updatedAt), "MMM dd, yyyy")
    : "";

  return (
    <MobileLayout title="Job Details" showBackButton={true}>
      <div className="p-4 bg-white border-b border-neutral-200">
        {job ? (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{job.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">Job #: {job.jobNumber}</p>
              </div>
              <Button variant="outline" size="sm" onClick={openUpdateDialog}>
                <i className="fas fa-edit mr-1"></i> Update
              </Button>
            </div>
            
            <div className="flex mt-3">
              <Badge variant="outline" className={statusBadgeVariant()}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              {formattedDate && (
                <span className="text-xs text-neutral-500 ml-2 flex items-center">
                  Updated: {formattedDate}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-36 mb-3" />
            <Skeleton className="h-5 w-24" />
          </div>
        )}
      </div>

      <div className="p-4 bg-neutral-100 border-b border-neutral-200">
        <h3 className="font-semibold">Recommended Parts</h3>
        <p className="text-sm text-neutral-500">Add these to your cart for this job</p>
      </div>

      <div className="overflow-y-auto">
        {isLoadingParts ? (
          // Loading skeleton
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="p-4 border-b border-neutral-200">
                <div className="flex justify-between">
                  <div className="w-full">
                    <div className="flex items-start">
                      <Skeleton className="h-6 w-16 rounded mr-2" />
                      <Skeleton className="h-6 w-10 rounded" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mt-2" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
        ) : parts?.length > 0 ? (
          parts.slice(0, 10).map((part) => (
            <PartCard key={part.id} part={part} jobId={jobId} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No recommended parts available.</p>
          </div>
        )}
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
            <DialogDescription>
              Change the status of this job.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus || updateJobMutation.isPending}>
              {updateJobMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default JobDetailsPage;
