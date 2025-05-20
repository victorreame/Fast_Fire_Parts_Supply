import { Pool } from 'pg';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper function to determine the price tier based on the price
const determinePriceTier = (price) => {
  if (price <= 10) return 'Economy';
  if (price <= 25) return 'Standard';
  return 'Premium';
};

async function importProducts() {
  const client = await pool.connect();
  
  try {
    console.log('Starting product import process...');
    
    // Clear tables with foreign key dependencies
    console.log('Clearing dependent tables...');
    await client.query('DELETE FROM favorites');
    await client.query('DELETE FROM cart_items');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM job_parts');
    await client.query('DELETE FROM contract_pricing');
    
    // Now clear the parts table
    console.log('Clearing parts table...');
    await client.query('DELETE FROM parts');
    
    // Reset the sequence
    await client.query('ALTER SEQUENCE parts_id_seq RESTART WITH 1');
    
    // Read the Excel file
    console.log('Reading Excel file...');
    const excelFile = path.join(__dirname, 'attached_assets', 'Copy of AFSF Product List Shopify Export.xlsx');
    const workbook = xlsx.readFile(excelFile);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the worksheet to JSON
    const products = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${products.length} products in Excel file.`);
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Insert products into the parts table
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Extract data from Excel fields
      // Note: Adapt these field names to match your Excel column headers
      const itemCode = product['Handle'] || product['SKU'] || `ITEM-${i+1}`;
      const description = product['Title'] || 'No description';
      const type = product['Type'] || 'Standard';
      const category = product['Product Category'] || 'General';
      const pipeSize = product['Pipe Size'] || '';
      const manufacturer = product['Vendor'] || '';
      const image = product['Image Src'] || '';
      
      // Calculate prices (adjust as needed)
      const price = parseFloat(product['Price'] || 0);
      const priceT1 = price * 1.0;  // Full price
      const priceT2 = price * 0.9;  // 10% discount
      const priceT3 = price * 0.8;  // 20% discount
      const costPrice = price * 0.7; // 30% below retail
      
      // Handle stock information
      const inStock = parseInt(product['Inventory'] || 10);
      const minStock = 5;
      const isPopular = i < 20; // Mark first 20 items as popular
      
      // Insert into parts table
      await client.query(`
        INSERT INTO parts (
          item_code, description, type, category, pipe_size, manufacturer, 
          price_t1, price_t2, price_t3, cost_price, in_stock, min_stock, 
          is_popular, image, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      `, [
        itemCode, description, type, category, pipeSize, manufacturer,
        priceT1, priceT2, priceT3, costPrice, inStock, minStock,
        isPopular, image
      ]);
      
      // Log progress
      if ((i + 1) % 20 === 0 || i === products.length - 1) {
        console.log(`Imported ${i + 1} of ${products.length} products`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Product import completed successfully!');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error importing products:', error);
    throw error;
  } finally {
    // Release the client
    client.release();
  }
}

// Run the import
importProducts()
  .then(() => {
    console.log('Import process completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Import process failed:', err);
    process.exit(1);
  });