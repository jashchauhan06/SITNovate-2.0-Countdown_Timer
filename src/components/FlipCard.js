import React, { useState, useEffect } from 'react';

function FlipCard({ value }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(value);

  useEffect(() => {
    if (value !== displayValue) {
      setNextValue(value);
      setIsFlipping(true);
      
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className={`flip-card ${isFlipping ? 'flip' : ''}`}>
      <div className="flip-card-inner">
        <div className="flip-card-front">{displayValue}</div>
        <div className="flip-card-back">{nextValue}</div>
      </div>
    </div>
  );
}

export default FlipCard;
