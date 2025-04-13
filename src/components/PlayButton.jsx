import React from 'react';

const PlayButton = ({ onClick, size = 'large' }) => {
  const sizeClasses = size === 'large' 
    ? 'w-24 h-24 text-4xl' 
    : 'w-16 h-16 text-2xl';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} bg-spotify-green text-white rounded-full flex items-center justify-center hover:scale-105 transform transition-transform`}
      aria-label="Reproducir"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
};

export default PlayButton;