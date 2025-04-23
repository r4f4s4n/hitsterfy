import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpotify } from '../context/SpotifyContext';
import { saveSpotifyConfig } from '../services/supabase';
import { getSpotifyAuthUrl, SPOTIFY_CONFIG } from '../services/app-config';
import Header from '../components/Header';
import ConfirmationDialog from '../components/ConfirmationDialog';

const Config = () => {
  const { user } = useAuth();
  const { spotifyService, isConfigured, refreshConnection } = useSpotify();
  const navigate = useNavigate();

  const [refreshToken, setRefreshToken] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Verificar si estamos recibiendo el código de autorización por URL
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        setAuthCode(code);
        handleCompleteAuth(code);
        // Limpiar la URL para evitar problemas al recargar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Iniciar flujo de autorización
  const startAuthFlow = () => {
    const authUrl = getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  // Continuar con el flujo de autorización después de obtener el código
  const handleCompleteAuth = async (code) => {
    if (!code) {
      setError('No se encontró el código de autorización');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Configurar el servicio con las credenciales globales
      spotifyService.setCredentials(
        SPOTIFY_CONFIG.clientId, 
        SPOTIFY_CONFIG.clientSecret, 
        null
      );
      
      console.log("Iniciando proceso de obtención de token con código:", code);
      
      // Obtener el token de actualización usando el código de autorización
      const tokenData = await spotifyService.getRefreshToken(code, SPOTIFY_CONFIG.redirectUri);
      
      if (!tokenData.refresh_token) {
        throw new Error('No se pudo obtener el refresh token');
      }

      console.log("Token obtenido exitosamente");
      setRefreshToken(tokenData.refresh_token);
      
      console.log("Guardando configuración para usuario:", user.id);
      
      // Guardar solo el refresh token en la base de datos
      const { data, error: saveError } = await saveSpotifyConfig(
        user.id,
        SPOTIFY_CONFIG.clientId,
        SPOTIFY_CONFIG.clientSecret,
        tokenData.refresh_token
      );
      
      if (saveError) {
        console.error("Error al guardar configuración:", saveError);
        throw new Error('Error al guardar la configuración: ' + saveError.message);
      }
      
      console.log("Configuración guardada exitosamente:", data);

      // Probar la conexión
      const testResult = await refreshConnection();
      console.log("Resultado de prueba de conexión:", testResult);
      
      if (testResult.success) {
        setSuccess(true);
        // Esperar un momento y luego redirigir
        setTimeout(() => {
          navigate('/playlist');
        }, 1500);
        setError('Conexión establecida pero no se pudo acceder a Spotify: ' + testResult.error);
      } else if (testResult.errorType === 'USER_NOT_REGISTERED') {
        setError(
          <div className="text-center">
            <p>{testResult.error}</p>
            <p className="mt-2">
              <a 
                href="https://developer.spotify.com/documentation/web-api/concepts/quota-modes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-spotify-green underline"
              >
                Más información sobre restricciones de desarrollo de Spotify
              </a>
            </p>
          </div>
        );
      } else {
        setError('No se pudo conectar con Spotify: ' + testResult.error);
      }
    } catch (err) {
      console.error("Error en handleCompleteAuth:", err);
      setError('Error durante la autorización: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-spotify-black to-gray-900 overflow-hidden">
      <Header />
      
      <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-60px)]">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Configuración de Spotify</h1>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-3 rounded mb-4">
              ¡Conexión con Spotify establecida correctamente! Redirigiendo...
            </div>
          )}

          <div className="bg-spotify-black bg-opacity-40 p-5 rounded-lg border border-gray-700 mb-4">
            <h2 className="text-xl font-semibold mb-4">Conectar con Spotify</h2>
            
            <p className="text-gray-300 mb-4 text-sm">
              Para usar Hitsterfy, necesitas conectar tu cuenta de Spotify. Al autorizar la aplicación, 
              podrás acceder a tus playlists y reproducir música.
            </p>
            
            {!isConfigured ? (
              <button
                onClick={startAuthFlow}
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Conectando...' : 'Conectar con Spotify'}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-3 py-2 rounded text-sm">
                  ✓ Cuenta de Spotify conectada
                </div>
                
                <button
                  onClick={startAuthFlow}
                  className="btn btn-secondary text-sm py-2"
                  disabled={loading}
                >
                  Volver a conectar
                </button>
              </div>
            )}
          </div>

          <div className="bg-spotify-black bg-opacity-40 p-5 rounded-lg border border-gray-700 mb-4">
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

export default Config;