import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Part, insertPartSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { FaUpload, FaImage } from "react-icons/fa";

interface PartFormProps {
  part?: Part | null;
  onSuccess?: () => void;
}

// Extend the insertPartSchema with validation
const partFormSchema = insertPartSchema.extend({
  itemCode: z.string().min(3, "Item code must be at least 3 characters"),
  pipeSize: z.string().min(1, "Pipe size is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  type: z.string().min(1, "Type is required"),
  priceT1: z.number().min(0.01, "Price T1 must be greater than 0"),
  priceT2: z.number().min(0.01, "Price T2 must be greater than 0"),
  priceT3: z.number().min(0.01, "Price T3 must be greater than 0"),
  inStock: z.number().min(0, "Stock cannot be negative"),
  isPopular: z.boolean(),
});

type PartFormValues = z.infer<typeof partFormSchema>;

const PartForm: React.FC<PartFormProps> = ({ part, onSuccess }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(part?.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: parts } = useQuery({
    queryKey: ['/api/parts'],
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Only image files are allowed",
          variant: "destructive",
        });
        return;
      }
      
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload image to server
  const uploadImageMutation = useMutation({
    mutationFn: async (partId: number) => {
      if (!image) return null;
      
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('image', image);
      
      const response = await fetch(`/api/parts/${partId}/image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: () => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Extract unique types for dropdown
  const partTypes = Array.isArray(parts)
    ? Array.from(new Set(parts.map((p: Part) => p.type))).sort()
    : [];

  // Extract unique pipe sizes for dropdown
  const pipeSizes = Array.isArray(parts)
    ? Array.from(new Set(parts.map((p: Part) => p.pipeSize))).sort()
    : [];

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: part
      ? {
          itemCode: part.itemCode,
          pipeSize: part.pipeSize,
          description: part.description,
          type: part.type,
          priceT1: part.priceT1,
          priceT2: part.priceT2,
          priceT3: part.priceT3,
          inStock: part.inStock || 0, // Ensure it's not null
          isPopular: part.isPopular || false, // Ensure it's not null
          image: part.image
        }
      : {
          itemCode: "",
          pipeSize: "",
          description: "",
          type: "",
          priceT1: 0,
          priceT2: 0,
          priceT3: 0,
          inStock: 0,
          isPopular: false,
          image: undefined
        },
  });

  const createPartMutation = useMutation({
    mutationFn: async (values: PartFormValues) => {
      return apiRequest("POST", "/api/parts", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Success",
        description: "Part has been successfully created.",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create part. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: async (values: PartFormValues) => {
      if (!part) return;
      return apiRequest("PUT", `/api/parts/${part.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Success",
        description: "Part has been successfully updated.",
      });
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update part. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: PartFormValues) => {
    try {
      if (part) {
        // Update existing part
        await updatePartMutation.mutateAsync(values);
        
        // Upload image if selected
        if (image) {
          setIsUploading(true);
          await uploadImageMutation.mutateAsync(part.id);
          setIsUploading(false);
        }
      } else {
        // Create new part
        const newPartResponse = await createPartMutation.mutateAsync(values);
        
        // Upload image if selected and part created successfully
        if (image && newPartResponse) {
          // Safely parse the response to get the part ID
          let newPartId: number | undefined;
          try {
            const newPart = newPartResponse as unknown as Part;
            newPartId = newPart.id;
          } catch (err) {
            console.error("Error parsing part response:", err);
          }
          
          if (newPartId) {
            setIsUploading(true);
            await uploadImageMutation.mutateAsync(newPartId);
            setIsUploading(false);
          }
        }
      }
      
      // Clear file input after successful submission
      if (image) {
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Error saving part:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
        {/* Top Section - Main Fields */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="itemCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. VLV-123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pipeSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pipe Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pipeSizes.length > 0 ? (
                      pipeSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="1/2&quot;">1/2&quot;</SelectItem>
                        <SelectItem value="3/4&quot;">3/4&quot;</SelectItem>
                        <SelectItem value="1&quot;">1&quot;</SelectItem>
                        <SelectItem value="1-1/4&quot;">1-1/4&quot;</SelectItem>
                        <SelectItem value="1-1/2&quot;">1-1/2&quot;</SelectItem>
                        <SelectItem value="2&quot;">2&quot;</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {partTypes.length > 0 ? (
                      partTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Valve">Valve</SelectItem>
                        <SelectItem value="Pipe">Pipe</SelectItem>
                        <SelectItem value="Fitting">Fitting</SelectItem>
                        <SelectItem value="Sprinkler">Sprinkler</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description Field */}
        <div className="grid grid-cols-1">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter part description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Middle Section - Split in Two Columns */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Pricing and Stock */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="priceT1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price T1 ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priceT2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price T2 ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priceT3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price T3 ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPopular"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Popular Item</FormLabel>
                    <FormDescription>
                      Show in Top 50 list
                    </FormDescription>
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
          </div>
          
          {/* Right Column - Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="part-image">Part Image</Label>
            <div className="flex items-start gap-4">
              <div>
                {previewUrl ? (
                  <div className="relative w-32 h-32 rounded border overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Part preview" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => {
                        setPreviewUrl(null);
                        setImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <span className="sr-only">Remove image</span>
                      &times;
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center rounded border bg-muted">
                    <FaImage className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center mb-2 w-full"
                  disabled={isUploading}
                >
                  <FaUpload className="mr-2 h-4 w-4" />
                  {previewUrl ? "Change image" : "Upload image"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Upload a clear image of the part.<br />
                  JPG, PNG or GIF, max 2MB.
                </p>
                <input
                  ref={fileInputRef}
                  id="part-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full mt-6"
          disabled={createPartMutation.isPending || updatePartMutation.isPending || isUploading}
        >
          {createPartMutation.isPending || updatePartMutation.isPending || isUploading
            ? "Saving..."
            : part
            ? "Update Part"
            : "Add Part"}
        </Button>
      </form>
    </Form>
  );
};

export default PartForm;
