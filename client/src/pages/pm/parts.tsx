import { useState, useEffect } from "react";
import PmLayout from "@/components/pm/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  Package, 
  Filter, 
  ThumbsUp, 
  PlusCircle,
  Info,
  X, 
  ListFilter,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Part type
interface Part {
  id: number;
  item_code: string;
  pipe_size: string;
  description: string;
  type: string;
  category: string | null;
  manufacturer: string | null;
  supplier_code: string | null;
  price_t1: number;
  price_t2: number;
  price_t3: number;
  cost_price?: number;
  in_stock: number;
  min_stock: number;
  is_popular: boolean;
  image: string | null;
}

// Job type (simplified)
interface Job {
  id: number;
  name: string;
  jobNumber: string;
  status: string;
}

// Part recommendation form schema
const recommendPartSchema = z.object({
  jobId: z.string().min(1, "You must select a job"),
  message: z.string().optional(),
});

type RecommendPartValues = z.infer<typeof recommendPartSchema>;

// Add part to job form schema
const addPartToJobSchema = z.object({
  jobId: z.string().min(1, "You must select a job"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

type AddPartToJobValues = z.infer<typeof addPartToJobSchema>;

export default function PmParts() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for search, filtering, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // State for detail modal
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // State for recommend modal
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [partToRecommend, setPartToRecommend] = useState<Part | null>(null);
  
  // State for add to job modal
  const [isAddToJobModalOpen, setIsAddToJobModalOpen] = useState(false);
  const [partToAdd, setPartToAdd] = useState<Part | null>(null);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory]);
  
  // Fetch all parts
  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/pm/parts', searchTerm, selectedType, selectedCategory],
    queryFn: async () => {
      let url = '/api/pm/parts';
      const params = new URLSearchParams();
      
      if (selectedType) {
        params.append('type', selectedType);
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const paramString = params.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch parts');
      }
      return response.json();
    }
  });
  
  // Fetch part types for filter
  const { data: partTypes } = useQuery({
    queryKey: ['/api/pm/parts/types'],
    queryFn: async () => {
      const response = await fetch('/api/pm/parts/types');
      if (!response.ok) {
        throw new Error('Failed to fetch part types');
      }
      return response.json();
    }
  });
  
  // Fetch part categories for filter
  const { data: partCategories } = useQuery({
    queryKey: ['/api/pm/parts/categories'],
    queryFn: async () => {
      const response = await fetch('/api/pm/parts/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch part categories');
      }
      return response.json();
    }
  });
  
  // Fetch PM's jobs for recommend and add to job modals
  const { data: jobs } = useQuery({
    queryKey: ['/api/pm/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/pm/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    }
  });
  
  // Recommend part mutation
  const recommendPartMutation = useMutation({
    mutationFn: async ({ partId, data }: { partId: number, data: RecommendPartValues }) => {
      const response = await apiRequest('POST', `/api/pm/parts/${partId}/recommend`, {
        jobId: parseInt(data.jobId),
        message: data.message
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recommend part');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsRecommendModalOpen(false);
      setPartToRecommend(null);
      toast({
        title: "Part recommended",
        description: "Your recommendation has been sent to the tradies assigned to this job.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to recommend part",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Add part to job mutation
  const addPartToJobMutation = useMutation({
    mutationFn: async ({ jobId, partId, quantity, notes }: { jobId: number, partId: number, quantity: number, notes?: string }) => {
      const response = await apiRequest('POST', `/api/pm/jobs/${jobId}/parts`, {
        partId,
        quantity,
        notes
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add part to job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsAddToJobModalOpen(false);
      setPartToAdd(null);
      toast({
        title: "Part added to job",
        description: "The part has been added to the job requirements.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add part to job",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Forms setup
  const recommendForm = useForm<RecommendPartValues>({
    resolver: zodResolver(recommendPartSchema),
    defaultValues: {
      jobId: "",
      message: ""
    }
  });
  
  const addToJobForm = useForm<AddPartToJobValues>({
    resolver: zodResolver(addPartToJobSchema),
    defaultValues: {
      jobId: "",
      quantity: 1,
      notes: ""
    }
  });
  
  // Form submission handlers
  const onSubmitRecommend = (values: RecommendPartValues) => {
    if (!partToRecommend) return;
    
    recommendPartMutation.mutate({
      partId: partToRecommend.id,
      data: values
    });
  };
  
  const onSubmitAddToJob = (values: AddPartToJobValues) => {
    if (!partToAdd) return;
    
    addPartToJobMutation.mutate({
      jobId: parseInt(values.jobId),
      partId: partToAdd.id,
      quantity: values.quantity,
      notes: values.notes
    });
  };
  
  // Handle opening detail modal
  const handleViewDetails = (part: Part) => {
    setSelectedPart(part);
    setIsDetailModalOpen(true);
  };
  
  // Handle opening recommend modal
  const handleRecommendPart = (part: Part) => {
    setPartToRecommend(part);
    recommendForm.reset({
      jobId: "",
      message: `I recommend using this ${part.description} (${part.item_code}) for the job.`
    });
    setIsRecommendModalOpen(true);
  };
  
  // Handle opening add to job modal
  const handleAddToJob = (part: Part) => {
    setPartToAdd(part);
    addToJobForm.reset({
      jobId: "",
      quantity: 1,
      notes: ""
    });
    setIsAddToJobModalOpen(true);
  };
  
  // Filter and paginate parts
  const filteredParts = parts || [];
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, startIndex + itemsPerPage);
  
  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Determine stock status and badge color
  const getStockStatus = (part: Part) => {
    if (part.in_stock <= 0) return { status: "Out of Stock", color: "bg-red-400" };
    if (part.in_stock < part.min_stock) return { status: "Low Stock", color: "bg-amber-400" };
    return { status: "In Stock", color: "bg-green-400" };
  };
  
  return (
    <PmLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Parts Catalog</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search parts..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter by Type</span>
                  {selectedType && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedType}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Part Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setSelectedType(null)}
                    className={!selectedType ? "bg-accent" : ""}
                  >
                    All Types
                  </DropdownMenuItem>
                  {partTypes?.map((type: string) => (
                    <DropdownMenuItem 
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={selectedType === type ? "bg-accent" : ""}
                    >
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter by Category</span>
                  {selectedCategory && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedCategory}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory(null)}
                    className={!selectedCategory ? "bg-accent" : ""}
                  >
                    All Categories
                  </DropdownMenuItem>
                  {partCategories?.map((category: string) => (
                    <DropdownMenuItem 
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-accent" : ""}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Clear Filters Button */}
            {(selectedType || selectedCategory || searchTerm) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedType(null);
                  setSelectedCategory(null);
                  setSearchTerm("");
                }}
                className="flex gap-2"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Clear Filters</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Parts Grid */}
        {isLoadingParts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-48 bg-muted">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : currentParts.length === 0 ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>No Parts Found</CardTitle>
              <CardDescription>
                No parts match your current search criteria or filters.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedType(null);
                  setSelectedCategory(null);
                  setSearchTerm("");
                }}
              >
                Clear All Filters
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentParts.map((part) => {
                const stockStatus = getStockStatus(part);
                
                return (
                  <Card key={part.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                      {part.image ? (
                        <img
                          src={part.image}
                          alt={part.description}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <Package className="h-24 w-24 text-muted-foreground/50" />
                      )}
                      
                      {/* Popular badge */}
                      {part.is_popular && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary">Popular</Badge>
                        </div>
                      )}
                      
                      {/* Stock status badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate" title={part.description}>
                        {part.description}
                      </CardTitle>
                      <CardDescription className="flex justify-between">
                        <span>Item: {part.item_code}</span>
                        <span>Size: {part.pipe_size}</span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-4 py-0 flex-grow">
                      <div className="mb-2">
                        <div className="text-sm text-muted-foreground">
                          Type: <span className="font-medium">{part.type}</span>
                        </div>
                        {part.category && (
                          <div className="text-sm text-muted-foreground">
                            Category: <span className="font-medium">{part.category}</span>
                          </div>
                        )}
                        {part.manufacturer && (
                          <div className="text-sm text-muted-foreground">
                            Manufacturer: <span className="font-medium">{part.manufacturer}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">T1 Price:</p>
                          <p className="font-semibold">{formatPrice(part.price_t1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">T2 Price:</p>
                          <p className="font-semibold">{formatPrice(part.price_t2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">T3 Price:</p>
                          <p className="font-semibold">{formatPrice(part.price_t3)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">In Stock:</p>
                          <p className="font-semibold">{part.in_stock}</p>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-2 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(part)}
                      >
                        <Info className="mr-1 h-4 w-4" />
                        Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleAddToJob(part)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add to Job
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRecommendPart(part)}>
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Recommend to Tradies
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Part Detail Modal */}
      {selectedPart && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedPart.description}</DialogTitle>
              <DialogDescription>Item Code: {selectedPart.item_code}</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 flex items-center justify-center bg-muted rounded-md p-4">
                {selectedPart.image ? (
                  <img
                    src={selectedPart.image}
                    alt={selectedPart.description}
                    className="max-h-48 object-contain"
                  />
                ) : (
                  <Package className="h-24 w-24 text-muted-foreground/50" />
                )}
              </div>
              
              <div className="md:col-span-2">
                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="pricing" className="flex-1">Pricing</TabsTrigger>
                    <TabsTrigger value="stock" className="flex-1">Stock</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium">{selectedPart.type}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Pipe Size</Label>
                        <p className="font-medium">{selectedPart.pipe_size}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Category</Label>
                        <p className="font-medium">{selectedPart.category || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Manufacturer</Label>
                        <p className="font-medium">{selectedPart.manufacturer || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Supplier Code</Label>
                        <p className="font-medium">{selectedPart.supplier_code || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Popular Item</Label>
                        <p className="font-medium">{selectedPart.is_popular ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pricing" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Tier 1 Price (Retail)</Label>
                        <p className="text-xl font-semibold">{formatPrice(selectedPart.price_t1)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tier 2 Price (Standard)</Label>
                        <p className="text-xl font-semibold">{formatPrice(selectedPart.price_t2)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tier 3 Price (Volume)</Label>
                        <p className="text-xl font-semibold">{formatPrice(selectedPart.price_t3)}</p>
                      </div>
                      {selectedPart.cost_price && (
                        <div>
                          <Label className="text-muted-foreground">Cost Price</Label>
                          <p className="text-xl font-semibold">{formatPrice(selectedPart.cost_price)}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stock" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Current Stock</Label>
                        <p className="text-xl font-semibold">{selectedPart.in_stock} units</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Minimum Stock</Label>
                        <p className="text-xl font-semibold">{selectedPart.min_stock} units</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Stock Status</Label>
                        <div className="mt-1">
                          <Badge className={getStockStatus(selectedPart).color}>
                            {getStockStatus(selectedPart).status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleRecommendPart(selectedPart);
                }}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Recommend to Tradies
              </Button>
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleAddToJob(selectedPart);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add to Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Recommend Part Modal */}
      {partToRecommend && (
        <Dialog open={isRecommendModalOpen} onOpenChange={setIsRecommendModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Recommend Part to Tradies</DialogTitle>
              <DialogDescription>
                Recommend {partToRecommend.description} to tradies assigned to a job.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...recommendForm}>
              <form onSubmit={recommendForm.handleSubmit(onSubmitRecommend)} className="space-y-4">
                <FormField
                  control={recommendForm.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Job</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Your Jobs</SelectLabel>
                            {jobs?.map((job: Job) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.name} ({job.jobNumber})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The recommendation will be sent to all tradies assigned to this job.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={recommendForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a message to the recommendation..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Explain why you're recommending this part.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRecommendModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={recommendPartMutation.isPending}
                  >
                    {recommendPartMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Send Recommendation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Add Part to Job Modal */}
      {partToAdd && (
        <Dialog open={isAddToJobModalOpen} onOpenChange={setIsAddToJobModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Part to Job</DialogTitle>
              <DialogDescription>
                Add {partToAdd.description} to a job's requirements.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...addToJobForm}>
              <form onSubmit={addToJobForm.handleSubmit(onSubmitAddToJob)} className="space-y-4">
                <FormField
                  control={addToJobForm.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Job</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Your Jobs</SelectLabel>
                            {jobs?.map((job: Job) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.name} ({job.jobNumber})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addToJobForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addToJobForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about this part requirement..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include any special instructions or details.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-muted-foreground flex items-center mr-auto">
                          <Info className="h-4 w-4 mr-1" />
                          {partToAdd.in_stock > 0 ? (
                            <span>{partToAdd.in_stock} in stock</span>
                          ) : (
                            <span className="text-red-500">Out of stock</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {partToAdd.in_stock > 0
                          ? `${partToAdd.in_stock} units available to order`
                          : "This part is currently out of stock"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddToJobModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPartToJobMutation.isPending}
                  >
                    {addPartToJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add to Job
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </PmLayout>
  );
}