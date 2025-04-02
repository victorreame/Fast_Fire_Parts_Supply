import React, { useState } from "react";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { FaCartPlus, FaMinus, FaPlus, FaCheck } from "react-icons/fa";

interface PartCardProps {
  part: Part;
  jobId?: number;
}

const PartCard: React.FC<PartCardProps> = ({ part, jobId }) => {
  const [quantity, setQuantity] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
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
      setSheetOpen(false);
      // Reset quantity to 1 after adding to cart for next time
      setQuantity(1);
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

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-1 h-auto text-primary border-primary hover:bg-primary-50"
                >
                  <FaPlus className="mr-1 text-xs" />
                  <span className="text-xs">Add</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto pb-8 pt-6">
                <SheetTitle className="mb-4 text-center">Set quantity</SheetTitle>
                <SheetDescription className="sr-only">
                  Adjust the quantity and add to cart.
                </SheetDescription>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center space-x-3 justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                    >
                      <FaMinus className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      type="text"
                      value={quantity}
                      onChange={handleInputChange}
                      className="h-10 w-20 text-center text-lg"
                      min={1}
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={handleIncrement}
                    >
                      <FaPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex w-full max-w-xs mt-6 gap-3">
                    <SheetClose asChild>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary-600 py-3 text-base"
                      >
                        OK
                      </Button>
                    </SheetClose>
                    
                    <Button 
                      className="flex-1 bg-secondary hover:bg-secondary-600 py-3 text-base"
                      onClick={handleAddWithQuantity}
                      disabled={addToCartMutation.isPending}
                    >
                      {addToCartMutation.isPending ? (
                        "Adding..."
                      ) : (
                        <>
                          <FaCheck className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartCard;
