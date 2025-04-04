import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 50, className = "" }) => {
  // Using the new logo image from attached assets
  return (
    <img
      src="/assets/firelogo.png"
      alt="FastFire Parts Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
};

export default Logo;
