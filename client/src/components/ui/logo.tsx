import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 50, className = "" }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fire icon */}
        <path 
          d="M12 22C16.4183 22 20 18.4183 20 14C20 11 18 8.5 17 7.5C17 9.5 15.5 10 15 10.5C14.4851 9.55454 14 7 14 7C13 8 11.5 10 11.5 12C10.5 11 9.5 8.5 9.5 7.5C9 8.5 8 11 8 13C8 15 9 16.5 10 17C9 16.5 7.5 15.5 7 14C6 16 7 18.5 8 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.3"
        />
        
        {/* Hydrant base */}
        <path 
          d="M8.5 14V19C8.5 20.1046 9.39543 21 10.5 21H13.5C14.6046 21 15.5 20.1046 15.5 19V14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Hydrant top */}
        <path 
          d="M10 11C10 9.34315 11.3431 8 13 8H14C15.6569 8 17 9.34315 17 11V14H10V11Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fillOpacity="0.2"
          fill="currentColor"
        />
        
        {/* Connections */}
        <path 
          d="M7 15H8.5M17 15H15.5" 
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute -top-1 -right-1 text-xs font-bold tracking-tighter">F3</span>
    </div>
  );
};

export default Logo;
