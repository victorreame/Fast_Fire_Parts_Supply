import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 50, className = "" }) => {
  // Using the fire hydrant logo
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ objectFit: "contain" }}
      >
        {/* Fire hydrant body */}
        <rect x="80" y="60" width="80" height="120" fill="white" rx="5" />
        <rect x="75" y="60" width="90" height="15" fill="white" rx="5" />
        <rect x="75" y="165" width="90" height="15" fill="white" rx="5" />
        
        {/* Side connectors */}
        <rect x="60" y="100" width="20" height="20" fill="white" rx="5" />
        <rect x="160" y="100" width="20" height="20" fill="white" rx="5" />
        
        {/* Cap */}
        <path d="M120 40 L100 60 L140 60 Z" fill="white" />
        <ellipse cx="120" cy="45" rx="15" ry="10" fill="white" />
        
        {/* Red accent parts */}
        <circle cx="120" cy="110" r="20" stroke="#E63946" strokeWidth="6" fill="none" />
        <circle cx="120" cy="110" r="8" fill="#E63946" />
        <line x1="120" y1="135" x2="120" y2="160" stroke="#E63946" strokeWidth="6" />
        <line x1="105" y1="135" x2="105" y2="160" stroke="#E63946" strokeWidth="6" />
        <line x1="135" y1="135" x2="135" y2="160" stroke="#E63946" strokeWidth="6" />
        <path d="M85 65 Q 100 55 110 65" stroke="#E63946" strokeWidth="4" fill="none" />
        
        {/* Water spray */}
        <path d="M160 100 Q 180 80 200 90" stroke="#4CC9F0" strokeWidth="4" fill="none" />
        <path d="M160 100 Q 190 100 210 110" stroke="#4CC9F0" strokeWidth="4" fill="none" />
        <path d="M160 105 Q 185 120 200 130" stroke="#4CC9F0" strokeWidth="4" fill="none" />
        <circle cx="195" cy="90" r="3" fill="#4CC9F0" />
        <circle cx="205" cy="110" r="3" fill="#4CC9F0" />
        <circle cx="195" cy="130" r="3" fill="#4CC9F0" />
        <circle cx="185" cy="115" r="2" fill="#4CC9F0" />
        <circle cx="190" cy="100" r="2" fill="#4CC9F0" />
      </svg>
    </div>
  );
};

export default Logo;
