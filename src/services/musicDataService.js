// src/services/musicDataService.js
export async function getOriginalReleaseYear(artist, trackName) {
    try {
      // Limpiar el nombre de la canción para quitar sufijos de remasterización
      const cleanTrackName = cleanupTrackName(trackName);
      
      // Codificamos para la URL
      const artistEncoded = encodeURIComponent(artist);
      const trackEncoded = encodeURIComponent(cleanTrackName);
      
      console.log(`Buscando año original para: "${cleanTrackName}" por ${artist}`);
      
      // Consulta a MusicBrainz
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=artist:${artistEncoded}%20AND%20recording:${trackEncoded}&fmt=json`,
        {
          headers: {
            "User-Agent": "Hitsterfy/1.0.0 (hitsterfy@example.com)"
          }
        }
      );
      
      const data = await response.json();
      
      if (data.recordings && data.recordings.length > 0) {
        const allReleases = [];
        
        // Recopilamos información de todos los lanzamientos asociados
        for (const recording of data.recordings) {
          if (recording.releases) {
            for (const release of recording.releases) {
              if (release.date) {
                allReleases.push({
                  date: release.date,
                  status: release.status || '',
                  title: release.title || '',
                  releaseGroup: release['release-group'] || {}
                });
              }
            }
          }
        }
        
        // Filtrar solo álbumes de estudio oficiales
        const studioAlbums = allReleases.filter(release => {
          // Debe ser un lanzamiento oficial
          const isOfficial = release.status === 'Official';
          
          // El título no debe indicar una compilación o remasterización
          const title = release.title.toLowerCase();
          const isNotCompilation = !title.includes('compilation') && 
                                  !title.includes('collection') &&
                                  !title.includes('best of') &&
                                  !title.includes('greatest hits') &&
                                  !title.includes('anthology') &&
                                  !title.includes('box set');
          
          // Verificar si es un álbum (no single o EP)
          const isAlbum = release.releaseGroup && 
                         release.releaseGroup['primary-type'] === 'Album';
          
          // No debe ser en vivo, remix, soundtrack, etc.
          const isNotSpecialRelease = !release.releaseGroup || 
                                      !release.releaseGroup['secondary-types'] ||
                                      !release.releaseGroup['secondary-types'].some(type => 
                                        ['Live', 'Remix', 'Soundtrack', 'Compilation', 'DJ-mix', 'Interview', 'Demo'].includes(type)
                                      );
          
          return isOfficial && isNotCompilation && isAlbum && isNotSpecialRelease;
        });
        
        // Ordenar los álbumes de estudio por fecha
        studioAlbums.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Log para depuración
        console.log("Álbumes de estudio encontrados:", studioAlbums.map(album => 
          `${album.title} (${album.date.split('-')[0]})`
        ));
        
        // Obtener el año del lanzamiento más antiguo
        if (studioAlbums.length > 0) {
          return studioAlbums[0].date.split('-')[0];
        }
        
        // Si no encontramos álbumes de estudio, podemos intentar con una búsqueda más amplia
        console.log("No se encontraron álbumes de estudio, intentando con criterios más amplios...");
        
        // Considerar todos los lanzamientos
        allReleases.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (allReleases.length > 0) {
          return allReleases[0].date.split('-')[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error consultando MusicBrainz:", error);
      return null;
    }
}

// Función para limpiar el nombre de la canción
function cleanupTrackName(trackName) {
    // Patrones comunes de remasterizaciones y versiones
    const patterns = [
      // Patrones con guión/raya
      /\s*[\-–]\s*(Remaster(ed)?|Remasterizado|2\d{3}\s*Remaster(ed)?)\s*\d*\s*$/i,
      /\s*[\-–]\s*(Version|Versión|Edit|Edition)\s*\d*\s*$/i,
      /\s*[\-–]\s*(19|20)\d{2}\s*(Digital)?\s*(Remaster(ed)?|Version|Versión)?\s*$/i,
      /\s*[\-–]\s*(Single|Mono|Stereo|Live|Directo|En vivo)(\s*Version|\s*Mix)?\s*$/i,
      
      // Patrones que incluyen barras (/)
      /\s*[\-–]\s*\w+\s*\/\s*(Remaster(ed)?|Remasterizado)\s*$/i,
      /\s*[\-–]\s*(Mono|Stereo)\s*\/\s*(Remaster(ed)?|Remasterizado)\s*$/i,
      
      // Patrones dentro de paréntesis
      /\s*\(*(Remaster(ed)?|Remasterizado)\)*\s*\d*\s*$/i,
      /\s*\(*(19|20)\d{2}\s*(Digital)?\s*(Remaster(ed)?|Version|Versión)?\)*\s*$/i,
      /\s*\(*(Single|Mono|Stereo|Live|Directo|En vivo)(\s*Version|\s*Mix)?\)*\s*$/i,
      /\s*\(*(Mono|Stereo)\s*\/\s*(Remaster(ed)?|Remasterizado)\)*\s*$/i,
      
      // Casos específicos mencionados
      /\s*[\-–]\s*Mono\s*\/\s*Remaster(ed)?\s*$/i,
      
      // Patrones con "From" o "De"
      /\s*[\-–]\s*From\s+["'](.+?)["']\s*$/i,
      /\s*[\-–]\s*De\s+["'](.+?)["']\s*$/i,
      
      // Patrones con "Original" o "Deluxe"
      /\s*[\-–]\s*(Original\s+)?(Motion\s+Picture|Soundtrack|Banda\s+Sonora)\s*$/i,
      /\s*[\-–]\s*(Deluxe(\s+Edition)?|Special\s+Edition)\s*$/i,
      
      // Remixes y versiones alternativas
      /\s*[\-–]\s*(Radio\s+Edit|Extended\s+Mix|Club\s+Mix|Remix|Instrumental)\s*$/i
    ];
    
    let cleanName = trackName;
    
    // Aplicar cada patrón para limpiar el nombre
    patterns.forEach(pattern => {
      cleanName = cleanName.replace(pattern, '');
    });
    
    // A veces quedan múltiples sufijos apilados, aplicamos de nuevo
    patterns.forEach(pattern => {
      cleanName = cleanName.replace(pattern, '');
    });
    
    // Eliminar cualquier paréntesis vacío que haya quedado
    cleanName = cleanName.replace(/\(\s*\)/g, '');
    
    // Eliminar espacios extra al principio y final
    cleanName = cleanName.trim();
    
    // Eliminar puntuación extra al final
    cleanName = cleanName.replace(/[\-–\.,;:]+$/, '').trim();
    
    console.log(`Nombre original: "${trackName}" -> Limpiado: "${cleanName}"`);
    
    return cleanName;
}