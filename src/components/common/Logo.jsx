import React from 'react';

const Logo = ({ size = 'medium', dark = true }) => {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-12',
  };
  
  const textColor = dark ? 'text-neutral-900' : 'text-white';
  
  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <svg
        className="h-full w-auto"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="#0c8be0" />
        <path
          d="M11 20C11 15.0294 15.0294 11 20 11C24.9706 11 29 15.0294 29 20"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M29 20C29 24.9706 24.9706 29 20 29C15.0294 29 11 24.9706 11 20"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 5"
        />
        <circle cx="20" cy="20" r="3" fill="white" />
      </svg>
      <span className={`ml-2 font-bold text-lg md:text-xl ${textColor}`}>
        AutoParts
      </span>
    </div>
  );
};

export default Logo;
