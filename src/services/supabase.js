import { createClient } from '@supabase/supabase-js';

// Obtenemos las variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tu-url-supabase.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-clave-anon-supabase';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Funciones para gestionar la autenticación
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Funciones para gestionar la configuración de Spotify
export const saveSpotifyConfig = async (userId, clientId, clientSecret, refreshToken) => {
  try {
    // Primero verificamos si ya existe una configuración para este usuario
    const { data: existingConfig } = await supabase
      .from('spotify_configs')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (existingConfig) {
      // Si ya existe, actualizamos solo el refresh token
      const { data, error } = await supabase
        .from('spotify_configs')
        .update({ 
          refresh_token: refreshToken,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .select();
      
      return { data, error };
    } else {
      // Si no existe, insertamos un nuevo registro
      const { data, error } = await supabase
        .from('spotify_configs')
        .insert({ 
          user_id: userId, 
          client_id: clientId, 
          client_secret: clientSecret,
          refresh_token: refreshToken,
          updated_at: new Date()
        })
        .select();
      
      return { data, error };
    }
  } catch (error) {
    console.error('Error al guardar la configuración de Spotify:', error);
    return { data: null, error };
  }
}

export const getSpotifyConfig = async (userId) => {
  const { data, error } = await supabase
    .from('spotify_configs')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}

// Funciones para gestionar las canciones ya escuchadas
export const saveListenedSong = async (userId, songId) => {
  const { data, error } = await supabase
    .from('listened_songs')
    .insert({ 
      user_id: userId, 
      song_id: songId,
      listened_at: new Date()
    })
  
  return { data, error }
}

export const getListenedSongs = async (userId) => {
  const { data, error } = await supabase
    .from('listened_songs')
    .select('song_id')
    .eq('user_id', userId)
  
  return { data: data?.map(item => item.song_id) || [], error }
}

export const clearListenedSongs = async (userId) => {
  const { error } = await supabase
    .from('listened_songs')
    .delete()
    .eq('user_id', userId)
  
  return { error }
}