import React from "react";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PartsTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
}

const PartsTable: React.FC<PartsTableProps> = ({ parts, onEdit }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletePartId, setDeletePartId] = React.useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const deletePartMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/parts/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      toast({
        title: "Part deleted",
        description: "The part has been successfully deleted.",
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete part. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    setDeletePartId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletePartId !== null) {
      deletePartMutation.mutate(deletePartId);
    }
  };

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[120px]">
                  Item Code
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[100px]">
                  Pipe Size
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[200px]">
                  Description
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[100px]">
                  Type
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[90px]">
                  Price T1
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[90px]">
                  Price T2
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[90px]">
                  Price T3
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[80px]">
                  Stock
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-neutral-200">
              {parts.map((part) => (
                <TableRow key={part.id} className="hover:bg-neutral-50">
                  <TableCell className="px-4 py-4 text-sm font-medium text-neutral-900">
                    {part.item_code}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    {part.pipe_size}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    <div className="max-w-[200px] truncate" title={part.description}>
                      {part.description}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    {part.type}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-neutral-500">
                    {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-primary hover:text-primary-900"
                        onClick={() => onEdit(part)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(part.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {parts.map((part) => (
          <div key={part.id} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-neutral-900 text-sm">{part.item_code}</h3>
                <p className="text-xs text-neutral-500 mt-1">{part.pipe_size} • {part.type}</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-primary hover:text-primary-900 text-xs px-2 py-1"
                  onClick={() => onEdit(part)}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                  onClick={() => handleDelete(part.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-neutral-700 leading-relaxed">{part.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-neutral-600">Pricing:</span>
                <div className="mt-1 space-y-1">
                  <div>T1: ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}</div>
                  <div>T2: ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}</div>
                  <div>T3: ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}</div>
                </div>
              </div>
              <div>
                <span className="font-medium text-neutral-600">Stock:</span>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    (part.in_stock || 0) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0} units
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Part</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this part? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletePartMutation.isPending}>
              {deletePartMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PartsTable;
