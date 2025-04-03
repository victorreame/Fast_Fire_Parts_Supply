import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaMinus, FaPlus, FaCheck } from "react-icons/fa";

interface QuantityPanelProps {
  initialQuantity?: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantity: number) => void;
}

const QuantityPanel: React.FC<QuantityPanelProps> = ({
  initialQuantity = 1,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Reset quantity when opening
  useEffect(() => {
    if (isOpen && !visible) {
      setQuantity(initialQuantity);
      setVisible(true);
      setAnimating(true);
      // Adding a slight delay to ensure DOM has updated before starting animation
      setTimeout(() => {
        setAnimating(false);
      }, 50);
    } else if (!isOpen && visible) {
      setAnimating(true);
      // Wait for animation to finish before hiding
      setTimeout(() => {
        setVisible(false);
        setAnimating(false);
      }, 300);
    }
  }, [isOpen, initialQuantity]);

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

  const handleSubmit = () => {
    onSubmit(quantity);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        style={{ opacity: animating ? 0 : 1 }}
        onClick={onClose}
      />
      <div 
        className="relative bg-white w-full max-w-md rounded-t-xl p-5 transition-transform duration-300 ease-out"
        style={{ transform: animating ? 'translateY(100%)' : 'translateY(0)' }}
      >
        <h3 className="text-lg font-medium text-center mb-4">Set quantity</h3>
        
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center space-x-4 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleDecrement}
              disabled={quantity <= 1}
            >
              <FaMinus className="h-4 w-4" />
            </Button>
            
            <Input
              type="text"
              value={quantity}
              onChange={handleInputChange}
              className="h-12 w-24 text-center text-xl"
              min={1}
              inputMode="numeric"
            />
            
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleIncrement}
            >
              <FaPlus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex w-full max-w-xs mt-6 gap-4">
            <Button 
              className="flex-1 bg-primary hover:bg-primary-600 py-3 text-base font-medium"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            <Button 
              className="flex-1 bg-secondary hover:bg-secondary-600 py-3 text-base font-medium"
              onClick={handleSubmit}
            >
              <FaCheck className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantityPanel;