import React, { useEffect, useState, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  characters?: string;
  speed?: number;
  className?: string;
  autoPlay?: boolean;
}

const GLYPHS = '0123456789ABCDEF$#@%&*+=~';

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  characters = GLYPHS,
  speed = 30,
  className = '',
  autoPlay = true,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const isScrambling = useRef(false);

  const scramble = () => {
    if (isScrambling.current) return;
    isScrambling.current = true;
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        isScrambling.current = false;
        setDisplayText(text);
      }

      iteration += 1 / 2;
    }, speed);
  };

  useEffect(() => {
    if (autoPlay) {
      scramble();
    }
  }, [text]);

  return (
    <span
      onMouseEnter={scramble}
      className={`font-mono cursor-default select-none ${className}`}
    >
      {displayText}
    </span>
  );
};
