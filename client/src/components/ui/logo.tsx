import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  color?: string;
}

// Using an inline SVG fire hydrant icon
const Logo: React.FC<LogoProps> = ({ size = 50, className = "", color = "currentColor" }) => {
  // Convert color name to actual color if needed
  const getStrokeColor = () => {
    if (color === "primary") return "var(--primary)";
    if (color === "white") return "#ffffff";
    return color;
  };
  
  const strokeColor = getStrokeColor();
  const fillColor = strokeColor;
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Fire hydrant icon */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={strokeColor}
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Fire hydrant shape */}
        <rect x="8" y="9" width="8" height="12" fill={fillColor} stroke={strokeColor} />
        <rect x="7" y="3" width="10" height="2" fill={fillColor} stroke={strokeColor} />
        <rect x="7" y="21" width="10" height="2" fill={fillColor} stroke={strokeColor} />
        <line x1="10" y1="9" x2="10" y2="21" stroke={strokeColor} strokeWidth="1" />
        <line x1="14" y1="9" x2="14" y2="21" stroke={strokeColor} strokeWidth="1" />
        <circle cx="12" cy="13" r="2" fill={strokeColor === "var(--primary)" ? "white" : fillColor} stroke={strokeColor} />
        <line x1="5" y1="13" x2="8" y2="13" stroke={strokeColor} strokeWidth="2" />
        <line x1="16" y1="13" x2="19" y2="13" stroke={strokeColor} strokeWidth="2" />
        <path d="M19 13 C20 10, 22 12, 21 14" stroke={strokeColor} strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
};

export default Logo;
