import { Row, Col } from 'react-bootstrap';
import PlayerInfo from './PlayerInfo.jsx';
import Timer from './Timer.jsx';
import GameStats from './GameStats.jsx';

/**
 * GameHeader component - Displays the top section with player info, timer, and stats
 * @param {boolean} isGuest - Whether this is a guest game
 * @param {Object} user - User object
 * @param {Object} match - Current match object
 * @param {Function} onTimeUp - Callback when time runs out
 */
export default function GameHeader({ isGuest, user, match, onTimeUp }) {
  return (
    <Row className="mb-4">
      {/* Player Info */}
      <Col md={4}>
        <PlayerInfo isGuest={isGuest} user={user} />
      </Col>
      
      {/* Timer - only show when match is active */}
      {match && (
        <Col md={4}>
          <Timer match={match} onTimeUp={onTimeUp} />
        </Col>
      )}
      
      {/* Game Stats - only show when match is active */}
      {match && (
        <Col md={4}>
          <GameStats match={match} isGuest={isGuest} />
        </Col>
      )}
    </Row>
  );
}