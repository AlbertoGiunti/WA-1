import { useState, useEffect } from 'react';

/**
 * Custom hook that returns the current timestamp and updates it at specified intervals
 * @param {number} interval - The interval in milliseconds to update the timestamp
 * @returns {number} The current timestamp in milliseconds
 */
export default function useTick(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return now;
}