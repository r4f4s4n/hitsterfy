/**
 * Servicio para gestionar la reproducción de Spotify mediante Spotify Web Playback SDK
 */

class SpotifyPlaybackService {
    constructor() {
      this.player = null;
      this.deviceId = null;
      this.isReady = false;
      this.isInitialized = false;
      this.accessToken = null;
      this.onPlayerStateChanged = null;
      this.onPlaybackError = null;
      this.onPlaybackReady = null;
    }
  
    /**
   * Carga el script del SDK de Spotify
   */
    loadSpotifySDK() {
        return new Promise((resolve, reject) => {
        if (document.getElementById('spotify-player')) {
            resolve();
            return;
        }

        // Definir la función global que Spotify llamará cuando el SDK esté listo
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log('Spotify Web Playback SDK Ready');
            resolve();
        };

        const script = document.createElement('script');
        script.id = 'spotify-player';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;

        script.onerror = (error) => {
            reject(new Error('Failed to load Spotify Web Playback SDK'));
        };

        document.body.appendChild(script);
        });
    }
  
    /**
   * Inicializa el reproductor de Spotify
   * @param {string} accessToken - Token de acceso válido para Spotify
   * @param {string} playerName - Nombre del reproductor (mostrado en dispositivos de Spotify)
   * @param {Function} onPlayerStateChanged - Callback para cuando cambia el estado del reproductor
   * @param {Function} onPlaybackError - Callback para errores de reproducción
   * @param {Function} onPlaybackReady - Callback para cuando el reproductor está listo
   */
    async initializePlayer(accessToken, playerName = 'Hitsterfy Web Player', onPlayerStateChanged, onPlaybackError, onPlaybackReady) {
        if (!accessToken) {
        throw new Error('Access token is required to initialize Spotify player');
        }

        this.accessToken = accessToken;
        this.onPlayerStateChanged = onPlayerStateChanged;
        this.onPlaybackError = onPlaybackError;
        this.onPlaybackReady = onPlaybackReady;

        try {
        // Cargar el SDK de Spotify
        await this.loadSpotifySDK();

        if (this.isInitialized) {
            await this.disconnectPlayer();
        }

        this.isInitialized = false;
        this.isReady = false;

        // Crear el reproductor
        this.player = new window.Spotify.Player({
            name: playerName,
            getOAuthToken: (cb) => {
            cb(this.accessToken);
            },
            volume: 0.5
        });

        // Manejar eventos del reproductor
        this.setupPlayerEvents();

        // Conectar el reproductor
        const success = await this.player.connect();
        
        if (success) {
            this.isInitialized = true;
            console.log('Spotify Web Playback SDK initialized successfully');
            return true;
        } else {
            console.error('Failed to connect Spotify Web Playback SDK');
            return false;
        }
        } catch (error) {
        console.error('Error initializing Spotify player:', error);
        if (this.onPlaybackError) {
            this.onPlaybackError(error);
        }
        return false;
        }
    }
  
    /**
     * Configura los eventos del reproductor de Spotify
     */
    setupPlayerEvents() {
      if (!this.player) return;
  
      // Error
      this.player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
        if (this.onPlaybackError) {
          this.onPlaybackError(new Error(`Initialization error: ${message}`));
        }
      });
  
      this.player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        if (this.onPlaybackError) {
          this.onPlaybackError(new Error(`Authentication error: ${message}`));
        }
      });
  
      this.player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        if (this.onPlaybackError) {
          this.onPlaybackError(new Error(`ERROR_PREMIUM_REQUIRED: ${message} - Se requiere Spotify Premium para reproducir música en esta aplicación`));
        }
      });
  
      this.player.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
        if (this.onPlaybackError) {
          this.onPlaybackError(new Error(`Playback error: ${message}`));
        }
      });
  
      // Playback status updates
      this.player.addListener('player_state_changed', (state) => {
        console.log('Player state changed:', state);
        if (this.onPlayerStateChanged) {
          this.onPlayerStateChanged(state);
        }
      });
  
      // Ready
      this.player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player Ready with Device ID:', device_id);
        this.deviceId = device_id;
        this.isReady = true;
        if (this.onPlaybackReady) {
          this.onPlaybackReady(device_id);
        }
      });
  
      // Not Ready
      this.player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id);
        this.isReady = false;
        this.deviceId = null;
      });
    }
  
    /**
     * Desconecta el reproductor de Spotify
     */
    async disconnectPlayer() {
      if (this.player) {
        // Quitar todos los listeners
        this.player.removeListener('initialization_error');
        this.player.removeListener('authentication_error');
        this.player.removeListener('account_error');
        this.player.removeListener('playback_error');
        this.player.removeListener('player_state_changed');
        this.player.removeListener('ready');
        this.player.removeListener('not_ready');
  
        // Desconectar el reproductor
        await this.player.disconnect();
        this.player = null;
        this.deviceId = null;
        this.isReady = false;
        this.isInitialized = false;
        console.log('Spotify player disconnected');
      }
    }
  
    /**
   * Reproduce una canción o URI de Spotify
   * @param {string} spotifyUri - URI de Spotify para reproducir
   * @param {object} options - Opciones adicionales (position_ms, etc.)
   */
    async play(spotifyUri, options = {}) {
        if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
        }

        try {
        console.log(`Intentando reproducir: ${spotifyUri}`);
        const url = `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`;
        
        const body = {};
        
        // Si es un URI de canción, reproducirla
        if (spotifyUri && typeof spotifyUri === 'string' && spotifyUri.includes('spotify:track:')) {
            body.uris = [spotifyUri];
            console.log(`Reproduciendo track URI: ${spotifyUri}`);
        }
        // Si es un URI de playlist o álbum, reproducirlo
        else if (spotifyUri && typeof spotifyUri === 'string' && (spotifyUri.includes('spotify:playlist:') || spotifyUri.includes('spotify:album:'))) {
            body.context_uri = spotifyUri;
            console.log(`Reproduciendo context URI: ${spotifyUri}`);
        }
        // Si es un array de URIs de canciones, reproducirlas
        else if (Array.isArray(spotifyUri)) {
            body.uris = spotifyUri;
            console.log(`Reproduciendo múltiples URIs: ${spotifyUri.length} tracks`);
        }
        else {
            console.error('URI de Spotify no válido:', spotifyUri);
            throw new Error(`URI de Spotify no válido: ${spotifyUri}`);
        }
        
        // Opciones adicionales
        if (options.position_ms) {
            body.position_ms = options.position_ms;
        }
        
        if (options.offset) {
            body.offset = options.offset;
        }

        console.log('Datos enviados a la API de Spotify:', JSON.stringify(body));
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en respuesta:', errorData);
            throw new Error(`Error playing track: ${errorData.error?.message || response.statusText}`);
        }

        return true;
        } catch (error) {
        console.error('Error playing track:', error);
        if (this.onPlaybackError) {
            this.onPlaybackError(error);
        }
        return false;
        }
    }
  
    /**
     * Pausa la reproducción actual
     */
    async pause() {
      if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
      }
  
      try {
        await this.player.pause();
        return true;
      } catch (error) {
        console.error('Error pausing playback:', error);
        if (this.onPlaybackError) {
          this.onPlaybackError(error);
        }
        return false;
      }
    }
  
    /**
     * Reanuda la reproducción
     */
    async resume() {
      if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
      }
  
      try {
        await this.player.resume();
        return true;
      } catch (error) {
        console.error('Error resuming playback:', error);
        if (this.onPlaybackError) {
          this.onPlaybackError(error);
        }
        return false;
      }
    }
  
    /**
     * Alterna entre reproducir y pausar
     */
    async togglePlay() {
      if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
      }
  
      try {
        await this.player.togglePlay();
        return true;
      } catch (error) {
        console.error('Error toggling playback:', error);
        if (this.onPlaybackError) {
          this.onPlaybackError(error);
        }
        return false;
      }
    }
  
    /**
     * Salta a la siguiente canción
     */
    async nextTrack() {
      if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
      }
  
      try {
        await this.player.nextTrack();
        return true;
      } catch (error) {
        console.error('Error skipping to next track:', error);
        if (this.onPlaybackError) {
          this.onPlaybackError(error);
        }
        return false;
      }
    }
  
    /**
     * Vuelve a la canción anterior
     */
    async previousTrack() {
      if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
      }
  
      try {
        await this.player.previousTrack();
        return true;
      } catch (error) {
        console.error('Error going to previous track:', error);
        if (this.onPlaybackError) {
          this.onPlaybackError(error);
        }
        return false;
      }
    }
  
    /**
     * Establece el volumen del reproductor
     * @param {number} volumePercent - Volumen entre 0 y 1
     */
    async setVolume(volumePercent) {
      if (!this.isReady || !this.deviceId) {
        throw new Error('Spotify player is not ready');
      }
  
      try {
        await this.player.setVolume(volumePercent);
        return true;
      } catch (error) {
        console.error('Error setting volume:', error);
        if (this.onPlaybackError) {
          this.onPlaybackError(error);
        }
        return false;
      }
    }
  
    /**
     * Verifica si el reproductor está listo
     */
    isPlayerReady() {
      return this.isReady && this.deviceId !== null;
    }
  
    /**
     * Obtiene el estado actual del reproductor
     */
    async getCurrentState() {
      if (!this.isReady || !this.deviceId) {
        return null;
      }
  
      try {
        return await this.player.getCurrentState();
      } catch (error) {
        console.error('Error getting current state:', error);
        return null;
      }
    }
  }
  
  // Exportar una instancia única del servicio
  export default new SpotifyPlaybackService();