import { Button } from 'react-bootstrap';

/**
 * GameControls component - Handles game control buttons (abandon, home, etc.)
 * @param {Object} match - Current match object
 * @param {boolean} finished - Whether the game is finished
 * @param {Function} onAbandon - Callback for abandon action
 * @param {Function} onGoHome - Callback for going home
 */
export default function GameControls({ match, finished, onAbandon, onGoHome }) {
  if (!match) return null;

  return (
    <div className="d-flex justify-content-center">
      {(match.status === 'won' || match.status === 'lost') ? (
        <Button 
          variant={match.status === 'won' ? 'success' : 'danger'} 
          onClick={onGoHome}
        >
          🏠 Home
        </Button>
      ) : (
        <Button 
          variant="outline-danger" 
          onClick={onAbandon} 
          disabled={finished}
        >
          🏃‍♂️ Abandon
        </Button>
      )}
    </div>
  );
}