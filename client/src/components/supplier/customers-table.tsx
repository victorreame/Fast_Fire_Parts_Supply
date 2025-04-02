import React from "react";
import { Business } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CustomersTableProps {
  businesses: Business[];
  onEdit: (business: Business) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ businesses, onEdit }) => {
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null);
  const [showContactsDialog, setShowContactsDialog] = React.useState(false);

  const getPriceTierBadge = (tier: string) => {
    switch (tier) {
      case "T1":
        return <Badge className="bg-emerald-100 text-emerald-800">Tier 1</Badge>;
      case "T2":
        return <Badge className="bg-blue-100 text-blue-800">Tier 2</Badge>;
      case "T3":
        return <Badge className="bg-purple-100 text-purple-800">Tier 3</Badge>;
      default:
        return <Badge>{tier}</Badge>;
    }
  };

  const handleViewContacts = (business: Business) => {
    setSelectedBusiness(business);
    setShowContactsDialog(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Business Name
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Address
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Phone
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Price Tier
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-neutral-200">
            {businesses.map((business) => (
              <TableRow key={business.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  {business.name}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {business.address || "-"}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {business.phone || "-"}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {business.email || "-"}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                  {getPriceTierBadge(business.priceTier || "T3")}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary-900 mr-3"
                    onClick={() => handleViewContacts(business)}
                  >
                    Contacts
                  </Button>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary-900"
                    onClick={() => onEdit(business)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contacts for {selectedBusiness?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="text-center text-sm text-gray-500">
              Contact management feature will be implemented in the next update.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomersTable;
