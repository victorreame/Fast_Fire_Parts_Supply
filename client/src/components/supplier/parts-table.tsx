
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface PartsTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
}

const PartsTable: React.FC<PartsTableProps> = ({ parts, onEdit }) => {

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <div className="w-full">
            <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
              {/* Image Column */}
              <ResizablePanel defaultSize={8} minSize={6} maxSize={12}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Image
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`img-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
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
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Item Code Column */}
              <ResizablePanel defaultSize={12} minSize={8} maxSize={20}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Item Code
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`code-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm font-medium text-neutral-900">
                          {part.item_code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Pipe Size Column */}
              <ResizablePanel defaultSize={10} minSize={6} maxSize={15}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Pipe Size
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`size-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm text-neutral-500">
                          {part.pipe_size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Description Column */}
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Description
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`desc-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <div className="text-sm text-neutral-500 leading-relaxed whitespace-normal break-words">
                          {part.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Type Column */}
              <ResizablePanel defaultSize={10} minSize={6} maxSize={15}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`type-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm text-neutral-500">
                          {part.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Price T1 Column */}
              <ResizablePanel defaultSize={8} minSize={6} maxSize={12}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Price T1
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`t1-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm text-neutral-500">
                          ${part.price_t1 !== undefined && part.price_t1 !== null ? part.price_t1.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Price T2 Column */}
              <ResizablePanel defaultSize={8} minSize={6} maxSize={12}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Price T2
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`t2-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm text-neutral-500">
                          ${part.price_t2 !== undefined && part.price_t2 !== null ? part.price_t2.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Price T3 Column */}
              <ResizablePanel defaultSize={8} minSize={6} maxSize={12}>
                <div className="h-full border-r border-neutral-200">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Price T3
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`t3-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm text-neutral-500">
                          ${part.price_t3 !== undefined && part.price_t3 !== null ? part.price_t3.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Stock Column */}
              <ResizablePanel defaultSize={6} minSize={5} maxSize={10}>
                <div className="h-full">
                  <div className="bg-neutral-50 px-3 py-3 border-b border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Stock
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {parts.map((part) => (
                      <div 
                        key={`stock-${part.id}`}
                        className="px-3 py-4 hover:bg-neutral-50 cursor-pointer flex items-center min-h-[72px]"
                        onClick={() => onEdit(part)}
                      >
                        <span className="text-sm text-neutral-500">
                          {part.in_stock !== undefined && part.in_stock !== null ? part.in_stock : 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
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
