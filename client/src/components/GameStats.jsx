import { Badge } from 'react-bootstrap';

/**
 * GameStats component - Displays game statistics as badges (letters used, vowels, etc.)
 * @param {Object} match - Current match object
 * @param {boolean} isGuest - Whether this is a guest game
 */
export default function GameStats({ match, isGuest }) {
  if (!match) return null;

  return (
    <div className="d-flex align-items-center justify-content-end gap-2">
      {/* Letters used badge */}
      <Badge bg="info" className="fs-6">
        📝 Letters: {match.guessedLetters?.length || 0}
      </Badge>
      
      {/* Vowel used badge - only if vowel was used */}
      {match.usedVowel && (
        <Badge bg="warning" className="fs-6">
          🔤 Vowel Used
        </Badge>
      )}
    </div>
  );
}