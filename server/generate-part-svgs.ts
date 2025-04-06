import fs from 'fs';
import path from 'path';

// Create SVG templates for each part type
function generatePartSvgs() {
  const partTypes = [
    'sprinkler',
    'valve',
    'fitting',
    'monitor',
    'alarm',
    'connection',
    'pipe',
    'hose',
    'tool',
    'accessory'
  ];

  // Create directory if it doesn't exist
  const svgDir = path.join(process.cwd(), 'public/assets/parts');
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
  }

  partTypes.forEach(type => {
    const svgPath = path.join(svgDir, `template-${type}.svg`);
    
    // Skip if the template already exists
    if (fs.existsSync(svgPath)) {
      console.log(`Template for ${type} already exists, skipping.`);
      return;
    }
    
    // Create a unique SVG for each part type
    let svgContent = '';
    
    // Different SVG designs based on part type
    switch (type) {
      case 'sprinkler':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <circle cx="50" cy="50" r="35" fill="#fafafa" stroke="#d32f2f" stroke-width="1" />
          <circle cx="50" cy="50" r="10" fill="#d32f2f" />
          <path d="M50,5 L50,20 M5,50 L20,50 M50,95 L50,80 M95,50 L80,50" stroke="#d32f2f" stroke-width="3" />
          <path d="M20,20 L35,35 M20,80 L35,65 M80,20 L65,35 M80,80 L65,65" stroke="#d32f2f" stroke-width="2" />
        </svg>`;
        break;
        
      case 'valve':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="40" width="80" height="20" fill="#d32f2f" rx="5" ry="5" />
          <circle cx="50" cy="50" r="25" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <circle cx="50" cy="50" r="18" fill="#fafafa" stroke="#d32f2f" stroke-width="1" />
          <rect x="48" y="10" width="4" height="40" fill="#d32f2f" />
          <circle cx="50" cy="50" r="5" fill="#d32f2f" />
        </svg>`;
        break;
        
      case 'fitting':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="40,20 60,20 70,50 60,80 40,80 30,50" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <line x1="0" y1="50" x2="30" y2="50" stroke="#d32f2f" stroke-width="4" />
          <line x1="70" y1="50" x2="100" y2="50" stroke="#d32f2f" stroke-width="4" />
          <circle cx="50" cy="50" r="10" fill="#fafafa" stroke="#d32f2f" stroke-width="1" />
        </svg>`;
        break;
        
      case 'monitor':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="30" width="80" height="40" rx="5" ry="5" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <rect x="20" y="40" width="60" height="20" rx="2" ry="2" fill="#fafafa" stroke="#d32f2f" stroke-width="1" />
          <circle cx="30" cy="50" r="5" fill="#d32f2f" />
          <circle cx="50" cy="50" r="5" fill="#d32f2f" />
          <circle cx="70" cy="50" r="5" fill="#d32f2f" />
          <line x1="0" y1="50" x2="10" y2="50" stroke="#d32f2f" stroke-width="3" />
          <line x1="90" y1="50" x2="100" y2="50" stroke="#d32f2f" stroke-width="3" />
        </svg>`;
        break;
        
      case 'alarm':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <path d="M30,30 L70,30 L70,70 L30,70 Z" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <circle cx="50" cy="50" r="15" fill="#d32f2f" />
          <path d="M20,20 L30,30 M80,20 L70,30 M20,80 L30,70 M80,80 L70,70" stroke="#d32f2f" stroke-width="2" />
        </svg>`;
        break;
        
      case 'connection':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <path d="M20,40 L40,40 L40,60 L20,60 Z" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <path d="M60,40 L80,40 L80,60 L60,60 Z" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <line x1="40" y1="50" x2="60" y2="50" stroke="#d32f2f" stroke-width="3" />
          <line x1="0" y1="50" x2="20" y2="50" stroke="#d32f2f" stroke-width="3" />
          <line x1="80" y1="50" x2="100" y2="50" stroke="#d32f2f" stroke-width="3" />
        </svg>`;
        break;
        
      case 'pipe':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="40" width="80" height="20" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" rx="5" ry="5" />
          <line x1="0" y1="50" x2="10" y2="50" stroke="#d32f2f" stroke-width="3" />
          <line x1="90" y1="50" x2="100" y2="50" stroke="#d32f2f" stroke-width="3" />
        </svg>`;
        break;
        
      case 'hose':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,30 C30,30 30,70 50,70 C70,70 70,30 90,30" fill="none" stroke="#d32f2f" stroke-width="8" stroke-linecap="round" />
          <circle cx="10" cy="30" r="5" fill="#f0f0f0" stroke="#d32f2f" stroke-width="1" />
          <circle cx="90" cy="30" r="5" fill="#f0f0f0" stroke="#d32f2f" stroke-width="1" />
        </svg>`;
        break;
        
      case 'tool':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <path d="M20,20 L80,20 L80,30 L60,30 L60,80 L40,80 L40,30 L20,30 Z" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <rect x="40" y="30" width="20" height="10" fill="#d32f2f" />
        </svg>`;
        break;
        
      case 'accessory':
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="30" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <circle cx="50" cy="50" r="20" fill="#fafafa" stroke="#d32f2f" stroke-width="1" />
          <path d="M50,20 L50,30 M30,50 L20,50 M50,80 L50,70 M70,50 L80,50" stroke="#d32f2f" stroke-width="2" />
          <path d="M35,35 L42,42 M35,65 L42,58 M65,35 L58,42 M65,65 L58,58" stroke="#d32f2f" stroke-width="1" />
        </svg>`;
        break;
        
      default:
        svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" fill="#f0f0f0" stroke="#d32f2f" stroke-width="2" />
          <text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="#d32f2f">${type}</text>
        </svg>`;
    }
    
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created template for ${type}`);
  });
  
  console.log('All part type templates generated.');
}

generatePartSvgs();