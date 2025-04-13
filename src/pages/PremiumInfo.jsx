import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const PremiumInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="bg-spotify-black bg-opacity-50 p-8 rounded-lg border border-gray-700 max-w-2xl w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">Se requiere Spotify Premium</h1>
          
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Para utilizar Hitsterfy y disfrutar de la reproducción completa de canciones, necesitas una cuenta Premium de Spotify.
            </p>
            
            <p className="text-gray-300 mb-4">
              La API de Spotify Web Playback SDK, que usamos para reproducir canciones completas dentro de la aplicación, solo funciona con cuentas Premium.
            </p>
            
            <p className="text-gray-300 mb-4">
              Si ya tienes una cuenta Premium de Spotify, puedes continuar con la configuración de la aplicación.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="https://www.spotify.com/premium/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Obtener Spotify Premium
            </a>
            
            <button
              onClick={() => navigate('/config')}
              className="btn btn-secondary"
            >
              Continuar con configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumInfo;