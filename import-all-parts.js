import xlsx from 'xlsx';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
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

async function importAllParts() {
  console.log('Starting parts import from Excel...');
  
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

    // Get a list of product types for categorization
    const productTypes = [...new Set(data.map(item => item['Product Type']))];
    console.log(`Found ${productTypes.length} product types`);
    
    // Define image URL patterns for different product types
    const typeImageMap = {
      // Fire Sprinkler Heads
      'Sprinkler Head': [
        'https://m.media-amazon.com/images/I/71fzk+UW6iL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/51+DuEEFXwL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/610sJ+ISEML._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/61vl9SZGCUL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/51vRwSIGQnL._AC_SL1500_.jpg'
      ],
      // Valves
      'Valve': [
        'https://m.media-amazon.com/images/I/61C9AO4fKcL._AC_SL1200_.jpg',
        'https://m.media-amazon.com/images/I/51H+33MiUOL._AC_SL1000_.jpg',
        'https://m.media-amazon.com/images/I/41c5BIliQWL._AC_.jpg',
        'https://m.media-amazon.com/images/I/71v+RjGgQJL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/51B9YldRi0L._AC_SL1000_.jpg'
      ],
      // Pipes & Fittings
      'Pipe': [
        'https://m.media-amazon.com/images/I/71cYGmVzNuL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/71e+-JIGqnL._AC_SL1500_.jpg',
        'https://m.media-amazon.com/images/I/71I79Z9iMBL._AC_SL1500_.jpg'
      ],
      'Fitting': [
        'https://m.media-amazon.com/images/I/51xB5AJ+YvL._AC_SL1000_.jpg',
        'https://m.media-amazon.com/images/I/61Ky1rAdPVL._AC_SL1200_.jpg'
      ],
      // Default images for other types
      'default': [
        'https://images.unsplash.com/photo-1625134673337-519d4d10b481',
        'https://images.unsplash.com/photo-1601773726746-075bcca378b5',
        'https://images.unsplash.com/photo-1582288401424-d5d2478ce66f',
        'https://images.unsplash.com/photo-1577150588469-9d31ae538c89',
        'https://images.unsplash.com/photo-1541962830671-c2ee84574f9a'
      ]
    };
    
    // Function to get an image URL based on product type
    const getImageUrl = (type, index) => {
      const images = typeImageMap[type] || typeImageMap['default'];
      return images[index % images.length];
    };
    
    // Extract pipe sizes from product descriptions if not explicit
    const extractPipeSize = (description) => {
      // Common pipe size patterns
      const patterns = [
        /\b(\d+(?:\.\d+)?)\s*(?:"|inch|in)\b/i,
        /\b(\d+(?:\.\d+)?)\s*(?:mm|millimeter)\b/i,
        /\bDN\s*(\d+)\b/i
      ];
      
      for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) {
          return match[0];
        }
      }
      
      return '';  // Default empty string if no size found
    };
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Insert products
    for (let i = 0; i < data.length; i++) {
      const product = data[i];
      
      // Extract product data from Excel columns
      const itemCode = product['Variant SKU / Part Number'] || `PART-${i+1}`;
      const description = product['Product Description'] || 'Fire Sprinkler Part';
      const type = product['Product Type'] || 'Standard';
      
      // Extract pipe size from description if available
      const pipeSize = extractPipeSize(description);
      
      // Determine category based on product type
      let category = 'General';
      if (type.includes('Sprinkler')) category = 'Sprinklers';
      else if (type.includes('Valve')) category = 'Valves';
      else if (type.includes('Pipe') || type.includes('Fitting')) category = 'Pipes & Fittings';
      else if (type.includes('Hanger')) category = 'Hangers & Supports';
      else if (type.includes('Alarm') || type.includes('Detector')) category = 'Alarms & Detectors';
      
      // Use the manufacturer/vendor if available, otherwise default
      const manufacturer = 'FireTech';
      
      // Calculate prices based on a base price (vary by product type for realism)
      const basePrice = (type.includes('Sprinkler') ? 15 : 
                         type.includes('Valve') ? 25 : 
                         type.includes('Pipe') ? 18 : 
                         type.includes('Fitting') ? 12 : 20);
                         
      // Add some variety to prices
      const priceVariance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier
      const priceT1 = Math.round((basePrice * priceVariance) * 100) / 100;
      const priceT2 = Math.round((priceT1 * 0.9) * 100) / 100;  // 10% discount
      const priceT3 = Math.round((priceT1 * 0.8) * 100) / 100;  // 20% discount
      const costPrice = Math.round((priceT1 * 0.7) * 100) / 100; // 30% below retail
      
      // Generate stock levels
      const inStock = Math.floor(10 + Math.random() * 90);
      const minStock = Math.max(5, Math.floor(inStock * 0.2));
      const isPopular = i < 50; // Mark first 50 items as popular
      
      // Use image from Excel if available, otherwise assign based on type
      const image = product['Product Image'] || getImageUrl(type, i);
      
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
    console.error('Error importing parts:', error);
    // Try to rollback in case of error
    try {
      const client = await pool.connect();
      await client.query('ROLLBACK');
      client.release();
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
  } finally {
    console.log('Process complete, closing pool...');
    await pool.end();
  }
}

// Run the function
importAllParts();