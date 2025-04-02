import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Business, insertBusinessSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

interface BusinessFormProps {
  business?: Business | null;
  onSuccess?: () => void;
}

// Extend the insertBusinessSchema with validation
const businessFormSchema = insertBusinessSchema.extend({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  priceTier: z.enum(["T1", "T2", "T3"]),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

const BusinessForm: React.FC<BusinessFormProps> = ({ business, onSuccess }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: business
      ? {
          name: business.name,
          address: business.address || "",
          phone: business.phone || "",
          email: business.email || "",
          priceTier: business.priceTier as "T1" | "T2" | "T3" || "T3",
        }
      : {
          name: "",
          address: "",
          phone: "",
          email: "",
          priceTier: "T3",
        },
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (values: BusinessFormValues) => {
      return apiRequest("POST", "/api/businesses", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });
      toast({
        title: "Success",
        description: "Business has been successfully created.",
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create business. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (values: BusinessFormValues) => {
      if (!business) return;
      return apiRequest("PUT", `/api/businesses/${business.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses'] });
      toast({
        title: "Success",
        description: "Business has been successfully updated.",
      });
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BusinessFormValues) => {
    if (business) {
      updateBusinessMutation.mutate(values);
    } else {
      createBusinessMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter business address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="priceTier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price Tier</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price tier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="T1">Tier 1 (Highest Prices)</SelectItem>
                  <SelectItem value="T2">Tier 2 (Medium Prices)</SelectItem>
                  <SelectItem value="T3">Tier 3 (Lowest Prices)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createBusinessMutation.isPending || updateBusinessMutation.isPending}
        >
          {createBusinessMutation.isPending || updateBusinessMutation.isPending
            ? "Saving..."
            : business
            ? "Update Business"
            : "Add Business"}
        </Button>
      </form>
    </Form>
  );
};

export default BusinessForm;
