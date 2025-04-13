import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpotify } from '../context/SpotifyContext';
import { getSpotifyConfig, saveSpotifyConfig, clearListenedSongs } from '../services/supabase';
import Header from '../components/Header';

const Config = () => {
  const { user } = useAuth();
  const { spotifyService, isConfigured, refreshConnection } = useSpotify();
  const navigate = useNavigate();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);

  // Cargar configuración actual
  useEffect(() => {
    const loadConfig = async () => {
      if (!user) return;

      try {
        const { data } = await getSpotifyConfig(user.id);
        if (data) {
          setClientId(data.client_id || '');
          setClientSecret(data.client_secret || '');
          setRefreshToken(data.refresh_token || '');
        }
      } catch (err) {
        console.error('Error al cargar la configuración:', err);
      }
    };

    loadConfig();
  }, [user]);

  // Generar URL de autorización
  const generateAuthUrl = () => {
    if (!clientId) {
      setError('Debes ingresar un Client ID para generar la URL de autorización');
      return;
    }

    try {
      spotifyService.setCredentials(clientId, clientSecret, null);
      const redirectUri = window.location.origin + '/config'; // URL de redirección a esta misma página
      const url = spotifyService.generateAuthUrl(redirectUri);
      setAuthUrl(url);
      setShowAuthFlow(true);
      setError(null);
    } catch (err) {
      setError('Error al generar la URL de autorización: ' + err.message);
    }
  };

  // Continuar con el flujo de autorización después de obtener el código
  const handleCompleteAuth = async () => {
    if (!authCode) {
      setError('Debes ingresar el código de autorización');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const redirectUri = window.location.origin + '/config';
      spotifyService.setCredentials(clientId, clientSecret, null);
      
      console.log("Iniciando proceso de obtención de token con código:", authCode);
      
      // Obtener el token de actualización usando el código de autorización
      const tokenData = await spotifyService.getRefreshToken(authCode, redirectUri);
      
      if (!tokenData.refresh_token) {
        throw new Error('No se pudo obtener el refresh token');
      }

      console.log("Token obtenido exitosamente");
      setRefreshToken(tokenData.refresh_token);
      
      console.log("Guardando configuración para usuario:", user.id);
      
      // Guardar configuración en la base de datos
      const { data, error } = await saveSpotifyConfig(
        user.id,
        clientId,
        clientSecret,
        tokenData.refresh_token
      );
      
      if (error) {
        console.error("Error al guardar configuración:", error);
        throw new Error('Error al guardar la configuración: ' + error.message);
      }
      
      console.log("Configuración guardada exitosamente:", data);

      // Probar la conexión
      const testResult = await refreshConnection();
      console.log("Resultado de prueba de conexión:", testResult);
      
      if (testResult.success) {
        setSuccess(true);
        setShowAuthFlow(false);
        // Esperar un momento y luego redirigir
        setTimeout(() => {
          navigate('/playlist');
        }, 1500);
      } else {
        setError('Conexión establecida pero no se pudo acceder a Spotify: ' + testResult.error);
      }
    } catch (err) {
      console.error("Error en handleCompleteAuth:", err);
      setError('Error durante la autorización: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar el guardado directo (cuando ya tenemos un refresh token)
  const handleSaveDirectly = async () => {
    if (!clientId || !clientSecret || !refreshToken) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Actualizar el servicio con las nuevas credenciales
      spotifyService.setCredentials(clientId, clientSecret, refreshToken);
      
      console.log("Intentando guardar configuración para usuario:", user.id);
      
      // Guardar configuración en la base de datos
      const { data, error } = await saveSpotifyConfig(user.id, clientId, clientSecret, refreshToken);
      
      if (error) {
        console.error("Error al guardar configuración:", error);
        throw new Error('Error al guardar la configuración: ' + error.message);
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
      } else {
        setError('No se pudo conectar con Spotify: ' + testResult.error);
      }
    } catch (err) {
      console.error("Error en handleSaveDirectly:", err);
      setError('Error al guardar la configuración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar historial de canciones escuchadas
  const handleClearHistory = async () => {
    if (!user) return;
    
    setClearingHistory(true);
    setHistoryCleared(false);
    
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

  // Verificar si estamos recibiendo el código de autorización por URL
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        setAuthCode(code);
        // Limpiar la URL para evitar problemas al recargar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Configuración de Spotify</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-3 rounded mb-6">
            ¡Conexión con Spotify establecida correctamente! Redirigiendo...
          </div>
        )}
        
        {historyCleared && (
          <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-3 rounded mb-6">
            Historial de canciones escuchadas borrado correctamente.
          </div>
        )}

        <div className="bg-spotify-black bg-opacity-50 p-6 rounded-lg border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Credenciales de Spotify</h2>
          
          <div className="mb-4">
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-2">
              Client ID
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="input"
              placeholder="Client ID de tu app de Spotify"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-300 mb-2">
              Client Secret
            </label>
            <input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="input"
              placeholder="Client Secret de tu app de Spotify"
            />
          </div>
          
          {!showAuthFlow && (
            <div className="mb-4">
              <label htmlFor="refreshToken" className="block text-sm font-medium text-gray-300 mb-2">
                Refresh Token
              </label>
              <input
                id="refreshToken"
                type="password"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                className="input"
                placeholder="Token de actualización de Spotify"
              />
              <p className="text-xs text-gray-400 mt-1">
                Si ya tienes un refresh token, puedes ingresarlo directamente.
                De lo contrario, usa el flujo de autorización.
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-4 mt-6">
            {!showAuthFlow ? (
              <>
                <button
                  onClick={generateAuthUrl}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Iniciar Flujo de Autorización
                </button>
                
                <button
                  onClick={handleSaveDirectly}
                  className="btn btn-primary"
                  disabled={loading || !clientId || !clientSecret || !refreshToken}
                >
                  {loading ? 'Guardando...' : 'Guardar y Conectar'}
                </button>
              </>
            ) : (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Flujo de Autorización</h3>
                
                <ol className="list-decimal list-inside text-sm mb-4 text-left">
                  <li className="mb-2">
                    Haz clic en el botón "Abrir URL de Autorización" a continuación.
                  </li>
                  <li className="mb-2">
                    Inicia sesión en Spotify y autoriza la aplicación.
                  </li>
                  <li className="mb-2">
                    Serás redirigido de vuelta a esta página con un código de autorización.
                  </li>
                  <li>
                    El código se detectará automáticamente, pero si no, cópialo y pégalo abajo.
                  </li>
                </ol>
                
                <div className="mb-4">
                  <a
                    href={authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full mb-4"
                  >
                    Abrir URL de Autorización
                  </a>
                  
                  <label htmlFor="authCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Autorización
                  </label>
                  <input
                    id="authCode"
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="input"
                    placeholder="Pega el código de autorización aquí"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowAuthFlow(false)}
                    className="btn bg-gray-700 text-white hover:bg-gray-600 flex-1"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleCompleteAuth}
                    className="btn btn-primary flex-1"
                    disabled={loading || !authCode}
                  >
                    {loading ? 'Procesando...' : 'Completar Autorización'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isConfigured && (
          <div className="bg-spotify-black bg-opacity-50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Gestión de Historial</h2>
            <p className="text-sm text-gray-300 mb-4">
              Borra tu historial de canciones escuchadas para volver a jugar con todas las canciones de tus playlists favoritas.
            </p>
            
            <button
              onClick={handleClearHistory}
              className="btn btn-secondary w-full"
              disabled={clearingHistory}
            >
              {clearingHistory ? 'Borrando...' : 'Borrar Historial de Canciones'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Config;