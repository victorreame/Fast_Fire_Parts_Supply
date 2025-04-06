import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

// Using an inline base64 encoded image for guaranteed display
const Logo: React.FC<LogoProps> = ({ size = 50, className = "" }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Using a simpler placeholder fire hydrant icon that will definitely display */}
      <svg 
        width={size * 1.5} 
        height={size * 1.5} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Simple fire hydrant shape */}
        <rect x="8" y="9" width="8" height="12" fill="white" stroke="white" />
        <rect x="7" y="3" width="10" height="2" fill="white" stroke="white" />
        <rect x="7" y="21" width="10" height="2" fill="white" stroke="white" />
        <line x1="10" y1="9" x2="10" y2="21" stroke="white" strokeWidth="1" />
        <line x1="14" y1="9" x2="14" y2="21" stroke="white" strokeWidth="1" />
        <circle cx="12" cy="13" r="2" fill="white" stroke="white" />
        <line x1="5" y1="13" x2="8" y2="13" stroke="white" strokeWidth="2" />
        <line x1="16" y1="13" x2="19" y2="13" stroke="white" strokeWidth="2" />
        <path d="M19 13 C20 10, 22 12, 21 14" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
};

export default Logo;
