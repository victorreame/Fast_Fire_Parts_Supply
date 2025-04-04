import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory if it doesn't exist
const partsDir = path.join(__dirname, '../public/assets/parts');
if (!fs.existsSync(partsDir)) {
  fs.mkdirSync(partsDir, { recursive: true });
}

// Generate parts SVGs
const parts = [
  {
    id: 1,
    name: 'Valve',
    itemCode: 'VLV-243',
    color: '#E23D28',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect x="50" y="80" width="100" height="40" fill="#ddd" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="100" r="30" fill="#E23D28" stroke="#333" stroke-width="2" />
        <rect x="85" y="20" width="30" height="60" fill="#ddd" stroke="#333" stroke-width="2" />
        <rect x="85" y="120" width="30" height="60" fill="#ddd" stroke="#333" stroke-width="2" />
        <line x1="100" y1="70" x2="100" y2="130" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="100" r="15" fill="#fff" stroke="#333" stroke-width="1" />
        <circle cx="100" cy="100" r="5" fill="#333" />
      </svg>
    `,
  },
  {
    id: 2,
    name: 'Sprinkler Head',
    itemCode: 'SPK-567',
    color: '#1E90FF',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="15" fill="#ddd" stroke="#333" stroke-width="2" />
        <rect x="85" y="115" width="30" height="20" fill="#ddd" stroke="#333" stroke-width="2" />
        <rect x="85" y="135" width="30" height="5" fill="#333" />
        <path d="M 85 100 Q 60 70 40 80 Q 60 130 85 100" fill="#1E90FF" stroke="#333" stroke-width="1" />
        <path d="M 115 100 Q 140 70 160 80 Q 140 130 115 100" fill="#1E90FF" stroke="#333" stroke-width="1" />
        <circle cx="100" cy="100" r="5" fill="#333" />
      </svg>
    `,
  },
  {
    id: 3,
    name: 'Pipe Fitting',
    itemCode: 'FIT-789',
    color: '#FFD700',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <path d="M 50 100 L 80 100 L 80 60 L 120 60 L 120 100 L 150 100" fill="none" stroke="#333" stroke-width="8" />
        <circle cx="50" cy="100" r="10" fill="#FFD700" stroke="#333" stroke-width="2" />
        <circle cx="150" cy="100" r="10" fill="#FFD700" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="60" r="10" fill="#FFD700" stroke="#333" stroke-width="2" />
      </svg>
    `,
  },
  {
    id: 4,
    name: 'Flow Switch',
    itemCode: 'FSW-321',
    color: '#20B2AA',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect x="40" y="80" width="120" height="40" fill="#ddd" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="100" r="20" fill="#20B2AA" stroke="#333" stroke-width="2" />
        <rect x="95" y="40" width="10" height="40" fill="#333" />
        <rect x="80" y="30" width="40" height="10" fill="#333" />
        <rect x="60" y="95" width="80" height="10" fill="#fff" stroke="#333" stroke-width="1" />
      </svg>
    `,
  },
  {
    id: 5,
    name: 'Pressure Gauge',
    itemCode: 'PGE-654',
    color: '#4169E1',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="40" fill="#fff" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="100" r="35" fill="#4169E1" stroke="#333" stroke-width="1" />
        <circle cx="100" cy="100" r="30" fill="#fff" stroke="#333" stroke-width="1" />
        <circle cx="100" cy="100" r="5" fill="#333" />
        <line x1="100" y1="100" x2="75" y2="125" stroke="#333" stroke-width="2" />
        <line x1="80" y1="80" x2="100" y2="100" stroke="red" stroke-width="2" />
        <rect x="95" y="140" width="10" height="20" fill="#333" />
      </svg>
    `,
  },
  {
    id: 6,
    name: 'Fire Alarm Pull',
    itemCode: 'ALP-987',
    color: '#DC143C',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect x="60" y="50" width="80" height="100" rx="5" ry="5" fill="#DC143C" stroke="#333" stroke-width="2" />
        <rect x="70" y="60" width="60" height="40" rx="2" ry="2" fill="#fff" stroke="#333" stroke-width="1" />
        <rect x="80" y="110" width="40" height="30" rx="2" ry="2" fill="#333" />
        <text x="100" y="80" font-size="14" text-anchor="middle" fill="#333">PULL</text>
        <line x1="85" y1="130" x2="115" y2="120" stroke="#fff" stroke-width="2" />
      </svg>
    `,
  },
  {
    id: 7,
    name: 'Coupling',
    itemCode: 'CPL-135',
    color: '#FF8C00',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect x="40" y="80" width="120" height="40" fill="#ddd" stroke="#333" stroke-width="2" />
        <rect x="60" y="80" width="80" height="40" fill="#FF8C00" stroke="#333" stroke-width="2" />
        <rect x="70" y="75" width="60" height="50" fill="#FF8C00" stroke="#333" stroke-width="1" />
        <line x1="80" y1="80" x2="80" y2="120" stroke="#333" stroke-width="1" />
        <line x1="100" y1="80" x2="100" y2="120" stroke="#333" stroke-width="1" />
        <line x1="120" y1="80" x2="120" y2="120" stroke="#333" stroke-width="1" />
      </svg>
    `,
  },
  {
    id: 8,
    name: 'Check Valve',
    itemCode: 'CHV-246',
    color: '#9370DB',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect x="40" y="80" width="120" height="40" fill="#ddd" stroke="#333" stroke-width="2" />
        <rect x="90" y="75" width="20" height="50" fill="#9370DB" stroke="#333" stroke-width="1" />
        <polyline points="60,100 90,75 90,125 60,100" fill="#fff" stroke="#333" stroke-width="1" />
        <line x1="110" y1="80" x2="140" y2="100" stroke="#333" stroke-width="1" />
        <line x1="110" y1="120" x2="140" y2="100" stroke="#333" stroke-width="1" />
      </svg>
    `,
  },
  {
    id: 9,
    name: 'Fire Dept Connection',
    itemCode: 'FDC-159',
    color: '#CD5C5C',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect x="70" y="40" width="60" height="120" rx="5" ry="5" fill="#ddd" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="70" r="15" fill="#CD5C5C" stroke="#333" stroke-width="2" />
        <circle cx="100" cy="110" r="15" fill="#CD5C5C" stroke="#333" stroke-width="2" />
        <text x="100" y="75" font-size="14" text-anchor="middle" fill="#fff">FD</text>
        <text x="100" y="115" font-size="14" text-anchor="middle" fill="#fff">FD</text>
        <rect x="85" y="160" width="30" height="20" fill="#333" />
      </svg>
    `,
  },
  {
    id: 10,
    name: 'Fire Hose',
    itemCode: 'HSE-753',
    color: '#FF4500',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <path d="M 40,100 Q 60,60 100,60 Q 140,60 160,100" fill="none" stroke="#FF4500" stroke-width="12" />
        <circle cx="40" cy="100" r="15" fill="#ddd" stroke="#333" stroke-width="2" />
        <circle cx="160" cy="100" r="15" fill="#ddd" stroke="#333" stroke-width="2" />
        <circle cx="40" cy="100" r="8" fill="#333" />
        <circle cx="160" cy="100" r="8" fill="#333" />
      </svg>
    `,
  },
];

// Write each part SVG to a file
parts.forEach(part => {
  fs.writeFileSync(
    path.join(partsDir, `${part.itemCode}.svg`),
    part.svg.trim()
  );
  console.log(`Generated ${part.itemCode}.svg`);
});

console.log('All part images generated successfully!');