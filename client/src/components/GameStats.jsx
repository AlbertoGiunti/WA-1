import { Card, Badge } from 'react-bootstrap';

/**
 * GameStats component - Displays game statistics (letters used, vowels, etc.)
 * @param {Object} match - Current match object
 * @param {boolean} isGuest - Whether this is a guest game
 */
export default function GameStats({ match, isGuest }) {
  if (!match) return null;

  return (
    <Card className="text-center">
      <Card.Body>
        <h6 className="text-muted mb-1">Letters Used</h6>
        <div className="fs-5">
          📝 {match.guessedLetters?.length || 0}
          {match.usedVowel && (
            <Badge bg="info" className="ms-2">Vowel Used</Badge>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}