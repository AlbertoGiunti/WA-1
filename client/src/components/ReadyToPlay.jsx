import { Card, Button, Alert } from 'react-bootstrap';

/**
 * ReadyToPlay component - Displays the "ready to play" screen
 * @param {boolean} isGuest - Whether this is guest mode
 * @param {Function} onStart - Callback to start a new game
 * @param {string} message - Optional message to display
 */
export default function ReadyToPlay({ isGuest, onStart, message }) {
  return (
    <Card className="mb-4">
      <Card.Body className="text-center py-5">
        <h2 className="mb-3">
          {isGuest ? '👤 Guest Mode' : '🎮 Ready to Play!'}
        </h2>
        <p className="text-muted mb-4">
          {isGuest 
            ? 'Play without registration - no coins, no pressure!' 
            : 'Guess the hidden sentence by revealing letters!'
          }
        </p>
        <Button variant="primary" size="lg" onClick={onStart}>
          🎯 Start Game
        </Button>
        {message && (
          <Alert 
            variant={message.includes('Error') ? 'danger' : 'info'} 
            className="mt-3"
          >
            {message}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}