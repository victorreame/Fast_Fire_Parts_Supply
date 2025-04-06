import { db } from './db';
import { parts } from '@shared/schema';
import { eq } from 'drizzle-orm';

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

// Generate a unique code for each part type
function generateItemCode(type: string, index: number): string {
  // Create prefixes for each part type
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
  
  // Get prefix for the type, default to first 3 letters of type if not in mapping
  const prefix = prefixes[type] || type.substring(0, 3).toUpperCase();
  
  // Generate a random 3-digit number
  const randomNum = (index % 900) + 100;
  
  return `${prefix}-${randomNum}`;
}

// Generate descriptive names for parts based on type
function generateDescription(type: string, pipeSize: string): string {
  const sprinklerTypes = [
    'Pendant Sprinkler', 
    'Upright Sprinkler', 
    'Sidewall Sprinkler', 
    'Concealed Sprinkler',
    'Recessed Sprinkler',
    'Extended Coverage Sprinkler',
    'Dry Pendant Sprinkler',
    'Dry Sidewall Sprinkler',
    'Institutional Sprinkler',
    'Window Sprinkler'
  ];
  
  const fittingTypes = [
    'Threaded Elbow - 90°', 
    'Threaded Elbow - 45°',
    'Tee Fitting',
    'Cross Fitting',
    'Reducer Coupling',
    'Union Fitting',
    'Nipple Fitting',
    'Cap Fitting',
    'Flange Fitting',
    'Groove Coupling'
  ];
  
  const valveTypes = [
    'Ball Valve',
    'Butterfly Valve',
    'Check Valve',
    'Control Valve',
    'Gate Valve',
    'Pressure Relief Valve',
    'OS&Y Valve',
    'Test and Drain Valve',
    'Alarm Valve',
    'Dry Pipe Valve'
  ];
  
  const monitorTypes = [
    'Pressure Gauge',
    'Flow Switch',
    'Tamper Switch',
    'Water Level Indicator',
    'Pressure Transducer',
    'Temperature Sensor',
    'Water Flow Detector',
    'Supervisory Switch',
    'Pressure Switch',
    'Valve Monitor'
  ];
  
  const alarmTypes = [
    'Fire Alarm Pull Station',
    'Alarm Bell',
    'Electronic Horn',
    'Strobe Light',
    'Combined Horn/Strobe',
    'Smoke Detector',
    'Heat Detector',
    'Fire Alarm Control Panel',
    'Notification Device',
    'Alarm Sounder'
  ];
  
  const connectionTypes = [
    'Fire Department Connection',
    'Standpipe Connection',
    'Hose Connection',
    'Wall Hydrant',
    'Floor Control Assembly',
    'System Riser Connection',
    'Test Connection',
    'Roof Manifold Connection',
    'Siamese Connection',
    'Cabinet Connection'
  ];
  
  const pipeTypes = [
    'Black Steel Pipe',
    'Galvanized Pipe',
    'CPVC Pipe',
    'Copper Pipe',
    'Stainless Steel Pipe',
    'Schedule 10 Pipe',
    'Schedule 40 Pipe',
    'Red Painted Pipe',
    'Grooved Pipe',
    'Threaded Pipe'
  ];
  
  const hoseTypes = [
    'Fire Hose',
    'Standpipe Hose',
    'Rack Hose',
    'Cabinet Hose',
    'Attack Hose',
    'Supply Hose',
    'Canvas Hose',
    'Rubber Hose',
    'Lined Hose',
    'Discharge Hose'
  ];
  
  const toolTypes = [
    'Pipe Wrench',
    'Groove Tool',
    'Pipe Cutter',
    'Threading Machine',
    'Test Pump',
    'Sprinkler Wrench',
    'Installation Tool',
    'Pressure Test Kit',
    'Gauge Tool',
    'Inspection Mirror'
  ];
  
  const accessoryTypes = [
    'Sprinkler Head Guard',
    'Sprinkler Escutcheon',
    'Pipe Hanger',
    'Seismic Brace',
    'Pipe Support',
    'Sign Plate',
    'Cabinet Hardware',
    'Valve Lockout',
    'Pipe Identification Marker',
    'Protective Cover'
  ];
  
  const typeMap: Record<string, string[]> = {
    'Sprinkler': sprinklerTypes,
    'Fitting': fittingTypes,
    'Valve': valveTypes,
    'Monitor': monitorTypes,
    'Alarm': alarmTypes,
    'Connection': connectionTypes,
    'Pipe': pipeTypes,
    'Hose': hoseTypes,
    'Tool': toolTypes,
    'Accessory': accessoryTypes
  };
  
  const items = typeMap[type] || [`${type} Item`];
  const randomItem = items[Math.floor(Math.random() * items.length)];
  
  // For items that don't need pipe size (like alarms), don't include it in description
  if (pipeSize === 'N/A') {
    return randomItem;
  }
  
  return `${randomItem} - ${pipeSize}`;
}

// Generate random image path based on part type and item code
function generateImagePath(type: string, itemCode: string): string {
  return `/assets/parts/${itemCode}.svg`;
}

// Generate parts with appropriate pricing based on type
async function generatePart(index: number) {
  // Select a random type
  const type = partTypes[Math.floor(Math.random() * partTypes.length)];
  
  // For certain types like alarms, tools, accessories - pipe size may not be applicable
  let pipeSize = pipeSizes[Math.floor(Math.random() * pipeSizes.length)];
  if (['Alarm', 'Tool', 'Accessory'].includes(type)) {
    pipeSize = 'N/A';
  }
  
  // Generate a unique item code
  const itemCode = generateItemCode(type, index);
  
  // Generate description
  const description = generateDescription(type, pipeSize);
  
  // Base price depends on part type
  let basePrice = 0;
  switch (type) {
    case 'Sprinkler':
      basePrice = 10 + Math.random() * 40; // $10-$50
      break;
    case 'Fitting':
      basePrice = 2 + Math.random() * 18; // $2-$20
      break;
    case 'Valve':
      basePrice = 25 + Math.random() * 175; // $25-$200
      break;
    case 'Monitor':
      basePrice = 15 + Math.random() * 85; // $15-$100
      break;
    case 'Alarm':
      basePrice = 30 + Math.random() * 170; // $30-$200
      break;
    case 'Connection':
      basePrice = 50 + Math.random() * 150; // $50-$200
      break;
    case 'Pipe':
      basePrice = 5 + Math.random() * 45; // $5-$50
      break;
    case 'Hose':
      basePrice = 40 + Math.random() * 110; // $40-$150
      break;
    case 'Tool':
      basePrice = 15 + Math.random() * 85; // $15-$100
      break;
    case 'Accessory':
      basePrice = 5 + Math.random() * 45; // $5-$50
      break;
    default:
      basePrice = 10 + Math.random() * 40; // $10-$50
  }
  
  // Round to two decimal places
  basePrice = Math.round(basePrice * 100) / 100;
  
  // Vary the price tiers
  const priceT3 = basePrice;
  const priceT2 = Math.round((basePrice * 0.9) * 100) / 100; // 10% discount
  const priceT1 = Math.round((basePrice * 0.8) * 100) / 100; // 20% discount
  
  // Random stock level
  const inStock = Math.floor(Math.random() * 200) + 10;
  
  // Mark as popular (will set 50% of parts as popular)
  const isPopular = index < 50;
  
  // Generate image path
  const image = generateImagePath(type, itemCode);
  
  return {
    item_code: itemCode,
    pipe_size: pipeSize,
    description,
    type,
    price_t1: priceT1,
    price_t2: priceT2,
    price_t3: priceT3,
    in_stock: inStock,
    is_popular: isPopular,
    image
  };
}

// Main function to seed the database with parts
async function seedParts() {
  console.log('Starting to seed parts...');
  
  // Check current part count
  const existingParts = await db.select({ count: { expression: 'COUNT(*)' } }).from(parts);
  const currentCount = Number(existingParts[0].count);
  console.log(`Current part count: ${currentCount}`);
  
  // Generate and insert new parts
  for (let i = 0; i < 100; i++) {
    const part = await generatePart(i);
    
    try {
      // Check if item code already exists
      const existing = await db.select().from(parts).where(eq(parts.item_code, part.item_code));
      
      if (existing.length === 0) {
        // Insert new part
        await db.insert(parts).values(part);
        console.log(`Added part: ${part.item_code} - ${part.description}`);
      } else {
        // If item code already exists, modify it and try again
        part.item_code = `${part.item_code}-${Math.floor(Math.random() * 100)}`;
        await db.insert(parts).values(part);
        console.log(`Added part with modified code: ${part.item_code} - ${part.description}`);
      }
    } catch (error) {
      console.error(`Error adding part ${part.item_code}:`, error);
    }
  }
  
  // Check new part count
  const newPartsCount = await db.select({ count: { expression: 'COUNT(*)' } }).from(parts);
  const updatedCount = Number(newPartsCount[0].count);
  
  console.log(`Seeding complete. Updated part count: ${updatedCount}`);
  console.log(`Added ${updatedCount - currentCount} new parts.`);
}

// Run the seeding process
seedParts().catch((error) => {
  console.error('Error seeding parts:', error);
  process.exit(1);
}).finally(() => {
  console.log('Seed script completed.');
});