import { useState, useRef } from "react";
import { read, utils, write } from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Part, insertPartSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FaFileExcel, FaDownload, FaUpload, FaCheck, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import { z } from "zod";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ImportPartsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportMapping {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: ValidationError[];
  duplicates: number;
}

// Enhanced part validation schema with more detailed validation messages
const importPartSchema = z.object({
  item_code: z.string().min(3, "Item code must be at least 3 characters").max(50, "Item code too long"),
  pipe_size: z.string().min(1, "Pipe size is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  type: z.string().min(1, "Type is required"),
  price_t1: z.number().min(0.01, "Price T1 must be greater than 0"),
  price_t2: z.number().min(0.01, "Price T2 must be greater than 0"),
  price_t3: z.number().min(0.01, "Price T3 must be greater than 0"),
  in_stock: z.number().min(0, "Stock cannot be negative").default(0),
  is_popular: z.boolean().default(false),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier_code: z.string().optional(),
  cost_price: z.number().min(0, "Cost price cannot be negative").optional(),
  min_stock: z.number().min(0, "Min stock cannot be negative").default(0),
});

const ImportPartsModal: React.FC<ImportPartsModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headerRow, setHeaderRow] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("upload"); // upload, mapping, validation, import
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedTab, setSelectedTab] = useState("upload");
  const [updateExisting, setUpdateExisting] = useState(false);

  // Standard field mapping options
  const targetFields = [
    { value: "item_code", label: "Item Code" },
    { value: "pipe_size", label: "Pipe Size" },
    { value: "description", label: "Description" },
    { value: "type", label: "Type" },
    { value: "category", label: "Category" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "supplier_code", label: "Supplier Code" },
    { value: "price_t1", label: "Price T1" },
    { value: "price_t2", label: "Price T2" },
    { value: "price_t3", label: "Price T3" },
    { value: "cost_price", label: "Cost Price" },
    { value: "in_stock", label: "In Stock" },
    { value: "min_stock", label: "Min Stock" },
    { value: "is_popular", label: "Is Popular" },
  ];

  // Reset the import state
  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setHeaderRow([]);
    setMapping({});
    setProgress(0);
    setCurrentStep("upload");
    setSelectedTab("upload");
    setImportResult(null);
    setIsValidating(false);
    setIsImporting(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // alternative CSV MIME type
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should not exceed 10MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // Parse the file and extract headers and sample data
  const parseFile = async (file: File) => {
    try {
      // Read file as array buffer
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to JSON
      const data = utils.sheet_to_json(worksheet, { header: 1 });
      
      // Extract headers and preview data
      if (data.length > 0) {
        const headers = data[0] as string[];
        
        // Create initial mapping (auto-map fields with similar names)
        const initialMapping: ImportMapping = {};
        headers.forEach((header) => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
          
          // Try to find a matching target field
          const matchingField = targetFields.find(field => 
            field.value === normalizedHeader || 
            field.value.replace(/_/g, '') === normalizedHeader.replace(/_/g, '') ||
            field.label.toLowerCase().replace(/[^a-z0-9]/g, '') === header.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          
          if (matchingField) {
            initialMapping[header] = matchingField.value;
          }
        });
        
        // Get preview data (up to 5 rows)
        const preview = data.slice(1, 6).map(row => {
          const rowObj: {[key: string]: any} = {};
          headers.forEach((header, index) => {
            rowObj[header] = (row as any[])[index];
          });
          return rowObj;
        });

        setHeaderRow(headers);
        setPreviewData(preview);
        setMapping(initialMapping);
        setCurrentStep("mapping");
        setSelectedTab("mapping");
      } else {
        toast({
          title: "Empty file",
          description: "The uploaded file does not contain any data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "Parse error",
        description: "Failed to parse the file. Please ensure it's a valid Excel or CSV file.",
        variant: "destructive"
      });
    }
  };

  // Update a single field mapping
  const updateMapping = (sourceField: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [sourceField]: targetField
    }));
  };

  // Generate a downloadable template file
  const downloadTemplate = () => {
    // Create worksheet with headers
    const ws = utils.aoa_to_sheet([
      ['Item Code', 'Description', 'Type', 'Pipe Size', 'Price T1', 'Price T2', 'Price T3', 'In Stock', 'Category', 'Manufacturer']
    ]);
    
    // Add sample data
    utils.sheet_add_aoa(ws, [
      ['SP001', 'Brass Gate Valve', 'Valve', '1/2"', 18.50, 17.25, 16.00, 100, 'Valve', 'FastFire'],
      ['SP002', 'Fire Sprinkler Head', 'Sprinkler', '3/4"', 12.75, 11.50, 10.25, 200, 'Sprinkler', 'AquaGuard']
    ], { origin: 'A2' });
    
    // Create workbook and add the worksheet
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Parts Template');
    
    // Generate and download the file
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parts_import_template.xlsx';
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  // Validate the mapped data
  const validateData = async () => {
    if (!file) return;
    
    setIsValidating(true);
    
    try {
      // Read the entire file
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with headers
      const rawData = utils.sheet_to_json(worksheet);
      
      // Initialize validation results
      const errors: ValidationError[] = [];
      let successful = 0;
      let duplicates = 0;
      
      // Get existing parts for duplicate checking
      const response = await apiRequest("GET", "/api/parts");
      const existingParts = Array.isArray(response) ? response : [];
      const existingItemCodes = new Set(existingParts.map((part: any) => part.item_code.toLowerCase()));
      
      // Validate each row
      for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
        const rawRow = rawData[rowIndex] as any;
        const mappedRow: {[key: string]: any} = {};
        
        // Apply field mapping
        for (const sourceField in rawRow as any) {
          const targetField = mapping[sourceField];
          if (targetField) {
            let value = rawRow[sourceField];
            
            // Convert number-like strings to numbers for numeric fields
            if (['price_t1', 'price_t2', 'price_t3', 'cost_price', 'in_stock', 'min_stock'].includes(targetField)) {
              value = typeof value === 'string' ? parseFloat(value) : value;
            }
            
            // Convert yes/no or 1/0 to boolean for is_popular
            if (targetField === 'is_popular' && typeof value === 'string') {
              value = ['yes', 'true', '1', 'y'].includes(value.toLowerCase());
            } else if (targetField === 'is_popular' && typeof value === 'number') {
              value = value === 1;
            }
            
            mappedRow[targetField] = value;
          }
        }
        
        // Check for duplicate item codes within the import file
        if (mappedRow.item_code) {
          const itemCode = mappedRow.item_code.toString().toLowerCase();
          
          // Check if it exists in the database and we're not updating
          if (existingItemCodes.has(itemCode) && !updateExisting) {
            duplicates++;
            errors.push({
              row: rowIndex + 2, // +2 because of 0-indexing and header row
              field: 'item_code',
              message: 'Item code already exists in the database',
              value: mappedRow.item_code
            });
            continue; // Skip further validation for this row
          }
        }
        
        // Validate against schema
        try {
          await importPartSchema.parseAsync(mappedRow);
          successful++;
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            validationError.errors.forEach(err => {
              errors.push({
                row: rowIndex + 2, // +2 because of 0-indexing and header row
                field: err.path.join('.'),
                message: err.message,
                value: err.path.reduce((obj, key) => obj && obj[key], mappedRow)
              });
            });
          }
        }
      }
      
      // Update import result
      setImportResult({
        successful,
        failed: rawData.length - successful,
        errors,
        duplicates
      });
      
      setCurrentStep("validation");
      setSelectedTab("validation");
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "An error occurred during validation. Please check your file format.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Import the validated data
  const importData = async () => {
    if (!file || !importResult) return;
    
    setIsImporting(true);
    setProgress(0);
    
    try {
      // Read the entire file again
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with headers
      const rawData = utils.sheet_to_json(worksheet);
      
      // Get existing parts for update/skip decision
      const response = await apiRequest("GET", "/api/parts");
      const existingParts = Array.isArray(response) ? response : [];
      const existingPartsByCode = new Map(
        existingParts.map((part: any) => [part.item_code.toLowerCase(), part])
      );
      
      // Process in batches of 100
      const batchSize = 100;
      const batches = Math.ceil(rawData.length / batchSize);
      let successCount = 0;
      let errorCount = 0;
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, rawData.length);
        const batch = rawData.slice(batchStart, batchEnd);
        
        // Process each item in the batch
        const promises = batch.map(async (rawRow) => {
          try {
            const mappedRow: {[key: string]: any} = {};
            
            // Apply field mapping
            for (const sourceField in rawRow as any) {
              const targetField = mapping[sourceField];
              if (targetField) {
                let value = (rawRow as any)[sourceField];
                
                // Convert values to appropriate types
                if (['price_t1', 'price_t2', 'price_t3', 'cost_price', 'in_stock', 'min_stock'].includes(targetField)) {
                  value = typeof value === 'string' ? parseFloat(value) : value;
                }
                
                if (targetField === 'is_popular' && typeof value === 'string') {
                  value = ['yes', 'true', '1', 'y'].includes(value.toLowerCase());
                } else if (targetField === 'is_popular' && typeof value === 'number') {
                  value = value === 1;
                }
                
                mappedRow[targetField] = value;
              }
            }
            
            // Skip validation here as we already validated
            
            // Check if item exists and handle update/skip
            const itemCode = mappedRow.item_code?.toString().toLowerCase();
            const existingPart = itemCode ? existingPartsByCode.get(itemCode) : undefined;
            
            if (existingPart) {
              // Handle existing item
              if (updateExisting) {
                // Update existing part
                await apiRequest("PUT", `/api/parts/${existingPart.id}`, {
                  item_code: mappedRow.item_code,
                  pipe_size: mappedRow.pipe_size,
                  description: mappedRow.description,
                  type: mappedRow.type,
                  category: mappedRow.category,
                  manufacturer: mappedRow.manufacturer,
                  supplier_code: mappedRow.supplier_code,
                  price_t1: mappedRow.price_t1,
                  price_t2: mappedRow.price_t2,
                  price_t3: mappedRow.price_t3,
                  cost_price: mappedRow.cost_price,
                  in_stock: mappedRow.in_stock,
                  min_stock: mappedRow.min_stock,
                  is_popular: mappedRow.is_popular
                });
                successCount++;
              }
              // Skip if we're not updating
            } else {
              // Create new part
              await apiRequest("POST", "/api/parts", {
                itemCode: mappedRow.item_code,
                pipeSize: mappedRow.pipe_size,
                description: mappedRow.description,
                type: mappedRow.type,
                category: mappedRow.category,
                manufacturer: mappedRow.manufacturer,
                supplierCode: mappedRow.supplier_code,
                priceT1: mappedRow.price_t1,
                priceT2: mappedRow.price_t2,
                priceT3: mappedRow.price_t3,
                costPrice: mappedRow.cost_price,
                inStock: mappedRow.in_stock,
                minStock: mappedRow.min_stock,
                isPopular: mappedRow.is_popular
              });
              successCount++;
            }
          } catch (error) {
            console.error("Error importing row:", error);
            errorCount++;
          }
        });
        
        // Wait for all items in the batch to process
        await Promise.all(promises);
        
        // Update progress
        setProgress(Math.round(((batchIndex + 1) / batches) * 100));
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      
      // Update import result
      setImportResult(prev => prev ? {
        ...prev,
        successful: successCount,
        failed: errorCount
      } : null);
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} parts. ${errorCount > 0 ? `Failed to import ${errorCount} parts.` : ''}`,
      });
      
      setCurrentStep("complete");
      setSelectedTab("complete");
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Error",
        description: "An error occurred during the import process.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setProgress(100);
    }
  };

  // Handle close and reset
  const handleClose = () => {
    resetImport();
    onOpenChange(false);
  };

  // Export error report
  const exportErrorReport = () => {
    if (!importResult || importResult.errors.length === 0) return;
    
    // Create worksheet with headers
    const headers = ['Row', 'Field', 'Error Message', 'Value'];
    const ws = utils.aoa_to_sheet([headers]);
    
    // Add error data
    const errorData = importResult.errors.map(err => [
      err.row,
      err.field,
      err.message,
      err.value !== undefined ? String(err.value) : ''
    ]);
    
    utils.sheet_add_aoa(ws, errorData, { origin: 'A2' });
    
    // Create workbook and add the worksheet
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Import Errors');
    
    // Generate and download the file - using write directly imported from xlsx
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parts_import_errors.xlsx';
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Parts</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import parts in bulk.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col h-full">
          <TabsList className="grid grid-cols-4 mb-2">
            <TabsTrigger value="upload" disabled={currentStep !== "upload" && currentStep !== "complete"}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={currentStep === "upload" || currentStep === "complete"}>
              Mapping
            </TabsTrigger>
            <TabsTrigger value="validation" disabled={currentStep === "upload" || currentStep === "mapping" || currentStep === "complete"}>
              Validation
            </TabsTrigger>
            <TabsTrigger value="complete" disabled={currentStep !== "complete"}>
              Complete
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto pr-1">

          <TabsContent value="upload" className="space-y-4">
            <Alert>
              <FaInfoCircle className="h-4 w-4" />
              <AlertTitle>Import Instructions</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Upload an Excel (.xlsx, .xls) or CSV file with part data. The file should include at minimum:
                </p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Item Code (unique identifier)</li>
                  <li>Description</li>
                  <li>Part Type</li>
                  <li>Pipe Size</li>
                  <li>Prices (T1, T2, T3)</li>
                </ul>
                <p>
                  Maximum file size: 10MB. For easier imports, download our template.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                <FaDownload className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-10 text-center">
              <FaFileExcel className="h-10 w-10 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Drag and drop or click to upload</h3>
              <p className="text-sm text-neutral-500 mb-4">Supported formats: XLSX, XLS, CSV</p>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                <FaUpload className="h-4 w-4" />
                Select File
              </Button>
              {file && (
                <div className="mt-4 p-2 bg-neutral-100 rounded flex items-center justify-center gap-2">
                  <FaFileExcel className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Alert>
              <FaInfoCircle className="h-4 w-4" />
              <AlertTitle>Column Mapping</AlertTitle>
              <AlertDescription>
                Map the columns in your file to the corresponding fields in our system.
                Required fields are marked with an asterisk (*).
              </AlertDescription>
            </Alert>

            <div className="mb-4 flex items-center space-x-2">
              <Switch 
                id="update-existing" 
                checked={updateExisting} 
                onCheckedChange={setUpdateExisting}
              />
              <Label htmlFor="update-existing">Update existing parts (if Item Code already exists)</Label>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Column</TableHead>
                    <TableHead>Target Field</TableHead>
                    <TableHead>Preview (First Row)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headerRow.map((header, index) => (
                    <TableRow key={index}>
                      <TableCell>{header}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping[header] || ""}
                          onValueChange={(value) => updateMapping(header, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">-- Ignore this column --</SelectItem>
                            {targetFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label} {['item_code', 'pipe_size', 'description', 'type', 'price_t1', 'price_t2', 'price_t3'].includes(field.value) ? '*' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {previewData[0]?.[header]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {previewData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Preview Data</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headerRow.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headerRow.map((header, colIndex) => (
                            <TableCell key={colIndex}>{row[header]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep("upload");
                  setSelectedTab("upload");
                }}
              >
                Back
              </Button>
              <Button 
                onClick={validateData} 
                disabled={isValidating || !Object.values(mapping).some(val => val === 'item_code')}
              >
                {isValidating ? "Validating..." : "Validate Data"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {importResult && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaCheck className="mr-2 h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Valid Records</h3>
                    </div>
                    <p className="text-2xl font-bold">{importResult.successful}</p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaExclamationTriangle className="mr-2 h-5 w-5 text-amber-500" />
                      <h3 className="font-medium">Duplicates</h3>
                    </div>
                    <p className="text-2xl font-bold">{importResult.duplicates}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {updateExisting ? "Will be updated" : "Will be skipped"}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaExclamationTriangle className="mr-2 h-5 w-5 text-red-500" />
                      <h3 className="font-medium">Invalid Records</h3>
                    </div>
                    <p className="text-2xl font-bold">{importResult.failed}</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Validation Errors</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={exportErrorReport}
                        className="flex items-center gap-1"
                      >
                        <FaDownload className="h-3 w-3" />
                        Export Errors
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Error</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell>{error.field}</TableCell>
                              <TableCell>{error.message}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {error.value !== undefined ? String(error.value) : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <Alert variant={importResult.successful > 0 ? "default" : "destructive"}>
                  <FaInfoCircle className="h-4 w-4" />
                  <AlertTitle>
                    {importResult.successful > 0 
                      ? "Ready to Import" 
                      : "Cannot Proceed with Import"}
                  </AlertTitle>
                  <AlertDescription>
                    {importResult.successful > 0 
                      ? `${importResult.successful} valid records will be imported.` 
                      : "Please fix the errors in your file and try again."}
                    {importResult.duplicates > 0 && updateExisting && 
                      ` ${importResult.duplicates} existing records will be updated.`}
                    {importResult.duplicates > 0 && !updateExisting && 
                      ` ${importResult.duplicates} duplicate records will be skipped.`}
                    {importResult.failed > 0 && 
                      ` ${importResult.failed} invalid records will be skipped.`}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => {
                    setCurrentStep("mapping");
                    setSelectedTab("mapping");
                  }}>
                    Back
                  </Button>
                  <Button 
                    onClick={importData} 
                    disabled={isImporting || importResult.successful === 0}
                  >
                    {isImporting ? "Importing..." : "Import Parts"}
                  </Button>
                </div>

                {isImporting && (
                  <div className="mt-4">
                    <p className="text-sm text-neutral-500 mb-2">
                      Importing parts... {progress}%
                    </p>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            {importResult && (
              <>
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full p-3 inline-flex items-center justify-center mb-4">
                    <FaCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Import Complete</h2>
                  <p className="text-neutral-600 mb-6">
                    The parts import has been successfully completed.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-sm text-neutral-500">Total Processed</p>
                      <p className="text-2xl font-bold">{importResult.successful + importResult.failed}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-500">Imported</p>
                      <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-500">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    </div>
                  </div>
                </div>

                {importResult.failed > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={exportErrorReport}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <FaDownload className="h-4 w-4" />
                    Download Error Report
                  </Button>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {currentStep === "complete" ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportPartsModal;