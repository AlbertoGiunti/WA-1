import { Badge } from 'react-bootstrap';

/**
 * PlayerInfo component that displays player identification and coin balance
 * Shows appropriate badges for guest vs authenticated users with different styling
 * @param {boolean} isGuest - Whether this is a guest player session
 * @param {Object} user - User object containing username and coins information
 */
export default function PlayerInfo({ isGuest, user }) {
  return (
    <div className="d-flex align-items-center gap-2">
      {/* Player identification badge */}
      <Badge bg={isGuest ? "secondary" : "primary"} className="fs-6">
        {isGuest ? "👤 Guest" : user?.username || "Player"}
      </Badge>
      
      {/* Coin balance badge - only displayed for authenticated users */}
      {!isGuest && (
        <Badge bg="success" className="fs-6">
          💰 Coins: {user?.coins || 0}
        </Badge>
      )}
    </div>
  );
}