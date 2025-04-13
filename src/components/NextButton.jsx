import React from 'react';

const NextButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition"
      aria-label="Siguiente canción"
    >
      <div className="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        <span>OTRA</span>
      </div>
    </button>
  );
};

export default NextButton;