import { useState } from "react";
import SupplierLayout from "@/components/supplier/layout";
import CustomersTable from "@/components/supplier/customers-table";
import BusinessForm from "@/components/supplier/business-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Business } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SupplierCustomers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddBusinessDialog, setShowAddBusinessDialog] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState<Business | null>(null);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['/api/businesses'],
  });

  // Filter businesses based on search query
  const filteredBusinesses = businesses
    ? businesses.filter(business => {
        return searchQuery
          ? business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (business.email && business.email.toLowerCase().includes(searchQuery.toLowerCase()))
          : true;
      })
    : [];

  const handleAddBusiness = () => {
    setBusinessToEdit(null);
    setShowAddBusinessDialog(true);
  };

  const handleEditBusiness = (business: Business) => {
    setBusinessToEdit(business);
    setShowAddBusinessDialog(true);
  };

  return (
    <SupplierLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Customer Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <a
              href="/supplier/parts"
              className="border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm"
            >
              Parts Management
            </a>
            <a
              href="#"
              className="border-primary-500 text-primary-600 w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm"
              aria-current="page"
            >
              Customer Management
            </a>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-800">Businesses</h3>
            <div className="flex">
              <Button
                className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center"
                onClick={handleAddBusiness}
              >
                <i className="fas fa-plus mr-2"></i>
                Add Business
              </Button>
              <Button 
                className="ml-3 border border-neutral-300 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center"
                variant="outline"
              >
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </div>

          <div className="relative flex-grow mb-4">
            <Input
              type="text"
              placeholder="Search businesses by name or email..."
              className="w-full py-2 pl-10 pr-4 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-neutral-400"></i>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <CustomersTable businesses={filteredBusinesses} onEdit={handleEditBusiness} />
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-neutral-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredBusinesses.length}</span> of{" "}
              <span className="font-medium">{filteredBusinesses.length}</span> results
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddBusinessDialog} onOpenChange={setShowAddBusinessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{businessToEdit ? "Edit Business" : "Add New Business"}</DialogTitle>
          </DialogHeader>
          <BusinessForm 
            business={businessToEdit}
            onSuccess={() => setShowAddBusinessDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </SupplierLayout>
  );
};

export default SupplierCustomers;
