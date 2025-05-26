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

  const { data: parts, isLoading } = useQuery({
    queryKey: ['/api/parts'],
  });

  // Extract unique types and pipe sizes for filters
  const partTypes = parts 
    ? Array.from(new Set(parts.map(part => part.type))).sort() 
    : [];

  const pipeSizes = parts
    ? Array.from(new Set(parts.map(part => part.pipeSize))).sort()
    : [];

  // Filter parts based on search, type, and size
  const filteredParts = parts
    ? parts.filter(part => {
        const matchesSearch = searchQuery
          ? part.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        const matchesType = typeFilter !== "all" 
          ? part.type === typeFilter
          : true;
        
        const matchesSize = sizeFilter !== "all"
          ? part.pipeSize === sizeFilter
          : true;
        
        return matchesSearch && matchesType && matchesSize;
      })
    : [];

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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-2.5 text-neutral-400"></i>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {partTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {pipeSizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <PartsTable parts={filteredParts} onEdit={handleEditPart} />
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-neutral-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredParts.length}</span> of{" "}
              <span className="font-medium">{filteredParts.length}</span> results
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
