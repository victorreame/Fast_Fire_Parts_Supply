import React, { useState } from "react";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";

interface PartCardProps {
  part: Part;
  jobId?: number;
}

const PartCard: React.FC<PartCardProps> = ({ part, jobId }) => {
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      setIsDialogOpen(false);
      setQuantity(1); // Reset quantity to 1 after adding to cart
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

  const handleAddWithQuantity = () => {
    // Add with selected quantity
    addToCartMutation.mutate(quantity);
  };

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
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
        <div className="flex items-center">
          <Button
            variant="secondary"
            size="sm"
            className="px-3 py-2 text-white"
            onClick={() => setIsDialogOpen(true)}
          >
            <FaShoppingCart className="mr-1" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="add-to-cart-description">
          <DialogTitle>Add to Cart</DialogTitle>
          <p id="add-to-cart-description" className="sr-only">Select quantity and add items to your cart</p>
          <div className="py-4">
            <h3 className="font-medium mb-3">{part.description}</h3>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div>
                <p className="text-sm font-medium">Item Code: {part.itemCode}</p>
                <p className="text-sm text-neutral-500">Type: {part.type}</p>
              </div>
              <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                {part.pipeSize}
              </Badge>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Quantity:</label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                >
                  <FaMinus className="h-3 w-3" />
                </Button>
                <Input
                  type="text"
                  value={quantity}
                  onChange={handleInputChange}
                  className="h-10 w-20 rounded-none text-center border-x-0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={handleIncrement}
                >
                  <FaPlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleAddWithQuantity}
              disabled={addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick add button (hidden) */}
      <Button 
        className="hidden" 
        onClick={handleQuickAdd}
        disabled={addToCartMutation.isPending}
      >
        Quick Add
      </Button>
    </div>
  );
};

export default PartCard;
