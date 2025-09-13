import { useState, useEffect } from 'react';

/**
 * Custom hook that returns the current timestamp and updates it at specified intervals
 * @param {number} interval - The interval in milliseconds to update the timestamp
 * @param {boolean} enabled - Whether the tick should be active
 * @returns {number} The current timestamp in milliseconds
 */
export default function useTick(interval = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    
    const timer = setInterval(() => {
      setNow(Date.now());
    }, interval);

    return () => clearInterval(timer);
  }, [interval, enabled]);

  return now;
}