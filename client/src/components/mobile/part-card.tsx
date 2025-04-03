import React, { useState } from "react";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { FaCartPlus, FaPlus } from "react-icons/fa";
import QuantityPanel from "./quantity-panel";

interface PartCardProps {
  part: Part;
  jobId?: number;
}

const PartCard: React.FC<PartCardProps> = ({ part, jobId }) => {
  const [showQuantityPanel, setShowQuantityPanel] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCartMutation = useMutation({
    mutationFn: async (qty: number) => {
      return apiRequest("POST", "/api/cart", {
        partId: part.id,
        jobId: jobId || null,
        quantity: qty,
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

  const handleQuickAdd = () => {
    // Quick add with quantity = 1
    addToCartMutation.mutate(1);
  };

  const handleAddWithQuantity = (quantity: number) => {
    addToCartMutation.mutate(quantity);
  };

  return (
    <div className="p-4 border-b border-neutral-200">
      <div className="flex justify-between">
        <div className="w-3/4">
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
        <div className="flex flex-col items-end justify-start">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 py-1 h-auto text-secondary hover:text-secondary-700 hover:bg-secondary-50"
              onClick={handleQuickAdd}
              disabled={addToCartMutation.isPending}
              title="Quick Add (Qty: 1)"
            >
              <FaCartPlus className="text-lg" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="px-2 py-1 h-auto text-primary border-primary hover:bg-primary-50"
              onClick={() => setShowQuantityPanel(true)}
              disabled={addToCartMutation.isPending}
            >
              <FaPlus className="mr-1 text-xs" />
              <span className="text-xs">Add</span>
            </Button>
            
            <QuantityPanel
              isOpen={showQuantityPanel}
              onClose={() => setShowQuantityPanel(false)}
              onSubmit={handleAddWithQuantity}
              initialQuantity={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartCard;
