import { createContext, useContext, useEffect, useState } from 'react';
import spotifyService from '../services/spotify';
import { useAuth } from './AuthContext';
import { getSpotifyConfig } from '../services/supabase';

const SpotifyContext = createContext();

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify debe ser usado dentro de SpotifyProvider');
  }
  return context;
};

export const SpotifyProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpotifyConfig = async () => {
      if (!user) {
        setIsConfigured(false);
        setIsConnected(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: config, error } = await getSpotifyConfig(user.id);

        if (error) {
          console.error('Error al cargar la configuración de Spotify:', error);
          setConfigError(error.message);
          setIsConfigured(false);
        } else if (config) {
          // Configurar el servicio de Spotify con las credenciales guardadas
          spotifyService.setCredentials(
            config.client_id,
            config.client_secret,
            config.refresh_token
          );
          setIsConfigured(true);

          // Probar la conexión
          const { success, error: connectionError } = await spotifyService.testConnection();
          setIsConnected(success);
          if (!success) {
            setConfigError(connectionError);
          } else {
            setConfigError(null);
          }
        } else {
          setIsConfigured(false);
        }
      } catch (err) {
        console.error('Error al inicializar Spotify:', err);
        setConfigError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSpotifyConfig();
  }, [user]);

  const value = {
    isConfigured,
    isConnected,
    configError,
    loading,
    spotifyService,
    refreshConnection: async () => {
      try {
        setLoading(true);
        const { success, error } = await spotifyService.testConnection();
        setIsConnected(success);
        setConfigError(success ? null : error);
        return { success, error };
      } catch (err) {
        setConfigError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};