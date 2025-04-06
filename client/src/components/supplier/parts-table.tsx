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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Item Code
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Pipe Size
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Description
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Price T1
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Price T2
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Price T3
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Stock
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-neutral-200">
            {parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  {part.item_code}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {part.pipe_size}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {part.description}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {part.type}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button 
                    variant="link" 
                    className="text-primary hover:text-primary-900 mr-3"
                    onClick={() => onEdit(part)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDelete(part.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
