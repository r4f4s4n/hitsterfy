import React from 'react';

const PauseButton = ({ onClick, size = 'large' }) => {
  const sizeClasses = size === 'large' 
    ? 'w-48 h-48 text-5xl' 
    : 'w-16 h-16 text-2xl';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} bg-spotify-green text-white rounded-full flex items-center justify-center hover:scale-105 transform transition-transform`}
      aria-label="Pausar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-24 h-24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
};

export default PauseButton;