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
      <img
        src="/assets/firelogo.png"
        alt="FastFire Parts Logo"
        style={{ 
          width: size * 1.5, 
          height: size * 1.5, 
          objectFit: "contain",
          filter: "brightness(0) invert(1)" // Makes the logo white for use on red background
        }}
      />
    </div>
  );
};

export default Logo;
