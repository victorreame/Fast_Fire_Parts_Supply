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
import { Job, Part } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const JobDetailsPage = () => {
  const { id } = useParams();
  const jobId = parseInt(id);
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [partQuantity, setPartQuantity] = useState(1);
  const [partNotes, setPartNotes] = useState("");

  const { data: jobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts/popular'],
  });
  
  const { data: jobParts, isLoading: isLoadingJobParts } = useQuery({
    queryKey: ['/api/jobs', jobId, 'parts'],
    queryFn: () => fetch(`/api/jobs/${jobId}/parts`).then(res => res.json()),
    enabled: !!jobId && !isNaN(jobId),
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
  
  const addJobPartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${jobId}/parts`, {
        partId: selectedPartId,
        quantity: partQuantity,
        notes: partNotes || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId, 'parts'] });
      toast({
        title: "Part added",
        description: "Part has been added to the job successfully.",
      });
      setIsAddPartDialogOpen(false);
      setSelectedPartId(null);
      setPartQuantity(1);
      setPartNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add part to job. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const removeJobPartMutation = useMutation({
    mutationFn: async (partId: number) => {
      return apiRequest("DELETE", `/api/jobs/${jobId}/parts/${partId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId, 'parts'] });
      toast({
        title: "Part removed",
        description: "Part has been removed from the job successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove part from job. Please try again.",
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

  const handleOpenAddPartDialog = (partId: number) => {
    setSelectedPartId(partId);
    setPartQuantity(1);
    setPartNotes("");
    setIsAddPartDialogOpen(true);
  };
  
  const handleAddJobPart = () => {
    if (selectedPartId && partQuantity > 0) {
      addJobPartMutation.mutate();
    }
  };
  
  const handleRemoveJobPart = (partId: number) => {
    removeJobPartMutation.mutate(partId);
  };

  return (
    <MobileLayout title="Job Details" showBackButton={true}>
      <div className="p-4 bg-white border-b border-neutral-200">
        {job ? (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{job.description || job.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">Job #: {job.jobNumber}</p>
              </div>
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

      <div className="w-full">
        <div className="border-b border-neutral-200 p-2 bg-neutral-50">
          <h3 className="font-medium text-center">Job Parts</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-neutral-100 border-b border-neutral-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Parts for this Job</h3>
              <p className="text-sm text-neutral-500">Parts assigned to this job</p>
            </div>
          </div>
          
          {isLoadingJobParts ? (
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
          ) : jobParts?.length > 0 ? (
            <div>
              {jobParts.map((jobPart: any) => (
                <div key={jobPart.id} className="p-4 border-b border-neutral-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <div className="text-lg font-semibold">{jobPart.part.item_code}</div>
                        <div className="ml-2 text-sm bg-neutral-100 px-2 py-0.5 rounded">{jobPart.part.pipe_size}</div>
                      </div>
                      <div className="mt-1 text-sm">{jobPart.part.description}</div>
                      <div className="mt-1 flex items-center">
                        <span className="text-sm font-medium">Qty: {jobPart.quantity}</span>
                        {jobPart.notes && (
                          <span className="ml-2 text-xs text-neutral-500">Notes: {jobPart.notes}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500" 
                      onClick={() => handleRemoveJobPart(jobPart.id)}
                      disabled={removeJobPartMutation.isPending}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No parts added to this job yet.</p>
              <p className="text-sm text-neutral-400 mt-2">Contact your supervisor to have parts added to this job.</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Dialog */}
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
      
      {/* Add Part Dialog */}
      <Dialog open={isAddPartDialogOpen} onOpenChange={setIsAddPartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Part to Job</DialogTitle>
            <DialogDescription>
              Specify quantity and optional notes for this part.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={partQuantity}
                onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={partNotes}
                onChange={(e) => setPartNotes(e.target.value)}
                rows={3}
                placeholder="Add any special instructions or notes about this part"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddJobPart} disabled={!selectedPartId || partQuantity < 1 || addJobPartMutation.isPending}>
              {addJobPartMutation.isPending ? "Adding..." : "Add Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default JobDetailsPage;
