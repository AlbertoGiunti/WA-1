import { Card, Badge } from 'react-bootstrap';

/**
 * PlayerInfo component - Displays player information (coins, guest mode, etc.)
 * @param {boolean} isGuest - Whether this is a guest player
 * @param {Object} user - User object with coins information
 */
export default function PlayerInfo({ isGuest, user }) {
  return (
    <Card className="text-center">
      <Card.Body>
        <h6 className="text-muted mb-1">
          {isGuest ? 'Guest Mode' : 'Player'}
        </h6>
        <div className="fs-5">
          {isGuest ? (
            <Badge bg="secondary">👤 Guest</Badge>
          ) : (
            <>
              <span className="me-2">💰</span>
              {user?.coins || 0}
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}