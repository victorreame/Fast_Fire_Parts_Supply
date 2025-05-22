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
  totalRecords: number;
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
    { value: "image", label: "Image URL" },
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
      
      // Track item codes to find duplicates within the file
      const importItemCodes = new Map<string, number>();
      
      // First pass: collect all item codes to find duplicates within the import file
      for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
        const rawRow = rawData[rowIndex] as any;
        // Find the item code in the raw data using our mapping
        let itemCode = '';
        for (const sourceField in rawRow) {
          if (mapping[sourceField] === 'item_code' && rawRow[sourceField]) {
            itemCode = rawRow[sourceField].toString().toLowerCase();
            break;
          }
        }
        
        if (itemCode) {
          if (importItemCodes.has(itemCode)) {
            // Found duplicate within the file - mark both rows
            const firstRow = importItemCodes.get(itemCode)!;
            
            // Only add the error for the first occurrence once
            if (!errors.some(e => e.row === firstRow + 2 && e.field === 'item_code' && e.message.includes('duplicate'))) {
              errors.push({
                row: firstRow + 2, // +2 for header row and 0-indexing
                field: 'item_code',
                message: `Duplicate item code in file (rows ${firstRow + 2} and ${rowIndex + 2})`,
                value: itemCode
              });
            }
            
            // Always add error for subsequent occurrences
            errors.push({
              row: rowIndex + 2, // +2 for header row and 0-indexing
              field: 'item_code',
              message: `Duplicate item code in file (rows ${firstRow + 2} and ${rowIndex + 2})`,
              value: itemCode
            });
            
            duplicates++;
          } else {
            importItemCodes.set(itemCode, rowIndex);
          }
        }
      }
      
      // Validate each row
      for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
        const rawRow = rawData[rowIndex] as any;
        const mappedRow: {[key: string]: any} = {};
        
        // Apply field mapping
        for (const sourceField in rawRow as any) {
          const targetField = mapping[sourceField];
          if (targetField) {
            let value = rawRow[sourceField];
            
            // Skip empty or undefined values
            if (value === undefined || value === null || value === '') {
              continue;
            }
            
            // Convert number-like strings to numbers for numeric fields
            if (['price_t1', 'price_t2', 'price_t3', 'cost_price', 'in_stock', 'min_stock'].includes(targetField)) {
              value = typeof value === 'string' ? parseFloat(value) : value;
              // Ensure we have valid numbers
              if (isNaN(value)) {
                errors.push({
                  row: rowIndex + 2,
                  field: targetField,
                  message: `Invalid number format for ${targetField}`,
                  value: rawRow[sourceField]
                });
                continue;
              }
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
        
        // Check if it exists in the database and we're not updating
        if (mappedRow.item_code) {
          const itemCode = mappedRow.item_code.toString().toLowerCase();
          
          // Skip this check if this row was already marked with a duplicate error
          if (!errors.some(e => e.row === rowIndex + 2 && e.field === 'item_code' && e.message.includes('duplicate'))) {
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
          } else {
            // Skip validation for rows already identified as duplicates
            continue;
          }
        }
        
        // Check for required fields
        const requiredFields = ['item_code', 'pipe_size', 'description', 'type', 'price_t1', 'price_t2', 'price_t3'];
        const missingFields = requiredFields.filter(field => !mappedRow[field]);
        
        if (missingFields.length > 0) {
          missingFields.forEach(field => {
            errors.push({
              row: rowIndex + 2, // +2 because of 0-indexing and header row
              field: field,
              message: `Missing required field: ${field}`,
              value: null
            });
          });
          continue; // Skip further validation if required fields are missing
        }
        
        // Validate against schema
        try {
          // Log for debugging
          console.log('Validating row:', mappedRow);
          await importPartSchema.parseAsync(mappedRow);
          successful++;
        } catch (validationError: any) {
          console.error('Error importing row:', validationError);
          if (validationError instanceof z.ZodError) {
            validationError.errors.forEach(err => {
              errors.push({
                row: rowIndex + 2, // +2 because of 0-indexing and header row
                field: err.path.join('.'),
                message: err.message,
                value: err.path.length > 0 ? mappedRow[err.path[0]] : null
              });
            });
          } else {
            // Handle non-Zod errors
            errors.push({
              row: rowIndex + 2,
              field: 'unknown',
              message: validationError.message || 'Unknown validation error',
              value: null
            });
          }
        }
      }
      
          // Create a de-duplicated list of errors for accurate tracking
      // We need to only keep errors for records that will actually not be imported
      const uniqueErrorMap = new Map(); // Map of row number to error
      const skippedRows = new Set(); // Rows that will be skipped during import
      
      // First, identify all rows that will be skipped (duplicates, validation failures)
      errors.forEach(err => {
        skippedRows.add(err.row);
      });
      
      // Now create one error per skipped row, prioritizing clearer error messages
      skippedRows.forEach(rowNum => {
        // Find all errors for this row
        const rowErrors = errors.filter(err => err.row === rowNum);
        
        // Prioritize the error to show (duplicate errors are more important than validation errors)
        let primaryError;
        
        // First look for duplicate in file errors
        primaryError = rowErrors.find(err => err.message.includes('Duplicate item code in file'));
        
        // Then look for database duplicate errors
        if (!primaryError) {
          primaryError = rowErrors.find(err => err.message.includes('exists in the database'));
        }
        
        // Then use any other error
        if (!primaryError && rowErrors.length > 0) {
          primaryError = rowErrors[0];
        }
        
        // Add this error to our unique map
        if (primaryError) {
          uniqueErrorMap.set(rowNum, primaryError);
        }
      });
      
      // Convert map to array for our de-duplicated error list
      const uniqueErrors = Array.from(uniqueErrorMap.values());
      
      // Calculate final counts
      const failed = uniqueErrors.length;
      successful = rawData.length - failed; // Recalculate successful based on failed count
      
      console.log(`Found ${errors.length} raw errors, consolidated to ${failed} unique errors (one per skipped row)`);
      console.log(`Total records: ${rawData.length}, Successful: ${successful}, Failed: ${failed}`);
      
      // Use uniqueErrors as our error list to ensure consistency
      setImportResult({
        successful,
        failed,
        errors: uniqueErrors, // This is the key change - use our filtered errors
        duplicates,
        totalRecords: rawData.length
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
      
      // Track detailed errors for the error report
      const importErrors: ValidationError[] = [];
      
      // Track item codes in current import to detect duplicates within the file
      const importItemCodes = new Set<string>();
      
      // Track the total number of records in the file
      const totalRecords = rawData.length;
      
      // Pre-process to find duplicates within the file
      const duplicateRows = new Set<number>();
      
      rawData.forEach((row: any, index: number) => {
        // Apply mapping to get the item_code
        const itemCode = Object.keys(row).reduce((code, field) => {
          if (mapping[field] === 'item_code') {
            return (row[field] || '').toString().toLowerCase();
          }
          return code;
        }, '');
        
        // Skip empty item codes
        if (!itemCode) return;
        
        // Check if this item code already exists in our current import
        if (importItemCodes.has(itemCode)) {
          importErrors.push({
            row: index + 2, // +2 for header row and 0-indexing
            field: 'item_code',
            message: 'Duplicate item code within imported file',
            value: itemCode
          });
          errorCount++;
          duplicateRows.add(index); // Mark this row as a duplicate
        } else {
          importItemCodes.add(itemCode);
        }
      });
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, rawData.length);
        const batch = rawData.slice(batchStart, batchEnd);
        
        // Process each item in the batch
        const promises = batch.map(async (rawRow: any) => {
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
            
            // Check for duplicate in import file - skip if already marked as duplicate
            const itemCode = mappedRow.item_code?.toString().toLowerCase();
            if (!itemCode) {
              throw new Error("Item code is required");
            }

            // Check if already processed as duplicate in pre-processing
            if (importErrors.some(err => 
                err.field === 'item_code' && 
                err.value.toLowerCase() === itemCode && 
                err.message.includes('Duplicate'))) {
              // Skip this row as it was already marked as a duplicate
              throw new Error("Duplicate item code - skipping this entry");
            }
            
            // Check if item exists in database and handle update/skip
            const existingPart = existingPartsByCode.get(itemCode);
            
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
                  is_popular: mappedRow.is_popular,
                  image: mappedRow.image
                });
                successCount++;
              } else {
                // Skip and report as duplicate if we're not updating
                throw new Error(`Item code '${mappedRow.item_code}' already exists in the database`);
              }
            } else {
              // Create new part
              await apiRequest("POST", "/api/parts", {
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
                is_popular: mappedRow.is_popular,
                image: mappedRow.image
              });
              successCount++;
            }
          } catch (error: any) {
            console.error("Error importing row:", error);
            errorCount++;
            
            // Add detailed error info for the error report
            let errorMessage = "Unknown error";
            let errorField = "unknown";
            let errorValue = (rawRow as any).item_code || "unknown";
            
            if (error.message) {
              errorMessage = error.message;
              
              // Try to extract more specific error details from the response
              try {
                if (error.message.includes("400:") || error.message.includes("500:")) {
                  const errorJson = error.message.split(":", 2)[1].trim();
                  const errorObj = JSON.parse(errorJson);
                  
                  if (errorObj.message) {
                    errorMessage = errorObj.message;
                  }
                  
                  if (errorObj.errors && errorObj.errors.length > 0) {
                    errorField = errorObj.errors[0].path?.join('.') || "validation";
                    errorMessage = errorObj.errors[0].message || errorMessage;
                  }
                }
              } catch (parseError) {
                // Fallback to original error message if parsing fails
                console.log("Error parsing error details:", parseError);
              }
            }
            
            // Store the error details for the report
            importErrors.push({
              row: batchStart + batch.indexOf(rawRow) + 2, // +2 for header row and 0-indexing
              field: errorField,
              message: errorMessage,
              value: errorValue
            });
          }
        });
        
        // Wait for all items in the batch to process
        await Promise.all(promises);
        
        // Update progress
        setProgress(Math.round(((batchIndex + 1) / batches) * 100));
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/parts'] });
      
      // Update import result with detailed error information and original total count
      // Make sure the error count matches the actual error array length
      const actualErrorCount = importErrors.length;
      
      setImportResult(prev => prev ? {
        ...prev,
        successful: successCount,
        failed: actualErrorCount, // Use the actual error count from the array
        errors: importErrors, // Add the detailed error information
        totalRecords: totalRecords // Store the actual total from the file
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

  // Prepare consolidated error report data
  const prepareErrorReport = (): Array<[number | string, string, string, string]> => {
    if (!importResult || !importResult.errors.length) return [];
    
    // Simply use the exact same list of errors that we tracked during validation
    // This ensures the Excel report matches exactly with what was displayed in the UI
    const reportRows: Array<[number | string, string, string, string]> = [];
    
    // Create one clear report row for each error
    importResult.errors.forEach(err => {
      // Improve error messages for better clarity
      let message = err.message;
      let field = err.field || 'unknown';
      
      // Fix unknown field errors
      if (field === 'unknown') {
        if (message.includes('Duplicate')) {
          field = 'item_code';
        } 
        else if (message.includes('exists in the database')) {
          field = 'item_code';
        }
      }
      
      // Standardize error messages
      if (message.includes('Duplicate item code in file')) {
        message = `Duplicate item code in imported file: ${err.value}`;
      }
      else if (message.includes('exists in the database')) {
        message = `Item code already exists in database: ${err.value}`;
      }
      
      reportRows.push([
        err.row,
        field,
        message,
        err.value !== undefined && err.value !== null ? String(err.value) : ''
      ]);
    });
    
    return reportRows;
  };
  
  // Export error report
  const exportErrorReport = () => {
    if (!importResult || importResult.errors.length === 0) {
      toast({
        title: "No Errors to Export",
        description: "There are no import errors to export.",
      });
      return;
    }
    
    try {
      // Create worksheet with headers
      const headers = ['Row', 'Field', 'Error Message', 'Value'];
      const ws = utils.aoa_to_sheet([headers]);
      
      // Get consolidated error report data
      const errorData = prepareErrorReport();
      
      // Add rows to worksheet
      utils.sheet_add_aoa(ws, errorData, { origin: 'A2' });
      
      // Log the error count for debugging
      console.log(`Exporting ${errorData.length} errors out of ${importResult.failed} total failed records`);
      
      // Create workbook and add the worksheet
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Import Errors');
      
      // Generate and download the file
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'parts_import_errors.xlsx';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Error report with ${errorData.length} issues has been downloaded.`,
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Error",
        description: "Failed to generate error report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import Parts</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import parts in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(80vh-12rem)] pr-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 mb-2 sticky top-0 bg-background z-10">
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
                      ? updateExisting 
                        ? `${importResult.successful - importResult.duplicates} new records will be imported.` 
                        : `${importResult.successful - importResult.duplicates} records will be imported.`
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
                      <p className="text-sm text-neutral-500">Total Records</p>
                      <p className="text-2xl font-bold">{importResult.totalRecords || 0}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-500">Imported</p>
                      <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-500">Failed/Skipped</p>
                      <p className="text-2xl font-bold text-red-600">{importResult.totalRecords ? (importResult.totalRecords - importResult.successful) : importResult.failed}</p>
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
          </div>

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