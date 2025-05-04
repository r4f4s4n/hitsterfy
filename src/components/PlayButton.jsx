import React from 'react';

const PlayButton = ({ onClick, size = 'large' }) => {
  const sizeClasses = size === 'large' 
    ? 'w-48 h-48' 
    : 'w-16 h-16';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-full flex items-center justify-center hover:scale-105 transform transition-transform`}
      aria-label="Reproducir"
    >
      <svg viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id="darkGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </radialGradient>
          <linearGradient id="subtleGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#19a349" />
            <stop offset="100%" stopColor="#15864d" />
          </linearGradient>
          <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#333333" />
            <stop offset="100%" stopColor="#1e1e1e" />
          </linearGradient>
          <clipPath id="circleClip">
            <circle cx="84" cy="84" r="26" />
          </clipPath>
        </defs>
        
        <circle cx="84" cy="84" r="84" fill="url(#darkGradient)"/>
        
        <g>
          <circle cx="84" cy="84" r="26" fill="url(#subtleGreen)" />
          
          <g clipPath="url(#circleClip)">
            <path d="M84 70
                   C101 70, 116 78, 124 92
                   C115 79, 101 72, 84 72
                   C67 72, 53 79, 45 92
                   C52 78, 67 70, 84 70Z" 
                fill="#0a0a0a" fillOpacity="0.15" stroke="none"/>
            
            <path d="M84 82
                   C96 82, 106 87, 112 97
                   C105 88, 96 84, 84 84
                   C72 84, 63 88, 57 97
                   C62 87, 72 82, 84 82Z" 
                fill="#0a0a0a" fillOpacity="0.15" stroke="none"/>
            
            <path d="M84 94
                   C91 94, 98 97, 101 103
                   C97 98, 91 96, 84 96
                   C77 96, 71 98, 68 103
                   C70 97, 77 94, 84 94Z" 
                fill="#0a0a0a" fillOpacity="0.15" stroke="none"/>
          </g>
          
          <path d="M77,72 C75.5,71 74,71.5 74,74 V94 C74,96.5 75.5,97 77,96 L97,86 C98.5,85 98.5,83 97,82 L77,72Z" 
                fill="url(#playGradient)" />
        </g>
      </svg>
    </button>
  );
};

export default PlayButton;