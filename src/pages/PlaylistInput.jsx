import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';
import { useAuth } from '../context/AuthContext';
import { clearListenedSongs } from '../services/supabase';
import Header from '../components/Header';
import ConfirmationDialog from '../components/ConfirmationDialog';

const PlaylistInput = () => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { spotifyService, isConfigured, isConnected } = useSpotify();
  const { user } = useAuth();
  const navigate = useNavigate();

// Limpiar historial de canciones escuchadas
const handleClearHistory = async () => {
  if (!user) return;
  
  setClearingHistory(true);
  setHistoryCleared(false);
  setError(null);
  
  try {
    await clearListenedSongs(user.id);
    setHistoryCleared(true);
    setTimeout(() => {
      setHistoryCleared(false);
    }, 3000);
  } catch (err) {
    setError('Error al limpiar el historial: ' + err.message);
  } finally {
    setClearingHistory(false);
  }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!playlistUrl.trim()) {
      setError('Por favor, introduce una URL de playlist de Spotify');
      return;
    }

    // Validar la URL
    const spotifyPlaylistRegex = /^(https?:\/\/)?(open\.spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)(.*)$/;
    if (!spotifyPlaylistRegex.test(playlistUrl)) {
      setError('La URL introducida no parece ser una URL válida de playlist de Spotify');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar que estamos conectados a Spotify
      if (!isConfigured) {
        throw new Error('No has configurado tus credenciales de Spotify. Ve a la página de configuración.');
      }

      if (!isConnected) {
        throw new Error('No se pudo conectar con Spotify. Verifica tus credenciales en la configuración.');
      }

      // Intentar cargar la playlist para validar que existe y tenemos acceso
      await spotifyService.getPlaylist(playlistUrl);
      
      // Guardar la URL en sessionStorage para usarla en la página de reproducción
      sessionStorage.setItem('currentPlaylist', playlistUrl);
      
      // Redirigir a la página de reproducción
      navigate('/player');
    } catch (err) {
      console.error('Error al cargar la playlist:', err);
      setError(`Error al cargar la playlist: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar diálogo de confirmación
  const showDeleteConfirmation = () => {
    setShowConfirmDialog(true);
  };

  // Cancelar la eliminación
  const handleCancelClear = () => {
    setShowConfirmDialog(false);
  };

  // Confirmar y ejecutar la eliminación
  const handleConfirmClear = async () => {
    setShowConfirmDialog(false);
    
    if (!user) return;
    
    setClearingHistory(true);
    setHistoryCleared(false);
    setError(null);
    
    try {
      await clearListenedSongs(user.id);
      setHistoryCleared(true);
      setTimeout(() => {
        setHistoryCleared(false);
      }, 3000);
    } catch (err) {
      setError('Error al limpiar el historial: ' + err.message);
    } finally {
      setClearingHistory(false);
    }
  };

  // Si no está configurado o conectado, mostrar mensaje y botón para ir a configuración
  if (!isConfigured || !isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <div className="bg-spotify-black bg-opacity-50 p-6 rounded-lg border border-gray-700 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-center">Configuración necesaria</h1>
            
            <p className="text-gray-300 mb-6 text-center">
              {!isConfigured 
                ? 'Necesitas configurar tus credenciales de Spotify para usar la aplicación.'
                : 'No se pudo conectar con Spotify. Verifica tus credenciales.'}
            </p>
            
            <button
              onClick={() => navigate('/config')}
              className="btn btn-primary w-full"
            >
              Ir a Configuración
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8 text-center">Selecciona una playlist</h1>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {historyCleared && (
            <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-3 rounded mb-6">
              Historial de canciones escuchadas borrado correctamente.
            </div>
          )}

          <div className="bg-spotify-black bg-opacity-50 p-6 rounded-lg border border-gray-700">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="playlistUrl" className="block text-sm font-medium text-gray-300 mb-2">
                  URL de Playlist de Spotify
                </label>
                <input
                  id="playlistUrl"
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="input"
                  placeholder="https://open.spotify.com/playlist/..."
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pega la URL de cualquier playlist pública o una de tus playlists privadas.
                </p>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Empezar a Jugar'}
              </button>
            </form>
          </div>

          <div className="bg-spotify-black bg-opacity-50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Gestión de Historial</h2>
            <p className="text-sm text-gray-300 mb-4">
              Borra tu historial de canciones escuchadas para volver a jugar con todas las canciones de tus playlists favoritas.
            </p>
            
            <button
              onClick={showDeleteConfirmation}
              className="btn btn-secondary w-full"
              disabled={clearingHistory}
            >
              {clearingHistory ? 'Borrando...' : 'Borrar Historial de Canciones'}
            </button>
          </div>

        </div>
      </div>

      {/* Diálogo de confirmación */}
      <ConfirmationDialog 
        isOpen={showConfirmDialog}
        title="Confirmar eliminación"
        message="¿Estás seguro de querer eliminar el historial de canciones escuchadas? Esta acción no se puede deshacer."
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
      />
    </div>
  );
};

export default PlaylistInput;