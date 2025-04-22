import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';
import { useAuth } from '../context/AuthContext';
import { getListenedSongs, saveListenedSong } from '../services/supabase';
import Header from '../components/Header';
import PlayButton from '../components/PlayButton';
import PauseButton from '../components/PauseButton';
import RevealButton from '../components/RevealButton';
import NextButton from '../components/NextButton';
import SongInfo from '../components/SongInfo';

const Player = () => {
  const { spotifyService, isConfigured, isConnected } = useSpotify();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [listenedSongs, setListenedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [playlistCompleted, setPlaylistCompleted] = useState(false);
  const [playerState, setPlayerState] = useState(null);
  
  // Referencia para el polling del estado del reproductor
  const playerStateInterval = useRef(null);

  // Cargar la playlist y las canciones escuchadas al montar
  useEffect(() => {
    const loadPlaylistAndHistory = async () => {
      if (!isConfigured || !isConnected) {
        navigate('/config');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener la URL de la playlist desde sessionStorage
        const playlistUrl = sessionStorage.getItem('currentPlaylist');
        if (!playlistUrl) {
          navigate('/playlist');
          return;
        }

        // Cargar el historial de canciones escuchadas
        const { data: listenedSongsData, error: listenedError } = await getListenedSongs(user.id);
        if (listenedError) {
          throw new Error(`Error al cargar el historial de canciones: ${listenedError.message}`);
        }
        
        setListenedSongs(listenedSongsData || []);

        // Cargar las pistas de la playlist
        const tracks = await spotifyService.getPlaylistTracks(playlistUrl);
        setPlaylistTracks(tracks);

        // Verificar si hemos completado la playlist
        const availableTracks = tracks.filter(track => !listenedSongsData.includes(track.id));
        setPlaylistCompleted(availableTracks.length === 0);

        // Inicializar el reproductor de Spotify
        await initializeSpotifyPlayer();

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylistAndHistory();
  }, [isConfigured, isConnected, navigate, user?.id]);

  // Inicializar el reproductor de Spotify
  const initializeSpotifyPlayer = async () => {
    try {
      console.log('Iniciando inicialización del reproductor de Spotify...');
      
      const onPlayerStateChanged = (state) => {
        console.log('Estado del reproductor actualizado:', state);
        setPlayerState(state);
        
        // Actualizar el estado de reproducción basado en el estado del reproductor
        if (state) {
          setIsPlaying(!state.paused);
        } else {
          setIsPlaying(false);
        }
      };

      const onPlaybackError = (error) => {
        console.error('Error de reproducción:', error);
        
        // Verificar si es un error de cuenta Premium
        if (error.message && error.message.includes('ERROR_PREMIUM_REQUIRED')) {
          console.log('Se requiere cuenta Premium, redirigiendo...');
          navigate('/premium-info');
          return;
        }
        
        setError(`Error de reproducción: ${error.message}`);
      };

      const onPlaybackReady = (deviceId) => {
        console.log('Reproductor de Spotify listo con ID de dispositivo:', deviceId);
        setPlayerInitialized(true);
      };

      // Obtener token actualizado antes de inicializar
      console.log('Obteniendo token de acceso...');
      const token = await spotifyService.getAccessToken();
      console.log('Token obtenido correctamente.');

      // Inicializar el reproductor
      console.log('Intentando inicializar el reproductor...');
      const initialized = await spotifyService.initializePlayer(
        'Hitsterfy Player',
        onPlayerStateChanged,
        onPlaybackError,
        onPlaybackReady
      );

      console.log('Resultado de inicialización:', initialized ? 'EXITOSO' : 'FALLIDO');

      if (!initialized) {
        throw new Error('No se pudo inicializar el reproductor de Spotify');
      }

      // Configurar un intervalo para verificar regularmente el estado del reproductor
      console.log('Configurando intervalo para monitoreo de estado...');
      playerStateInterval.current = setInterval(async () => {
        try {
          const state = await spotifyService.getPlayerState();
          if (state) {
            setPlayerState(state);
            setIsPlaying(!state.paused);
          }
        } catch (error) {
          console.error('Error al obtener el estado del reproductor:', error);
        }
      }, 3000);

    } catch (err) {
      console.error('Error al inicializar el reproductor de Spotify:', err);
      setError(`Error al inicializar el reproductor: ${err.message}`);
    }
  };

  // Seleccionar una canción aleatoria
  const selectRandomTrack = () => {
    // Filtrar canciones que no se han escuchado aún
    const availableTracks = playlistTracks.filter(track => !listenedSongs.includes(track.id));
    
    if (availableTracks.length === 0) {
      setPlaylistCompleted(true);
      return null;
    }
    
    // Elegir una canción aleatoria
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    return availableTracks[randomIndex];
  };

  // Reproducir una nueva canción
  const playNewTrack = async () => {
    try {
      const track = selectRandomTrack();
      
      if (!track) {
        // No hay más canciones disponibles
        return;
      }
      
      setCurrentTrack(track);
      setRevealed(false);
      
      // Verificar que el reproductor esté inicializado
      if (!spotifyService.isPlayerReady()) {
        throw new Error('El reproductor de Spotify no está listo');
      }
      
      // Reproducir la canción usando Spotify
      await spotifyService.playSong(track.uri);
      setIsPlaying(true);
      
      console.log(`Reproduciendo: ${track.name} - ${track.artist}`);
    } catch (err) {
      console.error('Error al reproducir nueva canción:', err);
      setError(`Error al reproducir: ${err.message}`);
    }
  };

  // Reproducir o pausar la canción actual
  const togglePlay = async () => {
    try {
      if (!currentTrack) {
        // Si no hay canción actual, seleccionar una nueva
        await playNewTrack();
        return;
      }
      
      // Verificar que el reproductor esté inicializado
      if (!spotifyService.isPlayerReady()) {
        throw new Error('El reproductor de Spotify no está listo');
      }
      
      // Alternar entre reproducir y pausar
      await spotifyService.togglePlayback();
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('Error al alternar reproducción:', err);
      setError(`Error: ${err.message}`);
    }
  };

  // Revelar información de la canción
  const handleReveal = async () => {
    try {
      // Pausar la reproducción
      if (isPlaying) {
        await spotifyService.pausePlayback();
        setIsPlaying(false);
      }
      
      setRevealed(true);
      
      // Guardar la canción como escuchada
      if (currentTrack && user) {
        try {
          await saveListenedSong(user.id, currentTrack.id);
          setListenedSongs(prev => [...prev, currentTrack.id]);
        } catch (err) {
          console.error('Error al guardar canción escuchada:', err);
        }
      }
    } catch (err) {
      console.error('Error al revelar información:', err);
      setError(`Error: ${err.message}`);
    }
  };

  // Seleccionar otra canción
  const handleNextSong = async () => {
    try {
      // Detener la reproducción actual
      if (isPlaying) {
        await spotifyService.pausePlayback();
      }
      
      setIsPlaying(false);
      setRevealed(false);
      
      // Verificar si quedan canciones disponibles
      const availableTracks = playlistTracks.filter(track => !listenedSongs.includes(track.id));
      if (availableTracks.length === 0) {
        setPlaylistCompleted(true);
        setCurrentTrack(null);
      } else {
        // Seleccionar una nueva canción
        await playNewTrack();
      }
    } catch (err) {
      console.error('Error al seleccionar siguiente canción:', err);
      setError(`Error: ${err.message}`);
    }
  };

  // Limpiar el reproductor al desmontar
  useEffect(() => {
    return () => {
      // Limpiar el intervalo de verificación del estado
      if (playerStateInterval.current) {
        clearInterval(playerStateInterval.current);
      }
      
      // Desconectar el reproductor de Spotify
      const cleanupPlayer = async () => {
        try {
          if (spotifyService && spotifyService.isPlayerReady()) {
            await spotifyService.disconnectPlayer();
            console.log('Reproductor de Spotify desconectado');
          }
        } catch (err) {
          console.error('Error al desconectar el reproductor:', err);
        }
      };
      
      cleanupPlayer();
    };
  }, []);

  // Si la playlist está completada
  if (playlistCompleted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <div className="bg-spotify-black bg-opacity-50 p-8 rounded-lg border border-gray-700 max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4 text-center">¡Playlist Completada!</h1>
            
            <p className="text-gray-300 mb-6 text-center">
              Has escuchado todas las canciones de esta playlist. Puedes seleccionar otra playlist o borrar tu historial en la configuración.
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate('/playlist')}
                className="btn btn-primary w-full"
              >
                Seleccionar Otra Playlist
              </button>
              
              <button
                onClick={() => navigate('/config')}
                className="btn btn-secondary w-full"
              >
                Ir a Configuración
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-spotify-green"></div>
        </div>
      </div>
    );
  }

  // Renderizar el reproductor
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-spotify-black to-gray-900">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 pb-6">
        <div className="w-full max-w-md flex flex-col items-center justify-center gap-6">
          {!playerInitialized && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-spotify-green mb-4"></div>
              <p className="text-gray-300">Inicializando reproductor de Spotify...</p>
            </div>
          )}
          
          {playerInitialized && !currentTrack && !revealed && (
            <div className="flex flex-col items-center">
              <PlayButton onClick={playNewTrack} />
              <p className="mt-4 text-gray-300">Pulsa para comenzar</p>
            </div>
          )}
          
          {playerInitialized && currentTrack && !revealed && (
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="flex-1 flex items-center justify-center">
                {isPlaying ? (
                  <PauseButton onClick={togglePlay} />
                ) : (
                  <PlayButton onClick={togglePlay} />
                )}
              </div>
              
              <div className="w-full">
                <RevealButton onClick={handleReveal} />
              </div>
            </div>
          )}
          
          {playerInitialized && currentTrack && revealed && (
            <div className="flex flex-col items-center gap-8 w-full">
              <SongInfo 
                year={currentTrack.releaseYear}
                artist={currentTrack.artist}
                name={currentTrack.name}
              />
              
              <div className="w-full">
                <NextButton onClick={handleNextSong} />
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded w-full mt-4">
              {error}
              <button 
                className="block ml-auto mt-2 text-sm underline"
                onClick={() => setError(null)}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Player;