import { useMemo, useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import useTick from '../hooks/useTick.js';

/**
 * Timer component - Manages game timer display and logic
 * @param {Object} match - Current match object
 * @param {Function} onTimeUp - Callback when time runs out
 */
export default function Timer({ match, onTimeUp }) {
  const now = useTick(500, match && match.status === 'playing');
  const timeoutHandled = useRef(false);
  
  const secondsLeft = useMemo(() => {
    if (!match) return null;
    return Math.max(0, match.endsAt - Math.floor(now / 1000));
  }, [match, now]);

  const timeUp = secondsLeft === 0;
  
  // Reset timeout flag when match changes or is not finished
  useEffect(() => {
    if (!timeUp || !match || match.status !== 'playing') {
      timeoutHandled.current = false;
    }
  }, [timeUp, match]);
  
  // Call onTimeUp callback when time runs out (only once)
  useEffect(() => {
    if (timeUp && match && match.status === 'playing' && onTimeUp && !timeoutHandled.current) {
      console.log('⏰ Timer: Calling onTimeUp (first time)');
      timeoutHandled.current = true;
      onTimeUp();
    }
  }, [timeUp, match?.id, match?.status]); // Removed onTimeUp from dependencies

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!match) return null;

  return (
    <Card className="text-center">
      <Card.Body>
        <h6 className="text-muted mb-1">Time Left</h6>
        <div className={`fs-4 ${timeUp ? 'text-danger' : secondsLeft <= 10 ? 'text-warning' : 'text-success'}`}>
          ⏰ {formatTime(secondsLeft)}
        </div>
      </Card.Body>
    </Card>
  );
}