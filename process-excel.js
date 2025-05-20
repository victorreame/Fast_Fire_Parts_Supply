import xlsx from 'xlsx';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Get current file directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a PostgreSQL client
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function processExcel() {
  console.log('Starting Excel processing...');
  
  try {
    const client = await pool.connect();
    
    // Clear dependent tables
    console.log('Clearing dependent tables...');
    await client.query('DELETE FROM favorites');
    await client.query('DELETE FROM cart_items');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM job_parts');
    await client.query('DELETE FROM contract_pricing');
    
    // Clear the parts table
    console.log('Clearing parts table...');
    await client.query('DELETE FROM parts');
    await client.query('ALTER SEQUENCE parts_id_seq RESTART WITH 1');
    
    // Read the Excel file
    const excelPath = path.join(__dirname, 'product-list.xlsx');
    console.log(`Reading Excel file from: ${excelPath}`);
    
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    console.log(`Found ${data.length} products in the Excel file`);
    
    // Define a standard image URL pattern
    const getImageUrl = (index) => {
      // Return URL for product image from Unsplash (fire protection/industrial images)
      const imageUrls = [
        'https://images.unsplash.com/photo-1625134673337-519d4d10b481',
        'https://images.unsplash.com/photo-1601773726746-075bcca378b5',
        'https://images.unsplash.com/photo-1582288401424-d5d2478ce66f',
        'https://images.unsplash.com/photo-1577150588469-9d31ae538c89',
        'https://images.unsplash.com/photo-1541962830671-c2ee84574f9a',
        'https://images.unsplash.com/photo-1606022830265-593ded632f59',
        'https://images.unsplash.com/photo-1581578017093-cd30fce4eaf7',
        'https://images.unsplash.com/photo-1576302114099-522761c3b702',
        'https://images.unsplash.com/photo-1580654853857-6ea0b5f6851b',
        'https://images.unsplash.com/photo-1598229584231-51296e10a6cb'
      ];
      
      return imageUrls[index % imageUrls.length] + '?w=400&h=400&fit=crop';
    };
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Insert products
    for (let i = 0; i < data.length; i++) {
      const product = data[i];
      
      // Map Excel columns to database fields (adjust these based on your Excel structure)
      const itemCode = product['Handle'] || product['SKU'] || product['Item Code'] || `ITEM-${i+1}`;
      const pipeSize = product['Pipe Size'] || product['Size'] || '';
      const description = product['Title'] || product['Description'] || product['Name'] || 'Product';
      const type = product['Type'] || product['Product Type'] || 'Standard';
      const category = product['Product Category'] || product['Category'] || 'General';
      const manufacturer = product['Vendor'] || product['Manufacturer'] || 'FastFire';
      
      // Process pricing
      const basePrice = parseFloat(product['Price'] || product['Variant Price'] || '10.00');
      const priceT1 = basePrice * 1.0;  // Full price
      const priceT2 = basePrice * 0.9;  // 10% discount
      const priceT3 = basePrice * 0.8;  // 20% discount
      const costPrice = basePrice * 0.7; // 30% below retail
      
      // Stock information
      const inStock = parseInt(product['Inventory'] || product['Quantity'] || '10');
      const minStock = Math.max(5, Math.floor(inStock * 0.2));
      const isPopular = i < 50; // Mark first 50 items as popular
      
      // Generate image URL - use original URL if provided, otherwise use a pattern
      const image = product['Image Src'] || product['Image'] || getImageUrl(i);
      
      // Insert product into the database
      const query = `
        INSERT INTO parts (
          item_code, pipe_size, description, type, category, manufacturer,
          price_t1, price_t2, price_t3, cost_price,
          in_stock, min_stock, is_popular, image, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      `;
      
      await client.query(query, [
        itemCode, pipeSize, description, type, category, manufacturer,
        priceT1, priceT2, priceT3, costPrice,
        inStock, minStock, isPopular, image
      ]);
      
      // Log progress at intervals
      if ((i + 1) % 100 === 0 || i === data.length - 1) {
        console.log(`Imported ${i + 1} of ${data.length} products`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('All products imported successfully!');
    
    // Final product count
    const countResult = await client.query('SELECT COUNT(*) FROM parts');
    console.log(`Total products in database: ${countResult.rows[0].count}`);
    
    client.release();
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
  } finally {
    console.log('Process complete, closing pool...');
    await pool.end();
  }
}

// Run the function
processExcel();