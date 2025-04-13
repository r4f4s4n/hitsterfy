import React from 'react';

const RevealButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 bg-yellow-400 text-black font-bold rounded-md hover:bg-yellow-500 transition"
      aria-label="Revelar"
    >
      <div className="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>REVELAR</span>
      </div>
    </button>
  );
};

export default RevealButton;