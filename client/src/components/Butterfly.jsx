// client/src/components/Butterfly.jsx
import { useState, useEffect } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { api } from '../api';

function freqColor(f) {
  // euristica: frequenze alte = più “calde”
  if (f >= 10) return 'danger';     // vowels tipicamente
  if (f >= 6)  return 'warning';    // high
  if (f >= 2)  return 'info';       // medium
  return 'secondary';               // low
}

export default function Butterfly() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const data = await api.getButterfly(); // [{letter,frequency,cost}]
      // normalizza lettera in UPPERCASE per coerenza col resto dell'app
      setLetters(data.map(x => ({ ...x, letter: String(x.letter).toUpperCase() })));
    } catch (e) {
      setErr(e.message || 'Error fetching random letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card className="h-100 shadow-sm border-0">
      <Card.Header className="text-center">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0 w-100 text-center">🦋 Letter Frequencies</h5>
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
                  <Badge
                    bg={freqColor(it.frequency)}
                    className="fs-5 p-2 mb-1 d-block"
                    title={`Cost: ${it.cost}`}
                  >
                    {it.letter}
                  </Badge>
                  <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                    {it.frequency}
                  </div>
                  <div className="small" style={{ fontSize: '0.7rem' }}>
                    cost: <strong>{it.cost}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-3">
              <Button size="sm" variant="outline-secondary" onClick={load}>
                Refresh
              </Button>
            </div>
          </>
        )}

        <hr className="my-3" />
        <div className="small text-muted" style={{ fontSize: '0.8rem' }}>
          <strong>Legend:</strong>
          <div className="mt-1">
            <Badge bg="danger" className="me-1">High 10+</Badge>
            <Badge bg="warning" className="me-1">High 6–9</Badge>
            <Badge bg="info" className="me-1">Med 2–5</Badge>
            <Badge bg="secondary" className="me-1">Low &lt;2</Badge>
          </div>
          <em className="d-block mt-2">Only one vowel per match. Vowels cost 10.</em>
        </div>
      </Card.Body>
    </Card>
  );
}
