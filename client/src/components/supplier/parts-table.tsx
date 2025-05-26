
import React, { useState } from "react";
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const toggleRowExpansion = (partId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(partId)) {
      newExpandedRows.delete(partId);
    } else {
      newExpandedRows.add(partId);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block">
        <div className="w-full">
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <Table className="w-full">
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20 resize-x">
                    Image
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-32 resize-x">
                    Item Code
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-24 resize-x">
                    Pipe Size
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-0 flex-1 resize-x">
                    Description
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-24 resize-x">
                    Type
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20 resize-x">
                    Price T1
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20 resize-x">
                    Price T2
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20 resize-x">
                    Price T3
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16 resize-x">
                    Stock
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-neutral-200">
                {parts.map((part) => {
                  const isExpanded = expandedRows.has(part.id);
                  const shouldTruncate = part.description && part.description.length > 50;
                  
                  return (
                    <TableRow 
                      key={part.id} 
                      className="hover:bg-neutral-50 h-16 cursor-pointer"
                      onClick={() => onEdit(part)}
                    >
                      <TableCell className="px-3 py-2 align-middle">
                        <div className="w-12 h-12 flex items-center justify-center rounded border bg-neutral-50 flex-shrink-0">
                          {part.image ? (
                            <img 
                              src={part.image} 
                              alt={part.description}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                              }}
                            />
                          ) : (
                            <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          )}
                          {part.image && (
                            <svg className="w-6 h-6 text-neutral-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm font-medium text-neutral-900 align-middle">
                        <div className="break-words">
                          {part.item_code}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="break-words">
                          {part.pipe_size}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="break-words leading-tight">
                          {shouldTruncate && !isExpanded ? (
                            <>
                              {part.description.substring(0, 50)}...
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(part.id);
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                Show more
                              </button>
                            </>
                          ) : (
                            <>
                              {part.description}
                              {shouldTruncate && isExpanded && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpansion(part.id);
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                  Show less
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="break-words">
                          {part.type}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="text-right">
                          ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="text-right">
                          ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="text-right">
                          ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-neutral-500 align-middle">
                        <div className="text-center">
                          {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0}
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {parts.map((part) => (
          <div key={part.id} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 flex items-center justify-center rounded border bg-neutral-50 flex-shrink-0">
                  {part.image ? (
                    <img 
                      src={part.image} 
                      alt={part.description}
                      className="w-full h-full object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                      }}
                    />
                  ) : (
                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                  )}
                  {part.image && (
                    <svg className="w-6 h-6 text-neutral-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 text-sm">{part.item_code}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{part.pipe_size} • {part.type}</p>
                </div>
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
