// client/src/components/Butterfly.jsx
import { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { api } from '../api';

// Function to get custom CSS colors for letter cost visualization - Uses CSS variables
function getCostColor(cost) {
  const root = document.documentElement;
  switch (cost) {
    case 10: return getComputedStyle(root).getPropertyValue('--letter-cost-vowel').trim();
    case 5:  return getComputedStyle(root).getPropertyValue('--letter-cost-common').trim();
    case 4:  return getComputedStyle(root).getPropertyValue('--letter-cost-medium').trim();
    case 3:  return getComputedStyle(root).getPropertyValue('--letter-cost-less').trim();
    case 2:  return getComputedStyle(root).getPropertyValue('--letter-cost-rare').trim();
    case 1:  return getComputedStyle(root).getPropertyValue('--letter-cost-very-rare').trim();
    default: return getComputedStyle(root).getPropertyValue('--letter-cost-default').trim();
  }
}

export default function Butterfly() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const data = await api.getButterfly(); // [{letter,frequency,cost}]
      // Normalize letter to UPPERCASE for consistency with the rest of the app
      setLetters(data.map(x => ({ ...x, letter: String(x.letter).toUpperCase() })));
    } catch (e) {
      setErr(e.message || 'Error fetching random letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card className="h-100 shadow-sm border-0" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
      <Card.Header className="text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0 w-100 text-center">🦋 Letter Costs & Frequencies</h5>
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {err && <div className="text-danger text-center mb-2 small">{err}</div>}
        {loading ? (
          <div className="text-center">Loading letters...</div>
        ) : (
          <>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {letters.map((it, idx) => (
                <div key={idx} className="text-center" style={{ minWidth: 54 }}>
                  <div
                    style={{ 
                      backgroundColor: getCostColor(it.cost),
                      border: 'none',
                      color: it.cost === 'black', 
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      minHeight: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title={`Frequency: ${it.frequency}% | Cost: ${it.cost} coins`}
                  >
                    {it.letter}
                  </div>
                  <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                    freq: {it.frequency}%
                  </div>
                  <div className="small fw-bold" style={{ fontSize: '0.7rem', color: getCostColor(it.cost) }}>
                    💰 {it.cost}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-3">
              <Button size="sm" variant="outline-primary" onClick={load}>
                Refresh
              </Button>
            </div>
          </>
        )}

        <hr className="my-3" />
        <div className="small text-muted text-center" style={{ fontSize: '0.8rem' }}>
          <strong>Cost Tiers:</strong>
          <div className="mt-1">
            <span style={{ 
              backgroundColor: 'var(--letter-cost-vowel)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              marginRight: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>10💰 Vowels</span>
            <span style={{ 
              backgroundColor: 'var(--letter-cost-common)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              marginRight: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>5💰 Common</span>
            <span style={{ 
              backgroundColor: 'var(--letter-cost-medium)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              marginRight: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>4💰 Medium</span>
          </div>
          <div className="mt-2">
            <span style={{ 
              backgroundColor: 'var(--letter-cost-less)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              marginRight: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>3💰 Less</span>
            <span style={{ 
              backgroundColor: 'var(--letter-cost-rare)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              marginRight: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>2💰 Rare</span>
            <span style={{ 
              backgroundColor: 'var(--letter-cost-very-rare)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              marginRight: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>1💰 Very Rare</span>
          </div>
          <em className="d-block mt-2">Letter costs based on frequency in English text.</em>
        </div>
      </Card.Body>
    </Card>
  );
}
