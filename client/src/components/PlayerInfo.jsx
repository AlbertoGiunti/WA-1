import { Badge } from 'react-bootstrap';

/**
 * PlayerInfo component - Displays player information as badges (username/guest, coins)
 * @param {boolean} isGuest - Whether this is a guest player
 * @param {Object} user - User object with username and coins information
 */
export default function PlayerInfo({ isGuest, user }) {
  return (
    <div className="d-flex align-items-center gap-2">
      {/* Username or Guest badge */}
      <Badge bg={isGuest ? "secondary" : "primary"} className="fs-6">
        {isGuest ? "👤 Guest" : user?.username || "Player"}
      </Badge>
      
      {/* Coins badge - only for authenticated users */}
      {!isGuest && (
        <Badge bg="success" className="fs-6">
          💰 Coins: {user?.coins || 0}
        </Badge>
      )}
    </div>
  );
}