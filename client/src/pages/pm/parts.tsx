import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PMLayout from "@/components/pm/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EyeIcon,
  SearchIcon,
  FilterIcon,
  PackageIcon,
  ArrowUpDownIcon,
  PlusCircleIcon,
  Loader2,
} from "lucide-react";

// Part interface
interface Part {
  id: number;
  item_code: string;
  type: string;
  pipe_size: string;
  description: string;
  price_t1: number;
  price_t2: number;
  price_t3: number;
  manufacturer: string | null;
  category: string | null;
  in_stock: number;
  is_popular: boolean;
  image: string | null;
}

// Part with details interface
interface PartWithDetails extends Part {
  part_number: string | null;
  barcode: string | null;
  weight: number | null;
  dimensions: string | null;
  notes: string | null;
  min_stock_level: number | null;
  last_ordered: string | null;
}

const PAGE_SIZE = 10;

const PartsCatalog = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("item_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showPartDetails, setShowPartDetails] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartWithDetails | null>(null);
  const [showJobPartForm, setShowJobPartForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Query for parts
  const {
    data: partsData,
    isLoading: partsLoading,
    refetch: refetchParts,
  } = useQuery<{ parts: Part[]; types: string[]; categories: string[] }>({
    queryKey: ['/api/parts', 'catalog'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/parts/catalog');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch parts catalog:", error);
        return { parts: [], types: [], categories: [] };
      }
    },
  });

  // Query for user's jobs
  const {
    data: jobs,
    isLoading: jobsLoading,
  } = useQuery<{ id: number; name: string; jobNumber: string }[]>({
    queryKey: ['/api/jobs/pm/active'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/jobs/pm/active/minimal');
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        return [];
      }
    },
  });

  // Query for part details
  const fetchPartDetails = async (partId: number) => {
    try {
      const response = await apiRequest('GET', `/api/parts/${partId}/details`);
      const data = await response.json();
      setSelectedPart(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch part details:", error);
      setSelectedPart(null);
      return null;
    }
  };

  // Add part to job mutation
  const addToJobMutation = useMutation({
    mutationFn: async ({ jobId, partId, quantity }: { jobId: number; partId: number; quantity: number }) => {
      const response = await apiRequest('POST', `/api/jobs/${jobId}/parts`, { partId, quantity });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Part added to job",
        description: "The part has been added to the job successfully.",
      });
      
      // Close dialog and reset form
      setShowJobPartForm(false);
      setSelectedJob(null);
      setQuantity(1);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add part to job. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort parts
  const filteredParts = partsData?.parts.filter(part => {
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      part.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (part.manufacturer && part.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by type
    const matchesType = selectedType === "" || part.type === selectedType;
    
    // Filter by category
    const matchesCategory = selectedCategory === "" || part.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  }) || [];

  // Sort parts
  const sortedParts = [...filteredParts].sort((a, b) => {
    let aValue = a[sortField as keyof Part];
    let bValue = b[sortField as keyof Part];
    
    // Handle null values
    if (aValue === null) aValue = '';
    if (bValue === null) bValue = '';
    
    // Compare based on type
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      // For numbers and booleans
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    }
  });

  // Paginate parts
  const paginatedParts = sortedParts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredParts.length / PAGE_SIZE);

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedCategory]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleViewPart = async (part: Part) => {
    await fetchPartDetails(part.id);
    setShowPartDetails(true);
  };

  const handleAddToJob = (part: Part) => {
    setSelectedPart(part as PartWithDetails);
    setShowJobPartForm(true);
  };

  const handleAddToJobSubmit = () => {
    if (!selectedJob || !selectedPart) return;
    
    addToJobMutation.mutate({
      jobId: selectedJob,
      partId: selectedPart.id,
      quantity,
    });
  };

  return (
    <PMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Parts Catalog</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find parts by name, type, or category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search by item code, description, manufacturer..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {partsData?.types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {partsData?.categories
                    .filter(Boolean) // Filter out null values
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parts List</CardTitle>
          <CardDescription>
            Browse and add parts to jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : paginatedParts.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort('item_code')}>
                        <div className="flex items-center">
                          Item Code
                          {sortField === 'item_code' && (
                            <ArrowUpDownIcon className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                        <div className="flex items-center">
                          Description
                          {sortField === 'description' && (
                            <ArrowUpDownIcon className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                        <div className="flex items-center">
                          Type
                          {sortField === 'type' && (
                            <ArrowUpDownIcon className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort('pipe_size')}>
                        <div className="flex items-center">
                          Size
                          {sortField === 'pipe_size' && (
                            <ArrowUpDownIcon className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => handleSort('price_t2')}>
                        <div className="flex items-center justify-end">
                          Price
                          {sortField === 'price_t2' && (
                            <ArrowUpDownIcon className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-center cursor-pointer" onClick={() => handleSort('in_stock')}>
                        <div className="flex items-center justify-center">
                          Stock
                          {sortField === 'in_stock' && (
                            <ArrowUpDownIcon className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.item_code}</TableCell>
                        <TableCell>
                          <div>{part.description}</div>
                          {part.is_popular && (
                            <Badge variant="default" className="mt-1 text-xs bg-primary/20 text-primary hover:bg-primary/20">
                              Popular
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{part.type}</TableCell>
                        <TableCell className="hidden md:table-cell">{part.pipe_size}</TableCell>
                        <TableCell className="text-right">{formatCurrency(part.price_t2)}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <Badge
                            variant={part.in_stock > 10 ? "outline" : part.in_stock > 0 ? "secondary" : "destructive"}
                          >
                            {part.in_stock > 0 ? part.in_stock : "Out of stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPart(part)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Details</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAddToJob(part)}
                            >
                              <PlusCircleIcon className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Add to Job</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all page numbers
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // We're near the start
                          pageNum = i + 1;
                          if (i === 4) return (
                            <PaginationItem key="ellipsis-end">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else if (currentPage >= totalPages - 2) {
                          // We're near the end
                          pageNum = totalPages - 4 + i;
                          if (i === 0) return (
                            <PaginationItem key="ellipsis-start">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else {
                          // We're in the middle
                          pageNum = currentPage - 2 + i;
                          if (i === 0) return (
                            <PaginationItem key="ellipsis-start">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          if (i === 4) return (
                            <PaginationItem key="ellipsis-end">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <PackageIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No parts found matching your criteria</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Part Details Dialog */}
      <Dialog open={showPartDetails} onOpenChange={setShowPartDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Part Details</DialogTitle>
            <DialogDescription>
              {selectedPart && (
                <div className="text-sm text-gray-500">
                  {selectedPart.item_code} - {selectedPart.description}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPart && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="rounded-lg overflow-hidden mb-4 border border-gray-200">
                  {selectedPart.image ? (
                    <img
                      src={selectedPart.image}
                      alt={selectedPart.description}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="bg-gray-100 flex items-center justify-center h-48">
                      <PackageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Inventory Status</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">In Stock:</span>
                        <Badge
                          variant={selectedPart.in_stock > 10 ? "outline" : selectedPart.in_stock > 0 ? "secondary" : "destructive"}
                        >
                          {selectedPart.in_stock > 0 ? selectedPart.in_stock : "Out of stock"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Min Stock Level:</span>
                        <span>{selectedPart.min_stock_level || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Ordered:</span>
                        <span>
                          {selectedPart.last_ordered
                            ? new Date(selectedPart.last_ordered).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Item Code</h3>
                        <p className="text-sm">{selectedPart.item_code}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Part Number</h3>
                        <p className="text-sm">{selectedPart.part_number || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Type</h3>
                        <p className="text-sm">{selectedPart.type}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Category</h3>
                        <p className="text-sm">{selectedPart.category || "Uncategorized"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Pipe Size</h3>
                        <p className="text-sm">{selectedPart.pipe_size}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Manufacturer</h3>
                        <p className="text-sm">{selectedPart.manufacturer || "Unknown"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Weight</h3>
                        <p className="text-sm">
                          {selectedPart.weight ? `${selectedPart.weight} kg` : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Dimensions</h3>
                        <p className="text-sm">{selectedPart.dimensions || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-1">Description</h3>
                      <p className="text-sm">{selectedPart.description}</p>
                    </div>
                    
                    {selectedPart.notes && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold mb-1">Notes</h3>
                        <p className="text-sm bg-gray-50 p-2 rounded">{selectedPart.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Tier 1 Price</h3>
                        <p className="text-lg font-bold">{formatCurrency(selectedPart.price_t1)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Tier 2 Price</h3>
                        <p className="text-lg font-bold">{formatCurrency(selectedPart.price_t2)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Tier 3 Price</h3>
                        <p className="text-lg font-bold">{formatCurrency(selectedPart.price_t3)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleAddToJob(selectedPart)}>
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Add to Job
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Job Dialog */}
      <Dialog open={showJobPartForm} onOpenChange={setShowJobPartForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Part to Job</DialogTitle>
            <DialogDescription>
              Select a job and specify the quantity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="job" className="text-sm font-medium">
                Select Job
              </label>
              <Select
                onValueChange={(value) => setSelectedJob(parseInt(value))}
                value={selectedJob?.toString()}
              >
                <SelectTrigger id="job">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.jobNumber} - {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            {selectedPart && (
              <div className="border rounded-md p-3 bg-gray-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Part:</span>
                  <span className="text-sm">
                    {selectedPart.item_code} - {selectedPart.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Unit Price:</span>
                  <span className="text-sm">{formatCurrency(selectedPart.price_t2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Price:</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(selectedPart.price_t2 * quantity)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowJobPartForm(false);
                setSelectedJob(null);
                setQuantity(1);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToJobSubmit}
              disabled={!selectedJob || addToJobMutation.isPending}
            >
              {addToJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add to Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PMLayout>
  );
};

export default PartsCatalog;