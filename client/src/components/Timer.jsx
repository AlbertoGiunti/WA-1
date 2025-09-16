import { useMemo, useEffect, useRef } from 'react';
import useTick from '../hooks/useTick.js';

/**
 * Timer component that displays and manages the game countdown timer
 * Handles timeout detection and triggers appropriate callbacks when time expires
 * @param {Object} match - Current match object containing timing information
 * @param {Function} onTimeUp - Callback function triggered when timer reaches zero
 */
export default function Timer({ match, onTimeUp }) {
  const now = useTick(500, match && match.status === 'playing');
  const timeoutHandled = useRef(false);
  
  // Calculate remaining seconds based on match end time
  const secondsLeft = useMemo(() => {
    if (!match) return null;
    return Math.max(0, match.endsAt - Math.floor(now / 1000));
  }, [match, now]);

  const timeUp = secondsLeft === 0;
  
  // Reset timeout handling flag when match changes or game is not active
  useEffect(() => {
    if (!timeUp || !match || match.status !== 'playing') {
      timeoutHandled.current = false;
    }
  }, [timeUp, match]);
  
  // Trigger timeout callback when time expires (only once per match)
  useEffect(() => {
    if (timeUp && match && match.status === 'playing' && onTimeUp && !timeoutHandled.current) {
      timeoutHandled.current = true;
      onTimeUp();
    }
  }, [timeUp, match?.id, match?.status]);

  /**
   * Formats seconds into MM:SS format
   * @param {number} seconds - Seconds to format
   * @returns {string} Formatted time string
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if no active match
  if (!match) return null;

  return (
    <div className={`timer-display ${secondsLeft <= 10 ? 'timer-warning' : ''}`}>
      ⏰ {secondsLeft ?? '-'}s
    </div>
  );
}