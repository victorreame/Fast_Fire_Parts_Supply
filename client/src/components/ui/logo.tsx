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
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fire Hydrant Body */}
      <path
        d="M15 12H25C26.1046 12 27 12.8954 27 14V30C27 31.1046 26.1046 32 25 32H15C13.8954 32 13 31.1046 13 30V14C13 12.8954 13.8954 12 15 12Z"
        fill={color}
      />
      
      {/* Hydrant Cap */}
      <path
        d="M14 8H26C27.1046 8 28 8.89543 28 10V12C28 12.5523 27.5523 13 27 13H13C12.4477 13 12 12.5523 12 12V10C12 8.89543 12.8954 8 14 8Z"
        fill={color}
      />
      
      {/* Hydrant Base */}
      <path
        d="M12 29C12 28.4477 12.4477 28 13 28H27C27.5523 28 28 28.4477 28 29V31C28 32.1046 27.1046 33 26 33H14C12.8954 33 12 32.1046 12 31V29Z"
        fill={color}
      />
      
      {/* Left Outlet Cap */}
      <circle cx="9" cy="20" r="3" fill={color} />
      
      {/* Left Outlet */}
      <path
        d="M13 18H10C9.44772 18 9 18.4477 9 19V21C9 21.5523 9.44772 22 10 22H13V18Z"
        fill={color}
      />
      
      {/* Right Outlet Cap */}
      <circle cx="31" cy="20" r="3" fill={color} />
      
      {/* Right Outlet */}
      <path
        d="M27 18H30C30.5523 18 31 18.4477 31 19V21C31 21.5523 30.5523 22 30 22H27V18Z"
        fill={color}
      />
      
      {/* Bolts/Detail */}
      <circle cx="15" cy="16" r="1" fill="white" />
      <circle cx="15" cy="24" r="1" fill="white" />
      <circle cx="25" cy="16" r="1" fill="white" />
      <circle cx="25" cy="24" r="1" fill="white" />
      
      {/* Water Drop */}
      <path
        d="M20 32C20 32 17 35 17 37.5C17 39.433 18.343 41 20 41C21.657 41 23 39.433 23 37.5C23 35 20 32 20 32Z"
        fill="#3B82F6" 
      />
      
      {/* Small Drips */}
      <circle cx="19" cy="42" r="0.5" fill="#3B82F6" />
      <circle cx="21" cy="43" r="0.7" fill="#3B82F6" />
    </svg>
  );
};

export default Logo;
