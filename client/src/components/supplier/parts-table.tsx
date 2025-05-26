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
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Image
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-32">
                    Item Code
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">
                    Pipe Size
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[200px]">
                    Description
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">
                    Type
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Price T1
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Price T2
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Price T3
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
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
                    <TableCell className="px-3 py-4 w-20">
                      <div className="w-12 h-12 flex items-center justify-center rounded border bg-neutral-50">
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
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm font-medium text-neutral-900 w-32">
                      {part.item_code}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 w-24">
                      {part.pipe_size}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 min-w-[200px]">
                      <div className="max-w-[200px] truncate" title={part.description}>
                        {part.description}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 w-24">
                      {part.type}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 w-20">
                      ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 w-20">
                      ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 w-20">
                      ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-neutral-500 w-16">
                      {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Tablet Horizontal Scroll View */}
      <div className="hidden md:block lg:hidden">
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    Image
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">
                    Code
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Size
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[150px]">
                    Description
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                    Type
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    T1
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    T2
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                    T3
                  </TableHead>
                  <TableHead className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
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
                    <TableCell className="px-2 py-3 w-16">
                      <div className="w-10 h-10 flex items-center justify-center rounded border bg-neutral-50">
                        {part.image ? (
                          <img 
                            src={part.image} 
                            alt={part.description}
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <i className="fas fa-cube text-neutral-400 text-sm"></i>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs font-medium text-neutral-900 w-24">
                      {part.item_code}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 w-20">
                      {part.pipe_size}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 min-w-[150px]">
                      <div className="max-w-[150px] truncate" title={part.description}>
                        {part.description}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 w-20">
                      {part.type}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 w-16">
                      ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 w-16">
                      ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 w-16">
                      ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="px-2 py-3 text-xs text-neutral-500 w-16">
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