import React from "react";

interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, color = "#E23D28", className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fire Hydrant Top */}
      <path 
        d="M50 10C54 10 56 12 56 15C56 17 53 18 50 18C47 18 44 17 44 15C44 12 46 10 50 10Z" 
        fill={color} 
      />
      
      {/* Hydrant Cap */}
      <path 
        d="M45 18C42.5 19 41 20 41 22.5C41 25 59 25 59 22.5C59 20 57.5 19 55 18"
        fill={color} 
      />
      
      {/* Hydrant Dome */}
      <path 
        d="M42 22.5C39 24 37 26 37 30C37 34 63 34 63 30C63 26 61 24 58 22.5"
        fill={color}
      />
      
      {/* Main Body */}
      <path 
        d="M39 30L39 70C39 73 43 75 50 75C57 75 61 73 61 70L61 30"
        fill={color}
      />
      
      {/* Middle Section/Side Ports */}
      <path
        d="M39 43L39 57C39 57 35 56 30 56C25 56 25 50 30 50C35 50 39 49 39 49L39 43Z"
        fill={color}
      />
      <path
        d="M61 43L61 57C61 57 65 56 70 56C75 56 75 50 70 50C65 50 61 49 61 49L61 43Z"
        fill={color}
      />
      
      {/* Valve Connectors Details */}
      <circle cx="27" cy="53" r="6" fill={color} />
      <circle cx="73" cy="53" r="6" fill={color} />
      
      {/* Valve Highlights */}
      <circle cx="27" cy="53" r="2.5" fill="white" />
      <circle cx="73" cy="53" r="2.5" fill="white" />
      
      {/* Base */}
      <path
        d="M39 70C39 70 37 73 37 75C37 77 63 77 63 75C63 73 61 70 61 70"
        fill={color}
      />
      
      {/* Bottom Connector */}
      <path
        d="M39 75L39 77C39 80 61 80 61 77L61 75"
        fill={color}
      />
      
      {/* Water Drip Base */}
      <path 
        d="M50 80C50 80 45 86 45 90C45 94 55 94 55 90C55 86 50 80 50 80Z" 
        fill="#1E90FF" 
      />
      
      {/* Water Drops */}
      <path 
        d="M45 87C45 87 42 90 42 93C42 95 48 95 48 93C48 90 45 87 45 87Z" 
        fill="#1E90FF" 
      />
      
      <path 
        d="M56 90C56 90 54 92 54 94C54 95 58 95 58 94C58 92 56 90 56 90Z" 
        fill="#1E90FF" 
      />
      
      <circle cx="52" cy="95" r="2" fill="#1E90FF" />
    </svg>
  );
};

export default Logo;
