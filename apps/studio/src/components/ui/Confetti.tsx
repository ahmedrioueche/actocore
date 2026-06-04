import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  animationDelay: number;
  color: string;
}

const Confetti: React.FC = () => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = [
      'bg-green-400',
      'bg-emerald-400',
      'bg-blue-400',
      'bg-indigo-400',
      'bg-purple-400',
      'bg-pink-400',
      'bg-yellow-400',
      'bg-orange-400',
    ];

    const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(pieces);
  }, []);

  return (
    <div className='absolute inset-0 pointer-events-none overflow-hidden'>
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={`confetti ${piece.color} rounded-sm`}
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
