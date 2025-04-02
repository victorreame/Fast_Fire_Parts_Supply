import { useState } from "react";
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

  const { data: parts } = useQuery({
    queryKey: ['/api/parts'],
  });

  // Extract unique types for dropdown
  const partTypes = parts
    ? Array.from(new Set(parts.map((p: Part) => p.type))).sort()
    : [];

  // Extract unique pipe sizes for dropdown
  const pipeSizes = parts
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
          inStock: part.inStock,
          isPopular: part.isPopular,
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

  const onSubmit = (values: PartFormValues) => {
    if (part) {
      updatePartMutation.mutate(values);
    } else {
      createPartMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <div className="grid grid-cols-2 gap-4">
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
        </div>

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

        <div className="grid grid-cols-3 gap-4">
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Popular Item</FormLabel>
                <FormDescription>
                  Mark this item as popular to show in Top 50 list
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

        <Button
          type="submit"
          className="w-full"
          disabled={createPartMutation.isPending || updatePartMutation.isPending}
        >
          {createPartMutation.isPending || updatePartMutation.isPending
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
