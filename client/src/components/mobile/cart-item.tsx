import React from "react";
import { useState } from "react";
import { CartItem as CartItemType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItemProps {
  item: CartItemType & { part: any };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateQuantityMutation = useMutation({
    mutationFn: async (newQuantity: number) => {
      return apiRequest("PUT", `/api/cart/${item.id}`, { quantity: newQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      setQuantity(item.quantity); // Reset to original value
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/cart/${item.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    updateQuantityMutation.mutate(newQuantity);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      updateQuantityMutation.mutate(newQuantity);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const handleInputBlur = () => {
    if (quantity !== item.quantity) {
      updateQuantityMutation.mutate(quantity);
    }
  };

  return (
    <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
      <div>
        <div className="flex items-start">
          <Badge variant="outline" className="font-semibold bg-neutral-100 text-neutral-800 mr-2">
            {item.part.itemCode}
          </Badge>
          <Badge variant="secondary" className="bg-primary-100 text-primary-800">
            {item.part.pipeSize}
          </Badge>
        </div>
        <h3 className="font-medium mt-1">{item.part.description}</h3>
        <div className="flex items-center mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-l p-0"
            onClick={handleDecrement}
            disabled={quantity <= 1 || updateQuantityMutation.isPending}
          >
            <i className="fas fa-minus text-xs"></i>
          </Button>
          <Input
            type="text"
            value={quantity}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="h-6 w-10 rounded-none text-center p-0 border-x-0"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-r p-0"
            onClick={handleIncrement}
            disabled={updateQuantityMutation.isPending}
          >
            <i className="fas fa-plus text-xs"></i>
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500"
        onClick={() => removeItemMutation.mutate()}
        disabled={removeItemMutation.isPending}
      >
        <i className="fas fa-trash-alt"></i>
      </Button>
    </div>
  );
};

export default CartItem;
