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

// Create a form schema that matches database field names
const partFormSchema = z.object({
  item_code: z.string().min(3, "Item code must be at least 3 characters"),
  pipe_size: z.string().min(1, "Pipe size is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  type: z.string().min(1, "Type is required"),
  price_t1: z.number().min(0.01, "Price T1 must be greater than 0"),
  price_t2: z.number().min(0.01, "Price T2 must be greater than 0"),
  price_t3: z.number().min(0.01, "Price T3 must be greater than 0"),
  in_stock: z.number().min(0, "Stock cannot be negative"),
  is_popular: z.boolean(),
  image: z.string().optional(),
});

type PartFormValues = z.infer<typeof partFormSchema>;

const PartForm: React.FC<PartFormProps> = ({ part, onSuccess }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(part?.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(part?.image || "");
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
      setImageUrl(""); // Clear URL when file is selected
    }
  };

  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (url.trim()) {
      setPreviewUrl(url);
      setImage(null); // Clear file when URL is used
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    ? Array.from(new Set(parts.map((p: Part) => p.pipe_size))).sort()
    : [];

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: part
      ? {
          item_code: part.item_code,
          pipe_size: part.pipe_size,
          description: part.description,
          type: part.type,
          price_t1: part.price_t1,
          price_t2: part.price_t2,
          price_t3: part.price_t3,
          in_stock: part.in_stock || 0,
          is_popular: part.is_popular || false,
          image: part.image || undefined
        }
      : {
          item_code: "",
          pipe_size: "",
          description: "",
          type: "",
          price_t1: 0,
          price_t2: 0,
          price_t3: 0,
          in_stock: 0,
          is_popular: false,
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
      // Include the image URL in the values if it's set
      const finalValues = {
        ...values,
        image: imageUrl || values.image || undefined
      };

      if (part) {
        // Update existing part
        await updatePartMutation.mutateAsync(finalValues);
        
        // Upload image file if selected (takes precedence over URL)
        if (image) {
          setIsUploading(true);
          await uploadImageMutation.mutateAsync(part.id);
          setIsUploading(false);
        }
      } else {
        // Create new part
        const newPartResponse = await createPartMutation.mutateAsync(finalValues);
        
        // Upload image file if selected and part created successfully
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
      
      // Clear form state after successful submission
      setImage(null);
      setImageUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
            name="item_code"
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
            name="pipe_size"
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
                name="price_t1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price T1 ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price_t2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price T2 ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price_t3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price T3 ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="in_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_popular"
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
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {/* Right Column - Image Upload */}
          <div className="space-y-4">
            <Label htmlFor="part-image">Part Image</Label>
            
            {/* Image Preview */}
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
                        setImageUrl("");
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
              
              <div className="flex-1 space-y-3">
                {/* File Upload */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center w-full"
                    disabled={isUploading}
                  >
                    <FaUpload className="mr-2 h-4 w-4" />
                    {previewUrl ? "Change image" : "Upload image"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF, max 2MB
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
                
                {/* OR separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
                
                {/* Image URL Input */}
                <div>
                  <Label htmlFor="image-url" className="text-sm">Image URL</Label>
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a direct link to the image
                  </p>
                </div>
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
