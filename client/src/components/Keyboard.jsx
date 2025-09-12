import { Card, Badge, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { getLetterCosts } from '../api.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Function to get color based on cost - Same scheme as Butterfly component
function getCostColor(cost) {
  switch (cost) {
    case 10: return '#0d6efd';    // Blue for vowels
    case 5:  return '#00d221';    // Green for tier 5
    case 4:  return '#8fbc8f';    // Light green for tier 4
    case 3:  return '#ffd700';    // Yellow for tier 3
    case 2:  return '#ff8c00';    // Orange for tier 2
    case 1:  return '#dc3545';    // Red for tier 1
    default: return '#6c757d';    // Default gray
  }
}

export default function Keyboard({ guessed, usedVowel, disabled, onPick, showCosts = true }) {
  const [letterCosts, setLetterCosts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLetterCosts = async () => {
      try {
        const costs = await getLetterCosts();
        setLetterCosts(costs);
      } catch (error) {
        console.error('Failed to fetch letter costs:', error);
        // Fallback to default costs if API fails
        const fallbackCosts = {};
        LETTERS.forEach(letter => {
          if (VOWELS.has(letter)) {
            fallbackCosts[letter] = 10;
          } else {
            // Approximate costs for consonants
            const tier5 = new Set(['T','N','S','H','R']);
            const tier4 = new Set(['D','L','C']);
            const tier3 = new Set(['U','M','W','F']);
            const tier2 = new Set(['G','Y','P','B','V','K']);
            if (tier5.has(letter)) fallbackCosts[letter] = 5;
            else if (tier4.has(letter)) fallbackCosts[letter] = 4;
            else if (tier3.has(letter)) fallbackCosts[letter] = 3;
            else if (tier2.has(letter)) fallbackCosts[letter] = 2;
            else fallbackCosts[letter] = 1;
          }
        });
        setLetterCosts(fallbackCosts);
      } finally {
        setLoading(false);
      }
    };

    fetchLetterCosts();
  }, []);

  const renderLetter = (letter) => {
    const isGuessed = guessed.has(letter);
    const isVowel = VOWELS.has(letter);
    const cost = letterCosts[letter] || (isVowel ? 10 : 2);
    const canPick = !disabled && !isGuessed && (!isVowel || !usedVowel);
    
    // Calculate color based on cost
    const backgroundColor = getCostColor(cost);
    const isDisabled = !canPick || isGuessed;

    return (
      <Col key={letter} xs={2} sm={2} md={1} className="mb-2">
        <div
          className={`letter-badge w-100 p-2 text-center`}
          onClick={() => canPick && onPick(letter)}
          style={{
            backgroundColor: isDisabled ? '#e9ecef' : backgroundColor,
            border: `2px solid ${isDisabled ? '#dee2e6' : backgroundColor}`,
            color: isDisabled ? '#6c757d' : 'white',
            cursor: canPick ? 'pointer' : 'not-allowed',
            opacity: isGuessed ? 0.6 : 1,
            fontSize: '0.9rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            minHeight: '50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: canPick ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            transform: canPick ? 'scale(1)' : 'scale(0.95)'
          }}
          onMouseEnter={(e) => {
            if (canPick) {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (canPick) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          }}
        >
          <div>{letter}</div>
          {showCosts && (
            <small style={{ fontSize: '0.7rem' }}>
              {cost}💰
            </small>
          )}
        </div>
      </Col>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">🔤 Letters Keyboard</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center p-3">
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            Loading letter costs...
          </div>
        ) : (
          <>
            <Row className="g-1">
              {LETTERS.map(renderLetter)}
            </Row>
            <div className="mt-3 text-center">
              <small className="text-muted">
                💰 Letter costs: 
                <span style={{ color: '#0d6efd' }}> Vowels(10)</span> |
                <span style={{ color: '#00d221' }}> Common(5)</span> |
                <span style={{ color: '#8fbc8f' }}> Medium(4)</span> |
                <span style={{ color: '#ffd700' }}> Less(3)</span> |
                <span style={{ color: '#ff8c00' }}> Rare(2)</span> |
                <span style={{ color: '#dc3545' }}> Very Rare(1)</span>
                {usedVowel && (
                  <span className="text-warning d-block mt-1">
                    ⚠️ Vowel already used in this match
                  </span>
                )}
              </small>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}