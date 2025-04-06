import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SupplierLayout from "@/components/supplier/layout";
import { Job, JobPart, Part } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface JobPartWithDetail extends JobPart {
  part: Part;
}

const JobDetailsPage = () => {
  const { id } = useParams();
  const jobId = parseInt(id);
  const { toast } = useToast();
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [partTypeFilter, setPartTypeFilter] = useState("all");

  // Fetch job details
  const { data: job, isLoading: isJobLoading } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !isNaN(jobId),
  });

  // Fetch job parts with details
  const { data: jobParts, isLoading: areJobPartsLoading } = useQuery<JobPartWithDetail[]>({
    queryKey: [`/api/jobs/${jobId}/parts`],
    enabled: !isNaN(jobId),
  });

  // Fetch all parts
  const { data: parts, isLoading: arePartsLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
  });

  // Mutation to add part to job
  const addPartToJobMutation = useMutation({
    mutationFn: async (newJobPart: { partId: number; quantity: number; notes: string }) => {
      return apiRequest("POST", `/api/jobs/${jobId}/parts`, newJobPart);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/parts`] });
      setIsAddPartModalOpen(false);
      setSelectedPart(null);
      setQuantity(1);
      setNotes("");
      toast({
        title: "Part added",
        description: "Part has been added to the job successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add part to job. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding part to job:", error);
    },
  });

  // Mutation to remove part from job
  const removePartFromJobMutation = useMutation({
    mutationFn: async (jobPartId: number) => {
      return apiRequest("DELETE", `/api/jobs/${jobId}/parts/${jobPartId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/parts`] });
      toast({
        title: "Part removed",
        description: "Part has been removed from the job successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove part from job. Please try again.",
        variant: "destructive",
      });
      console.error("Error removing part from job:", error);
    },
  });

  // Handle adding part to job
  const handleAddPartToJob = () => {
    if (selectedPart) {
      addPartToJobMutation.mutate({
        partId: selectedPart.id,
        quantity,
        notes,
      });
    }
  };

  // Handle removing part from job
  const handleRemovePartFromJob = (jobPartId: number) => {
    if (confirm("Are you sure you want to remove this part from the job?")) {
      removePartFromJobMutation.mutate(jobPartId);
    }
  };

  // Filter parts based on search and type
  const filteredParts = parts
    ? parts.filter(part => {
        const matchesSearch = searchQuery
          ? part.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.item_code.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        const matchesType = partTypeFilter !== "all" 
          ? part.type === partTypeFilter
          : true;
        
        return matchesSearch && matchesType;
      })
    : [];

  // Get unique part types for filter dropdown
  const partTypes = parts 
    ? [...new Set(parts.map(part => part.type))]
    : [];

  if (isJobLoading) {
    return (
      <SupplierLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupplierLayout>
    );
  }

  if (!job) {
    return (
      <SupplierLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The requested job could not be found.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">{job.description || job.name}</h2>
          <p className="text-gray-500">Job Number: {job.jobNumber}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Jobs
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-500">Status</p>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === "active"
                      ? "bg-green-100 text-green-800"
                      : job.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {job.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Location</p>
              <p className="mt-1">{job.location || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Public</p>
              <p className="mt-1">{job.isPublic ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="job-parts" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="job-parts">Job Parts</TabsTrigger>
          <TabsTrigger value="add-parts">Add Parts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="job-parts">
          <Card>
            <CardHeader>
              <CardTitle>Parts for This Job</CardTitle>
            </CardHeader>
            <CardContent>
              {areJobPartsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : jobParts && jobParts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pipe Size</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobParts.map((jobPart) => (
                      <TableRow key={jobPart.id}>
                        <TableCell>{jobPart.part.item_code}</TableCell>
                        <TableCell>{jobPart.part.description}</TableCell>
                        <TableCell>{jobPart.part.type}</TableCell>
                        <TableCell>{jobPart.part.pipe_size}</TableCell>
                        <TableCell>{jobPart.quantity}</TableCell>
                        <TableCell>{jobPart.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-900"
                            onClick={() => handleRemovePartFromJob(jobPart.id)}
                          >
                            <i className="fas fa-trash"></i>
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No parts have been added to this job yet.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => document.querySelector('[data-value="add-parts"]')?.click()}
                  >
                    Add Parts Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add-parts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Parts to Job</CardTitle>
              <div className="flex space-x-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search parts..."
                    className="w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="border border-input px-3 py-2 rounded-md text-sm"
                  value={partTypeFilter}
                  onChange={(e) => setPartTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {partTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {arePartsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : filteredParts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pipe Size</TableHead>
                      <TableHead>Price (T1)</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>{part.item_code}</TableCell>
                        <TableCell>{part.description}</TableCell>
                        <TableCell>{part.type}</TableCell>
                        <TableCell>{part.pipe_size}</TableCell>
                        <TableCell>${part.price_t1.toFixed(2)}</TableCell>
                        <TableCell>{part.in_stock || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary"
                            onClick={() => {
                              setSelectedPart(part);
                              setIsAddPartModalOpen(true);
                            }}
                          >
                            <i className="fas fa-plus mr-1"></i> Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No parts match your search criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Part Modal */}
      <Dialog open={isAddPartModalOpen} onOpenChange={setIsAddPartModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Part to Job</DialogTitle>
            <DialogDescription>
              Add this part to the current job with the specified quantity and notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPart && (
              <div className="space-y-2">
                <div className="font-medium">{selectedPart.description}</div>
                <div className="text-sm text-gray-500">Item Code: {selectedPart.item_code}</div>
                <div className="text-sm text-gray-500">Type: {selectedPart.type}</div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddPartModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddPartToJob}
              disabled={addPartToJobMutation.isPending}
            >
              {addPartToJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Part"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplierLayout>
  );
};

export default JobDetailsPage;