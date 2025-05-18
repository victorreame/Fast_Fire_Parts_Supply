import React, { useState, useEffect } from "react";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FaMinus, FaPlus, FaStar } from "react-icons/fa";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PartCardProps {
  part: Part;
  jobId?: number;
  showWarningBanner?: boolean;
}

const PartCard: React.FC<PartCardProps> = ({ part, jobId, showWarningBanner = true }) => {
  const [quantity, setQuantity] = useState(0);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user is an unapproved tradie or contractor - explicitly check for false to be safe
  const isUnapprovedTradie = (user?.role === 'tradie' || user?.role === 'contractor') && user?.isApproved !== true;
  
  // Check if part is in favorites
  const { data: favorites } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });
  
  // Set initial favorite state
  useEffect(() => {
    if (favorites && Array.isArray(favorites)) {
      setIsFavorite(favorites.some((fav: any) => fav.partId === part.id));
    }
  }, [favorites, part.id]);
  
  console.log(`Part card render - User approval status: ${user?.isApproved === true ? 'APPROVED' : 'NOT APPROVED'}`);
  console.log(`Raw isApproved value from DB: ${user?.isApproved}`);
  
  // COMPLETELY BLOCK CART ACTIONS for unapproved tradies
  if (isUnapprovedTradie) {
    // No-op function to completely disable cart actions
    const noOp = () => {
      toast({
        title: "Access Restricted",
        description: "Your account must be approved by a Project Manager before using cart functionality.",
        variant: "destructive"
      });
      return false;
    };
  }

  // Get cart items to check if this part is already in cart - don't fetch for unapproved tradies
  const { data: cartItems } = useQuery({ 
    queryKey: ['/api/cart'],
    enabled: !isUnapprovedTradie
  });

  // Find this part in the cart (if it exists)
  useEffect(() => {
    if (cartItems && Array.isArray(cartItems)) {
      const cartItem = cartItems.find((item: any) => item.partId === part.id);
      if (cartItem) {
        setQuantity(cartItem.quantity);
        setCartItemId(cartItem.id);
      } else {
        setQuantity(0);
        setCartItemId(null);
      }
    }
  }, [cartItems, part.id]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (newQuantity: number) => {
      // Block cart operations for unapproved tradies at the client level
      if (isUnapprovedTradie) {
        throw new Error("Account pending approval. You cannot add items to cart until approved.");
      }
      
      const response = await apiRequest("POST", "/api/cart", {
        partId: part.id,
        jobId: jobId || null,
        quantity: newQuantity,
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      if (data && data.id) {
        setCartItemId(data.id);
      }
      toast({
        title: "Added to cart",
        description: `${part.description} has been added to your cart.`,
      });
    },
    onError: () => {
      // Reset to previous quantity on error
      if (cartItems && Array.isArray(cartItems)) {
        const prevItem = cartItems.find((item: any) => item.partId === part.id);
        setQuantity(prevItem ? prevItem.quantity : 0);
      } else {
        setQuantity(0);
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update cart item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async (params: { id: number, newQuantity: number }) => {
      return apiRequest("PUT", `/api/cart/${params.id}`, { 
        quantity: params.newQuantity 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      // Reset to previous quantity on error
      if (cartItems && Array.isArray(cartItems)) {
        const prevItem = cartItems.find((item: any) => item.partId === part.id);
        setQuantity(prevItem ? prevItem.quantity : 0);
      } else {
        setQuantity(0);
      }
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cart/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      setCartItemId(null);
      setQuantity(0);
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

    if (cartItemId) {
      // Update existing cart item
      updateQuantityMutation.mutate({ id: cartItemId, newQuantity });
    } else {
      // Add new cart item
      addToCartMutation.mutate(newQuantity);
    }
  };

  const handleDecrement = () => {
    if (quantity <= 0) return;

    const newQuantity = quantity - 1;
    setQuantity(newQuantity);

    if (cartItemId) {
      if (newQuantity === 0) {
        // Remove item if quantity becomes zero
        removeItemMutation.mutate(cartItemId);
      } else {
        // Update quantity
        updateQuantityMutation.mutate({ id: cartItemId, newQuantity });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);

    // Ensure value is not NaN and is at least 0
    if (isNaN(newValue)) {
      newValue = 0;
    }

    // Ensure quantity is never negative
    newValue = Math.max(0, newValue);

    setQuantity(newValue);
  };

  const handleInputBlur = () => {
    if (cartItemId && quantity === 0) {
      // Remove item if quantity is zero
      removeItemMutation.mutate(cartItemId);
    } else if (cartItemId && quantity > 0) {
      // Update existing quantity
      updateQuantityMutation.mutate({ id: cartItemId, newQuantity: quantity });
    } else if (!cartItemId && quantity > 0) {
      // Add new item
      addToCartMutation.mutate(quantity);
    }
  };

  const isPending = addToCartMutation.isPending || 
                   updateQuantityMutation.isPending || 
                   removeItemMutation.isPending;

  return (
    <div className="p-4 border-b border-neutral-200">
      {isUnapprovedTradie && (
        <div className="mb-3 p-3 bg-red-100 border-2 border-red-500 text-red-800 rounded-md flex items-center text-sm">
          <ShieldAlert className="h-6 w-6 text-red-600 mr-2 flex-shrink-0" />
          <div>
            <span className="font-bold block">CART ACCESS BLOCKED</span>
            <span>Your account must be approved by a Project Manager before using cart functionality. Contact your PM for immediate approval.</span>
          </div>
        </div>
      )}
      <div className="flex justify-between">
        <div className="w-3/4 flex">
          <div className="mr-3 flex-shrink-0">
            <img 
              src={part.image || `/assets/parts/${part.item_code}.svg`}
              alt={part.description}
              className="h-16 w-16 object-contain bg-gray-50 rounded"
              onError={(e) => {
                console.log(`Image failed to load: ${part.image || `/assets/parts/${part.item_code}.svg`}`);
                // First try the default SVG by item code
                if (part.image) {
                  // If we're already trying the specific image, fall back to the SVG
                  (e.target as HTMLImageElement).src = `/assets/parts/${part.item_code}.svg`;
                  // Add a second error handler to catch if the SVG also fails
                  (e.target as HTMLImageElement).onerror = () => {
                    console.log(`SVG also failed: /assets/parts/${part.item_code}.svg`);
                    (e.target as HTMLImageElement).src = '/assets/placeholder-part.svg';
                    (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                  };
                } else {
                  // If we're already trying the SVG, fall back to placeholder
                  (e.target as HTMLImageElement).src = '/assets/placeholder-part.svg';
                  (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-start">
              <Badge variant="outline" className="font-semibold bg-neutral-100 text-neutral-800 mr-2">
                {part.item_code}
              </Badge>
              <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                {part.pipe_size}
              </Badge>
            </div>
            <h3 className="font-medium mt-1">{part.description}</h3>
            <p className="text-sm text-neutral-500 mt-1">Type: {part.type}</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className={`flex items-center relative ${isPending ? 'opacity-70' : ''}`}>
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-30 z-10 rounded-md">
                <div className="h-4 w-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <Button
              variant={quantity > 0 ? "secondary" : "outline"}
              size="icon"
              className={`h-8 w-8 rounded-r-none border-r-0 ${quantity > 0 ? "text-white" : ""}`}
              onClick={handleDecrement}
              disabled={isPending || quantity <= 0 || isUnapprovedTradie}
              title={isUnapprovedTradie ? "Account pending approval" : ""}
            >
              <FaMinus className="h-3 w-3" />
            </Button>

            <Input
              type="text"
              value={quantity}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`h-8 w-12 rounded-none text-center border-x-0 p-0 transition-colors ${
                quantity > 0 ? "bg-secondary-50 font-medium border-secondary" : ""
              }`}
              min={0}
              disabled={isUnapprovedTradie}
              title={isUnapprovedTradie ? "Account pending approval" : ""}
            />

            <Button
              variant={quantity > 0 ? "secondary" : "outline"}
              size="icon"
              className={`h-8 w-8 rounded-l-none border-l-0 ${quantity > 0 ? "text-white" : ""}`}
              onClick={handleIncrement}
              disabled={isPending || isUnapprovedTradie}
              title={isUnapprovedTradie ? "Account pending approval" : ""}
            >
              <FaPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartCard;