/**
 * Configuración global de la aplicación
 * 
 * Estas credenciales deberían estar en variables de entorno 
 * en un entorno de producción.
 */

// Credenciales de la aplicación de Spotify (comunes para todos los usuarios)
export const SPOTIFY_CONFIG = {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
    redirectUri: window.location.origin + '/config'
  };
  
  // URL de autorización
  export const getSpotifyAuthUrl = () => {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state'
    ];
  
    return `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CONFIG.clientId}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}`;
  };