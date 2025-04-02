import React from "react";

interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, color = "currentColor", className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 5C13.925 5 9 9.925 9 16V24C9 24.552 9.448 25 10 25H14V16C14 12.686 16.686 10 20 10C23.314 10 26 12.686 26 16V25H30C30.552 25 31 24.552 31 24V16C31 9.925 26.075 5 20 5Z"
        fill={color}
      />
      <path
        d="M20 28C21.105 28 22 27.105 22 26V16C22 15.448 21.552 15 21 15C20.448 15 20 15.448 20 16V26C20 26.552 19.552 27 19 27C18.448 27 18 26.552 18 26V16C18 15.448 17.552 15 17 15C16.448 15 16 15.448 16 16V26C16 27.105 16.895 28 18 28H20Z"
        fill={color}
      />
      <path
        d="M20 30C19.448 30 19 30.448 19 31V33C19 33.552 19.448 34 20 34C20.552 34 21 33.552 21 33V31C21 30.448 20.552 30 20 30Z"
        fill={color}
      />
      <path
        d="M20 35C19.448 35 19 35.448 19 36V38C19 38.552 19.448 39 20 39C20.552 39 21 38.552 21 38V36C21 35.448 20.552 35 20 35Z"
        fill={color}
      />
    </svg>
  );
};

export default Logo;
