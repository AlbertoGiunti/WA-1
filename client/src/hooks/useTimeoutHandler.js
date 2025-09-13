import { useState, useEffect } from 'react';

/**
 * Hook for handling game timeouts
 * @param {Object} match - Current match object
 * @param {boolean} timeUp - Whether time is up
 * @param {Function} onTimeout - Callback when timeout occurs
 * @returns {boolean} isHandlingTimeout - Whether timeout is currently being handled
 */
export default function useTimeoutHandler(match, timeUp, onTimeout) {
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);

  useEffect(() => {
    if (match && match.status === 'playing' && timeUp && !isHandlingTimeout && onTimeout) {
      setIsHandlingTimeout(true);
      
      const handleTimeout = async () => {
        try {
          await onTimeout();
        } catch (error) {
          console.error('Error handling timeout:', error);
        } finally {
          setIsHandlingTimeout(false);
        }
      };

      handleTimeout();
    }
  }, [match?.id, match?.status, timeUp, isHandlingTimeout, onTimeout]);

  return isHandlingTimeout;
}