import React from "react";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface PartCardProps {
  part: Part;
  jobId?: number;
}

const PartCard: React.FC<PartCardProps> = ({ part, jobId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", {
        partId: part.id,
        jobId: jobId || null,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Added to cart",
        description: `${part.description} has been added to your cart.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-4 border-b border-neutral-200">
      <div className="flex justify-between">
        <div>
          <div className="flex items-start">
            <Badge variant="outline" className="font-semibold bg-neutral-100 text-neutral-800 mr-2">
              {part.itemCode}
            </Badge>
            <Badge variant="secondary" className="bg-primary-100 text-primary-800">
              {part.pipeSize}
            </Badge>
          </div>
          <h3 className="font-medium mt-1">{part.description}</h3>
          <p className="text-sm text-neutral-500 mt-1">Type: {part.type}</p>
        </div>
        <div className="flex flex-col items-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-secondary-700"
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
          >
            <i className="fas fa-plus-circle text-xl"></i>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartCard;
