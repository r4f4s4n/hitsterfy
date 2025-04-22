import React from 'react';

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-spotify-black border border-gray-700 rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in">
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button 
            onClick={onCancel}
            className="btn bg-gray-700 text-white hover:bg-gray-600 transition-colors sm:order-1"
          >
            No
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-primary sm:order-2"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;