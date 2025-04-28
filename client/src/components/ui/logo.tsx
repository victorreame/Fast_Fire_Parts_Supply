import React from "react";
import { Link } from "wouter";

interface LogoProps {
  size?: number;
  className?: string;
  linkTo?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 50, className = "", linkTo }) => {
  const logoPath = "/assets/firelogo.png";
  const logoComponent = (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ height: size }}
    >
      <img 
        src={logoPath} 
        alt="Fast Fire Parts Logo" 
        className="h-full object-contain"
        style={{ maxHeight: size }}
      />
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo}>
        {logoComponent}
      </Link>
    );
  }

  return logoComponent;
};

export default Logo;
