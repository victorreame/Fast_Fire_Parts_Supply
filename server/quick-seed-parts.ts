import { db } from './db';
import { parts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Part types for fire sprinkler systems
const partTypes = [
  'Sprinkler', 
  'Fitting', 
  'Valve', 
  'Monitor', 
  'Alarm', 
  'Connection', 
  'Pipe', 
  'Hose', 
  'Tool', 
  'Accessory'
];

// Prefixes for each part type
const prefixes: Record<string, string> = {
  'Sprinkler': 'SPK',
  'Fitting': 'FIT',
  'Valve': 'VLV',
  'Monitor': 'MON',
  'Alarm': 'ALM',
  'Connection': 'CON',
  'Pipe': 'PIP',
  'Hose': 'HOS',
  'Tool': 'TL',
  'Accessory': 'ACC'
};

// Possible pipe sizes
const pipeSizes = [
  '1/2"', 
  '3/4"', 
  '1"', 
  '1-1/4"', 
  '1-1/2"', 
  '2"', 
  '2-1/2"', 
  '3"', 
  '4"', 
  '6"', 
  'N/A'
];

// Create hardcoded new parts to avoid complex logic
async function seedParts() {
  console.log('Starting to seed parts...');
  
  try {
    // Count existing parts
    const existingParts = await db.select({ count: { expression: 'COUNT(*)' } }).from(parts);
    const currentCount = Number(existingParts[0].count);
    console.log(`Current part count: ${currentCount}`);
    
    // Create parts
    const newParts = [];
    const imagePath = '/assets/parts';
    
    // Generate 100 parts data
    for (let i = 0; i < 100; i++) {
      const typeIndex = i % partTypes.length;
      const type = partTypes[typeIndex];
      const prefix = prefixes[type] || type.substring(0, 3).toUpperCase();
      const itemCode = `${prefix}-${1000 + i}`;
      
      // Select pipe size
      let pipeSize = pipeSizes[i % pipeSizes.length];
      if (['Alarm', 'Tool', 'Accessory'].includes(type)) {
        pipeSize = 'N/A';
      }
      
      // Basic description
      const description = `${type} ${pipeSize} - Model ${1000 + i}`;
      
      // Set prices
      const basePrice = 10 + (i % 10) * 5;
      const priceT3 = basePrice;
      const priceT2 = basePrice * 0.9;
      const priceT1 = basePrice * 0.8;
      
      // Random stock and popularity
      const inStock = 10 + (i * 3) % 200;
      const isPopular = i < 50; // First 50 are popular
      
      // Image path
      const image = `${imagePath}/template-${type.toLowerCase()}.svg`;
      
      // Create part object
      newParts.push({
        item_code: itemCode,
        pipe_size: pipeSize,
        description,
        type,
        price_t1: parseFloat(priceT1.toFixed(2)),
        price_t2: parseFloat(priceT2.toFixed(2)),
        price_t3: parseFloat(priceT3.toFixed(2)),
        in_stock: inStock,
        is_popular: isPopular,
        image
      });
    }
    
    // Insert parts in batches
    for (let i = 0; i < newParts.length; i++) {
      try {
        const part = newParts[i];
        
        // Check if part with this item_code already exists
        const existing = await db.select().from(parts).where(eq(parts.item_code, part.item_code));
        
        if (existing.length === 0) {
          await db.insert(parts).values(part);
          console.log(`Added part: ${part.item_code} - ${part.description}`);
        } else {
          console.log(`Part ${part.item_code} already exists, skipping`);
        }
      } catch (error) {
        console.error(`Error adding part at index ${i}:`, error);
      }
    }
    
    // Check new count
    const newCount = await db.select({ count: { expression: 'COUNT(*)' } }).from(parts);
    console.log(`Parts created. New total: ${newCount[0].count}`);
    
  } catch (error) {
    console.error('Error in seed operation:', error);
  }
}

// Copy template SVGs to part SVGs
async function generateSvgs() {
  console.log('Generating SVG files for parts...');
  
  try {
    // Get all parts
    const allParts = await db.select().from(parts);
    const templatesDir = path.join(process.cwd(), 'public/assets/parts');
    
    // Ensure directory exists
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    // Create SVGs
    let created = 0;
    
    for (const part of allParts) {
      const type = part.type.toLowerCase();
      const templatePath = path.join(templatesDir, `template-${type}.svg`);
      const targetPath = path.join(templatesDir, `${part.item_code}.svg`);
      
      // Skip if template doesn't exist or SVG already exists
      if (!fs.existsSync(templatePath)) {
        console.log(`Template not found for type ${part.type}`);
        continue;
      }
      
      if (fs.existsSync(targetPath)) {
        // console.log(`SVG already exists for ${part.item_code}, skipping`);
        continue;
      }
      
      try {
        // Copy template to part SVG
        fs.copyFileSync(templatePath, targetPath);
        created++;
        console.log(`Created SVG for ${part.item_code}`);
      } catch (error) {
        console.error(`Error creating SVG for ${part.item_code}:`, error);
      }
    }
    
    console.log(`SVG generation complete. Created ${created} new SVG files.`);
  } catch (error) {
    console.error('Error generating SVGs:', error);
  }
}

// Run both operations
async function main() {
  try {
    await seedParts();
    await generateSvgs();
    console.log('All done!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();