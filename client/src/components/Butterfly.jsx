import { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';

const API_BASE = 'http://localhost:3002/api';

function Butterfly() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomLetters();
  }, []);

  const fetchRandomLetters = async () => {
    try {
      const response = await fetch(`${API_BASE}/letters/random`);
      const data = await response.json();
      setLetters(data);
    } catch (error) {
      console.error('Error fetching random letters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyColor = (frequency) => {
    if (frequency >= 10) return 'danger'; // Vowels
    if (frequency >= 4) return 'warning'; // High frequency consonants
    if (frequency >= 2) return 'info'; // Medium frequency
    return 'secondary'; // Low frequency
  };

  const getFrequencyLabel = (frequency) => {
    if (frequency >= 10) return 'Vowel';
    if (frequency >= 4) return 'High';
    if (frequency >= 2) return 'Medium';
    return 'Low';
  };

  return (
    <Card className="h-100">
      <Card.Header className="text-center">
        <h5 className="mb-0">🦋 Letter Frequencies</h5>
      </Card.Header>
      <Card.Body className="p-2">
        {loading ? (
          <div className="text-center">Loading letters...</div>
        ) : (
          <div className="d-flex flex-wrap gap-1 justify-content-center">
            {letters.map((letter, index) => (
              <div key={index} className="text-center" style={{minWidth: '45px'}}>
                <Badge 
                  bg={getFrequencyColor(letter.frequency)} 
                  className="fs-6 p-1 mb-1 d-block"
                  style={{ fontSize: '0.75rem' }}
                >
                  {letter.letter}
                </Badge>
                <div className="small text-muted" style={{fontSize: '0.65rem'}}>
                  {letter.frequency}
                </div>
                <div className="small text-muted" style={{fontSize: '0.6rem'}}>
                  {getFrequencyLabel(letter.frequency)}
                </div>
              </div>
            ))}
          </div>
        )}
        <hr className="my-2" />
        <div className="small text-muted" style={{fontSize: '0.7rem'}}>
          <strong>Letter Costs:</strong>
          <div className="mt-1">
            <div><Badge bg="danger" className="me-1">Vowels</Badge> 10 coins</div>
            <div><Badge bg="warning" className="me-1">High</Badge> 5 coins</div>
            <div><Badge bg="info" className="me-1">Med</Badge> 2-4 coins</div>
            <div><Badge bg="secondary" className="me-1">Low</Badge> 1 coin</div>
          </div>
          <em className="d-block mt-1">Only one vowel per match!</em>
        </div>
      </Card.Body>
    </Card>
  );
}

export default Butterfly;

// "I can't go back to yesterday because I was a different person then." - Alice in Wonderland
