import React from "react";
import { Part } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PartsTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
}

const PartsTable: React.FC<PartsTableProps> = ({ parts, onEdit }) => {

  return (
    <>
      {/* All Screen Sizes - Responsive Table with All Columns Visible */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-12">
                    Image
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Item Code
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    Pipe Size
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider flex-1 min-w-0">
                    Description
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">
                    Type
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    Price T1
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    Price T2
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    Price T3
                  </TableHead>
                  <TableHead className="px-1 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-12">
                    Stock
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-neutral-200">
                {parts.map((part) => (
                  <TableRow 
                    key={part.id} 
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => onEdit(part)}
                  >
                    <TableCell className="px-1 py-2 w-12">
                      <div className="w-8 h-8 flex items-center justify-center rounded border bg-neutral-50">
                        {part.image ? (
                          <img 
                            src={part.image} 
                            alt={part.description}
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <i className="fas fa-cube text-neutral-400 text-xs"></i>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs font-medium text-neutral-900 w-20">
                      <div className="truncate" title={part.item_code}>
                        {part.item_code}
                      </div>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 w-16">
                      {part.pipe_size}
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 flex-1 min-w-0">
                      <div className="truncate" title={part.description}>
                        {part.description}
                      </div>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 w-24">
                      <div className="truncate" title={part.type}>
                        {part.type}
                      </div>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 w-16">
                      ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 w-16">
                      ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 w-16">
                      ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-1 py-2 text-xs text-neutral-500 w-12">
                      {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>



      {/* Mobile Enhanced Card View - All Data Accessible */}
      <div className="md:hidden space-y-4">
        {parts.map((part) => (
          <div 
            key={part.id} 
            className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-neutral-50"
            onClick={() => onEdit(part)}
          >
            <div className="flex items-start mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-12 h-12 flex items-center justify-center rounded border bg-neutral-50 flex-shrink-0">
                  {part.image ? (
                    <img 
                      src={part.image} 
                      alt={part.description}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <i className="fas fa-cube text-neutral-400 text-lg"></i>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 text-sm">{part.item_code}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{part.pipe_size} • {part.type}</p>
                </div>
              </div>
              <div className="text-xs text-neutral-400 flex items-center">
                <i className="fas fa-edit"></i>
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


    </>
  );
};

export default PartsTable;