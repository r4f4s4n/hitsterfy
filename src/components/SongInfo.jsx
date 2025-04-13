import React from 'react';

const SongInfo = ({ year, artist, name }) => {
  return (
    <div className="post-it mx-auto my-8 max-w-sm transform rotate-1">
      <div className="year text-center">{year}</div>
      <div className="artist text-center">{artist}</div>
      <div className="song text-center">{name}</div>
    </div>
  );
};

export default SongInfo;