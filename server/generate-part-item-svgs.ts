import { db } from './db';
import { parts } from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Generate individual SVG files for each part using templates
async function generatePartItemSvgs() {
  console.log('Starting to generate SVG files for parts...');
  
  try {
    // Get all parts
    const allParts = await db.select().from(parts);
    const partsDir = path.join(process.cwd(), 'public/assets/parts');
    
    // Ensure directory exists
    if (!fs.existsSync(partsDir)) {
      fs.mkdirSync(partsDir, { recursive: true });
      console.log('Created parts directory');
    }
    
    console.log(`Found ${allParts.length} parts`);
    let created = 0;
    
    for (const part of allParts) {
      // Get template name based on part type (lowercase)
      const type = part.type.toLowerCase();
      const templatePath = path.join(partsDir, `template-${type}.svg`);
      const targetPath = path.join(partsDir, `${part.item_code}.svg`);
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.log(`Template for type ${part.type} not found`);
        continue;
      }
      
      // Skip if part SVG already exists
      if (fs.existsSync(targetPath)) {
        console.log(`SVG already exists for ${part.item_code}, skipping`);
        continue;
      }
      
      try {
        // Copy the template SVG to a part-specific SVG
        fs.copyFileSync(templatePath, targetPath);
        created++;
        console.log(`Created SVG for ${part.item_code} (${part.type})`);
      } catch (error) {
        console.error(`Error creating SVG for ${part.item_code}:`, error);
      }
    }
    
    console.log(`Part SVG generation complete. Created ${created} new SVG files.`);
  } catch (error) {
    console.error('Error generating SVGs:', error);
  }
}

// Run the function
generatePartItemSvgs();