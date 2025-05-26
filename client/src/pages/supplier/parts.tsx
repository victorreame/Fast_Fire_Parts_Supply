import { useState } from "react";
import SupplierLayout from "@/components/supplier/layout";
import PartsTable from "@/components/supplier/parts-table";
import PartForm from "@/components/supplier/part-form";
import ImportPartsModal from "@/components/supplier/import-parts-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Part } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SupplierParts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [partToEdit, setPartToEdit] = useState<Part | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: ['/api/parts'],
  });

  // Extract unique types and pipe sizes for filters
  const partTypes = parts && Array.isArray(parts)
    ? Array.from(new Set(parts.map((part: Part) => part.type))).sort() 
    : [];

  const pipeSizes = parts && Array.isArray(parts)
    ? Array.from(new Set(parts.map((part: Part) => part.pipe_size))).sort()
    : [];

  // Filter parts based on search, type, and size
  const filteredParts = parts && Array.isArray(parts)
    ? parts.filter((part: Part) => {
        const matchesSearch = searchQuery
          ? (part.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             part.item_code?.toLowerCase().includes(searchQuery.toLowerCase()))
          : true;
        
        const matchesType = typeFilter !== "all" 
          ? part.type === typeFilter
          : true;
        
        const matchesSize = sizeFilter !== "all"
          ? part.pipe_size === sizeFilter
          : true;
        
        return matchesSearch && matchesType && matchesSize;
      })
    : [];

  // Calculate pagination
  const totalItems = filteredParts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParts = filteredParts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleAddPart = () => {
    setPartToEdit(null);
    setShowAddPartDialog(true);
  };

  const handleEditPart = (part: Part) => {
    setPartToEdit(part);
    setShowAddPartDialog(true);
  };

  return (
    <SupplierLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Parts Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200 p-4">
          <h3 className="text-lg font-medium text-neutral-800">Parts Inventory</h3>
        </div>

        <div className="p-6">
          {/* Action Buttons - Responsive Layout */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                className="bg-primary hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                onClick={handleAddPart}
              >
                <i className="fas fa-plus mr-2"></i>
                Add Part
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                onClick={() => setShowImportDialog(true)}
              >
                <i className="fas fa-file-import mr-2"></i>
                Import Parts
              </Button>
              <Button 
                className="border border-neutral-300 bg-white hover:bg-neutral-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                variant="outline"
              >
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </div>

          {/* Search and Filters - Responsive Layout */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search parts..."
                className="w-full py-2 pl-10 pr-4 rounded-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPagination();
                }}
              />
              <i className="fas fa-search absolute left-3 top-2.5 text-neutral-400"></i>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                resetPagination();
              }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {partTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sizeFilter} onValueChange={(value) => {
                setSizeFilter(value);
                resetPagination();
              }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {pipeSizes.map((size: string) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <PartsTable parts={paginatedParts} onEdit={handleEditPart} />
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-sm text-neutral-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </div>
            
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  resetPagination();
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-neutral-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddPartDialog} onOpenChange={setShowAddPartDialog}>
        <DialogContent className="sm:max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>{partToEdit ? "Edit Part" : "Add New Part"}</DialogTitle>
          </DialogHeader>
          <PartForm 
            part={partToEdit}
            onSuccess={() => setShowAddPartDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Import Parts Modal */}
      <ImportPartsModal 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog} 
      />
    </SupplierLayout>
  );
};

export default SupplierParts;
