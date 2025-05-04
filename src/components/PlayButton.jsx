import React from 'react';

const PlayButton = ({ onClick, size = 'large' }) => {
  const sizeClasses = size === 'large' 
    ? 'w-80 h-80' // Aumentado de w-48 h-48 a w-80 h-80 (de 12rem a 20rem)
    : 'w-20 h-20'; // Aumentado proporcionalmente el tamaño pequeño también
    
  // Crear IDs únicos para evitar conflictos con múltiples instancias del SVG
  const buttonId = React.useId();
  const topPathId = `topPath-${buttonId}`;
  const bottomPathId = `bottomPath-${buttonId}`;
  const darkGradientId = `darkGradient-${buttonId}`;
  const subtleGreenId = `subtleGreen-${buttonId}`;
  const playGradientId = `playGradient-${buttonId}`;
  const circleClipId = `circleClip-${buttonId}`;
  const outerGlowId = `outerGlow-${buttonId}`;

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-full flex items-center justify-center hover:scale-105 transform transition-transform border-2 border-green-400/30 relative`}
      style={{
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(0, 0, 0, 0.5)',
      }}
      aria-label="Reproducir"
    >
      {/* Efecto de brillo sutil en el borde */}
      <div 
        className="absolute inset-0 rounded-full z-0 opacity-60" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 60%, rgba(52, 211, 153, 0.2) 80%, rgba(52, 211, 153, 0.05) 100%)',
        }}
      ></div>
      
      <svg viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
        <defs>
          <radialGradient id={darkGradientId} cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </radialGradient>
          
          <linearGradient id={subtleGreenId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#19a349" />
            <stop offset="100%" stopColor="#15864d" />
          </linearGradient>
          
          <linearGradient id={playGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#333333" />
            <stop offset="100%" stopColor="#1e1e1e" />
          </linearGradient>
          
          {/* Resplandor exterior */}
          <filter id={outerGlowId}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#19a349" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Trayectorias circulares para textos */}
          <path id={topPathId} d="M14,84 A70,70 0 1,1 154,84" />
          <path id={bottomPathId} d="M154,84 A70,70 0 1,1 14,84" />
          
          <clipPath id={circleClipId}>
            <circle cx="84" cy="84" r="26" />
          </clipPath>
        </defs>
        
        {/* Círculo principal con degradado */}
        <circle cx="84" cy="84" r="84" fill={`url(#${darkGradientId})`}/>
        
        {/* Fechas en verde siguiendo la curvatura del círculo */}
        <g fontFamily="'Segoe UI', sans-serif" fontWeight="400" letterSpacing="0.5" fill={`url(#${subtleGreenId})`} filter={`url(#${outerGlowId})`}>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${topPathId}`} startOffset="0%">1950</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${topPathId}`} startOffset="25%">1970</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${topPathId}`} startOffset="50%">1987</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${topPathId}`} startOffset="75%">1990</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${bottomPathId}`} startOffset="0%">2000</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${bottomPathId}`} startOffset="25%">2010</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${bottomPathId}`} startOffset="50%">2020</textPath>
          </text>
          <text fontSize="11" opacity="0.9">
            <textPath href={`#${bottomPathId}`} startOffset="75%">2025</textPath>
          </text>
        </g>
        
        {/* Icono de play en el centro con ondas de Spotify */}
        <g>
          {/* Sombreado para el círculo verde central */}
          <circle cx="84" cy="84" r="28" fill="rgba(0,0,0,0.3)" filter="blur(3px)" />
          
          <circle cx="84" cy="84" r="26" fill={`url(#${subtleGreenId})`} />
          
          <g clipPath={`url(#${circleClipId})`}>
            <path d="M84 70
                   C101 70, 116 78, 124 92
                   C115 79, 101 72, 84 72
                   C67 72, 53 79, 45 92
                   C52 78, 67 70, 84 70Z" 
                fill="#0a0a0a" fillOpacity="0.15" stroke="none"/>
            
            <path d="M84 82
                   C96 82, 106 87, 112 97
                   C105 88, 96 84, 84 84
                   C72 84, 63 88, 57 97
                   C62 87, 72 82, 84 82Z" 
                fill="#0a0a0a" fillOpacity="0.15" stroke="none"/>
            
            <path d="M84 94
                   C91 94, 98 97, 101 103
                   C97 98, 91 96, 84 96
                   C77 96, 71 98, 68 103
                   C70 97, 77 94, 84 94Z" 
                fill="#0a0a0a" fillOpacity="0.15" stroke="none"/>
          </g>
          
          <path d="M77,72 C75.5,71 74,71.5 74,74 V94 C74,96.5 75.5,97 77,96 L97,86 C98.5,85 98.5,83 97,82 L77,72Z" 
                fill={`url(#${playGradientId})`} />
        </g>
      </svg>
    </button>
  );
};

export default PlayButton;