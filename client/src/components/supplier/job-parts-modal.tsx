import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Part, JobPart } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

interface JobPartsModalProps {
  jobId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface JobPartWithDetail extends JobPart {
  part: Part;
}

// Form schema for adding a part to a job
const addPartSchema = z.object({
  partId: z.number(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

type AddPartFormValues = z.infer<typeof addPartSchema>;

const JobPartsModal = ({ jobId, open, onOpenChange }: JobPartsModalProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [partTypeFilter, setPartTypeFilter] = useState("all");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showAddPartForm, setShowAddPartForm] = useState(false);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setPartTypeFilter("all");
      setSelectedPart(null);
      setShowAddPartForm(false);
    }
  }, [open]);

  // Fetch job parts
  const { 
    data: jobParts, 
    isLoading: isLoadingJobParts,
    refetch: refetchJobParts 
  } = useQuery<JobPartWithDetail[]>({
    queryKey: [`/api/jobs/${jobId}/parts`],
    enabled: open && jobId > 0,
  });

  // Fetch all parts
  const { data: parts, isLoading: isLoadingParts } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
    enabled: open,
  });

  // Get unique part types for filter dropdown
  const partTypes = parts ? [...new Set(parts.map(part => part.type))] : [];

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

  // Add part form setup
  const form = useForm<AddPartFormValues>({
    resolver: zodResolver(addPartSchema),
    defaultValues: {
      partId: selectedPart?.id || 0,
      quantity: 1,
      notes: "",
    },
  });

  // Update form when selected part changes
  useEffect(() => {
    if (selectedPart) {
      form.setValue("partId", selectedPart.id);
    }
  }, [selectedPart, form]);

  // Remove part from job mutation
  const removePartMutation = useMutation({
    mutationFn: async (jobPartId: number) => {
      return apiRequest("DELETE", `/api/jobs/${jobId}/parts/${jobPartId}`);
    },
    onSuccess: () => {
      refetchJobParts();
      toast({
        title: "Part removed",
        description: "Part has been removed from the job.",
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

  // Add part to job mutation
  const addPartMutation = useMutation({
    mutationFn: async (data: AddPartFormValues) => {
      return apiRequest("POST", `/api/jobs/${jobId}/parts`, data);
    },
    onSuccess: () => {
      refetchJobParts();
      setShowAddPartForm(false);
      setSelectedPart(null);
      form.reset({ partId: 0, quantity: 1, notes: "" });
      toast({
        title: "Part added",
        description: "Part has been added to the job successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add part to job. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update part quantity mutation
  const updatePartQuantityMutation = useMutation({
    mutationFn: async ({ jobPartId, quantity }: { jobPartId: number; quantity: number }) => {
      return apiRequest("PUT", `/api/jobs/${jobId}/parts/${jobPartId}`, { 
        quantity
      });
    },
    onSuccess: () => {
      refetchJobParts();
      toast({
        title: "Quantity updated",
        description: "Part quantity has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemovePart = (jobPartId: number) => {
    removePartMutation.mutate(jobPartId);
  };

  const handleAddPart = (data: AddPartFormValues) => {
    addPartMutation.mutate(data);
  };

  const handleIncrementQuantity = (jobPart: JobPartWithDetail) => {
    updatePartQuantityMutation.mutate({
      jobPartId: jobPart.id,
      quantity: jobPart.quantity + 1
    });
  };

  const handleDecrementQuantity = (jobPart: JobPartWithDetail) => {
    if (jobPart.quantity > 1) {
      updatePartQuantityMutation.mutate({
        jobPartId: jobPart.id,
        quantity: jobPart.quantity - 1
      });
    }
  };

  const openAddPartForm = (part: Part) => {
    setSelectedPart(part);
    setShowAddPartForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Job Parts Management</DialogTitle>
          <DialogDescription>
            View, add, or remove parts from this job
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="job-parts" className="w-full h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="job-parts">Job Parts</TabsTrigger>
              <TabsTrigger value="add-parts">Parts Catalog</TabsTrigger>
            </TabsList>
            
            <TabsContent value="job-parts" className="h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Parts for This Job</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingJobParts ? (
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
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => handleDecrementQuantity(jobPart)}
                                  disabled={jobPart.quantity <= 1 || updatePartQuantityMutation.isPending}
                                >
                                  -
                                </Button>
                                <span>{jobPart.quantity}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => handleIncrementQuantity(jobPart)}
                                  disabled={updatePartQuantityMutation.isPending}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{jobPart.notes || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-red-600 hover:text-red-900"
                                onClick={() => handleRemovePart(jobPart.id)}
                                disabled={removePartMutation.isPending}
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
            
            <TabsContent value="add-parts" className="h-full overflow-y-auto">
              {showAddPartForm ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Part to Job</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {selectedPart?.item_code}: {selectedPart?.description}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddPart)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
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
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add any notes about this part for the job..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddPartForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={addPartMutation.isPending}
                          >
                            {addPartMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add to Job"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
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
                    {isLoadingParts ? (
                      <Skeleton className="h-64 w-full" />
                    ) : filteredParts.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Pipe Size</TableHead>
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
                              <TableCell>{part.in_stock}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => openAddPartForm(part)}
                                >
                                  Add to Job
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-neutral-500">No parts found matching your search criteria.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobPartsModal;