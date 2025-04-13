import SpotifyWebApi from 'spotify-web-api-js';
import spotifyPlayback from './spotify-playback';

// Clase para manejar la API de Spotify
class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi();
    this.clientId = null;
    this.clientSecret = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  // Configurar las credenciales
  setCredentials(clientId, clientSecret, refreshToken) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  // Comprobar si tenemos las credenciales necesarias
  hasCredentials() {
    return this.clientId && this.clientSecret && this.refreshToken;
  }

  // Comprobar si el token ha expirado
  isTokenExpired() {
    return !this.expiresAt || Date.now() > this.expiresAt;
  }

  // Obtener un nuevo token de acceso usando el refresh token
  async refreshAccessToken() {
    if (!this.hasCredentials()) {
      throw new Error('No se han configurado las credenciales de Spotify');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al refrescar el token: ${errorData.error_description || response.statusText}`);
    }

    const data = await response.json();
    this.spotifyApi.setAccessToken(data.access_token);
    
    // Calcular cuándo expira el token (restamos 60 segundos para tener margen)
    this.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
    
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }

    return data;
  }

  // Obtener un token de acceso y refrescarlo si es necesario
  async getAccessToken() {
    if (this.isTokenExpired()) {
      console.log('Token expirado o no existente, refrescando...');
      await this.refreshAccessToken();
    }
    return this.spotifyApi.getAccessToken();
  }

  // Generar la URL para autorización
  generateAuthUrl(redirectUri) {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state'
    ];

    return `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}`;
  }

  // Obtener el código de autorización de la URL
  getAuthCodeFromUrl(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('code');
  }

  // Obtener el refresh token usando el código de autorización
  async getRefreshToken(code, redirectUri) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al obtener el refresh token: ${errorData.error_description || response.statusText}`);
    }

    const data = await response.json();
    this.refreshToken = data.refresh_token;
    this.spotifyApi.setAccessToken(data.access_token);
    this.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return data;
  }

  // Métodos para interactuar con la API de Spotify

  // Obtener información de la playlist
  async getPlaylist(playlistUrl) {
    await this.getAccessToken();
    
    // Extraer el ID de la playlist de la URL
    let playlistId;
    try {
      if (playlistUrl.includes('spotify:playlist:')) {
        playlistId = playlistUrl.split('spotify:playlist:')[1];
      } else if (playlistUrl.includes('/playlist/')) {
        const url = new URL(playlistUrl);
        const pathParts = url.pathname.split('/');
        const playlistIndex = pathParts.indexOf('playlist');
        if (playlistIndex !== -1 && playlistIndex < pathParts.length - 1) {
          playlistId = pathParts[playlistIndex + 1];
        }
      }
      
      if (!playlistId) {
        throw new Error('No se pudo extraer el ID de la playlist de la URL proporcionada');
      }
    } catch (error) {
      throw new Error(`URL de playlist inválida: ${error.message}`);
    }

    try {
      return await this.spotifyApi.getPlaylist(playlistId);
    } catch (error) {
      console.error('Error al obtener la playlist:', error);
      throw new Error(`Error al obtener la playlist: ${error.message}`);
    }
  }

  // Obtener todas las pistas de una playlist (maneja paginación)
  async getPlaylistTracks(playlistUrl) {
    const playlist = await this.getPlaylist(playlistUrl);
    let tracks = playlist.tracks.items;
    let nextUrl = playlist.tracks.next;

    // Si hay más pistas, obtenerlas mediante paginación
    while (nextUrl) {
      await this.getAccessToken();
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${this.spotifyApi.getAccessToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener más pistas: ${response.statusText}`);
      }
      
      const data = await response.json();
      tracks = [...tracks, ...data.items];
      nextUrl = data.next;
    }

    // Filtrar pistas que no estén vacías, que no sean locales y que tengan URI
    const validTracks = tracks
      .filter(item => item.track && !item.track.is_local && item.track.uri)
      .map(item => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        releaseDate: item.track.album.release_date,
        releaseYear: item.track.album.release_date ? item.track.album.release_date.split('-')[0] : 'N/A',
        previewUrl: item.track.preview_url,
        uri: item.track.uri
      }));
      
    if (validTracks.length === 0) {
      throw new Error('No se encontraron canciones válidas en esta playlist. Asegúrate de que la lista contenga canciones disponibles.');
    }
    
    console.log(`Playlist cargada con ${validTracks.length} canciones válidas`);
    return validTracks;
  }

  // Verificar conexión con Spotify
  async testConnection() {
    try {
      await this.getAccessToken();
      const me = await this.spotifyApi.getMe();
      console.log('Conexión con Spotify establecida correctamente:', me);
      return { success: true, user: me };
    } catch (error) {
      console.error('Error al conectar con Spotify:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Inicializar el reproductor de Spotify
  async initializePlayer(playerName, onPlayerStateChanged, onPlaybackError, onPlaybackReady) {
    try {
      const token = await this.getAccessToken();
      const initialized = await spotifyPlayback.initializePlayer(
        token,
        playerName || 'Hitsterfy Player',
        onPlayerStateChanged,
        onPlaybackError,
        onPlaybackReady
      );
      return initialized;
    } catch (error) {
      console.error('Error al inicializar el reproductor de Spotify:', error);
      throw error;
    }
  }

  // Reproducir una canción
  async playSong(trackUri, options = {}) {
    try {
      // Asegurarse de que el token esté actualizado
      await this.getAccessToken();
      return await spotifyPlayback.play(trackUri, options);
    } catch (error) {
      console.error('Error al reproducir la canción:', error);
      throw error;
    }
  }

  // Pausar la reproducción
  async pausePlayback() {
    try {
      return await spotifyPlayback.pause();
    } catch (error) {
      console.error('Error al pausar la reproducción:', error);
      throw error;
    }
  }

  // Reanudar la reproducción
  async resumePlayback() {
    try {
      return await spotifyPlayback.resume();
    } catch (error) {
      console.error('Error al reanudar la reproducción:', error);
      throw error;
    }
  }

  // Alternar entre reproducir y pausar
  async togglePlayback() {
    try {
      return await spotifyPlayback.togglePlay();
    } catch (error) {
      console.error('Error al alternar la reproducción:', error);
      throw error;
    }
  }

  // Obtener el estado actual del reproductor
  async getPlayerState() {
    try {
      return await spotifyPlayback.getCurrentState();
    } catch (error) {
      console.error('Error al obtener el estado del reproductor:', error);
      throw error;
    }
  }

  // Comprobar si el reproductor está listo
  isPlayerReady() {
    return spotifyPlayback.isPlayerReady();
  }

  // Desconectar el reproductor
  async disconnectPlayer() {
    try {
      return await spotifyPlayback.disconnectPlayer();
    } catch (error) {
      console.error('Error al desconectar el reproductor:', error);
      throw error;
    }
  }

  // Inicializar el reproductor de Spotify
  async initializePlayer(playerName, onPlayerStateChanged, onPlaybackError, onPlaybackReady) {
    try {
      console.log('Solicitando token de acceso para inicializar reproductor...');
      const token = await this.getAccessToken();
      console.log('Token obtenido, longitud:', token ? token.length : 0);
      
      if (!token) {
        throw new Error('No se pudo obtener un token de acceso válido');
      }
      
      console.log('Pasando token al servicio de reproducción...');
      const initialized = await spotifyPlayback.initializePlayer(
        token,
        playerName || 'Hitsterfy Player',
        onPlayerStateChanged,
        onPlaybackError,
        onPlaybackReady
      );
      
      console.log('Resultado de inicialización del reproductor:', initialized);
      return initialized;
    } catch (error) {
      console.error('Error al inicializar el reproductor de Spotify:', error);
      throw error;
    }
  }
  
}

export default new SpotifyService();