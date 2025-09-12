import { useState } from 'react';
import { Card, Form, Button, InputGroup } from 'react-bootstrap';

export default function GuessSentence({ disabled, onGuess, compact = false }) {
  const [txt, setTxt] = useState('');
  
  const submit = (e) => {
    e.preventDefault();
    if (!txt.trim()) return;
    onGuess(txt.toUpperCase());
    setTxt('');
  };

  if (compact) {
    return (
      <Form onSubmit={submit}>
        <InputGroup size="sm">
          <Form.Control
            type="text"
            placeholder="Guess the full sentence..."
            value={txt}
            onChange={(e) => setTxt(e.target.value.toUpperCase())}
            disabled={disabled}
          />
          <Button 
            variant="success" 
            type="submit" 
            disabled={disabled || !txt.trim()}
            size="sm"
          >
            🎯 Guess!
          </Button>
        </InputGroup>
      </Form>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">💭 Guess the Full Sentence</h5>
      </Card.Header>
      <Card.Body className="py-3">
        <Form onSubmit={submit}>
          <InputGroup className="mb-2">
            <Form.Control
              type="text"
              placeholder="TYPE THE COMPLETE SENTENCE HERE..."
              value={txt}
              onChange={(e) => setTxt(e.target.value.toUpperCase())}
              disabled={disabled}
              size="lg"
            />
            <Button 
              variant="success" 
              type="submit" 
              disabled={disabled || !txt.trim()}
              size="lg"
            >
              🎯 Guess!
            </Button>
          </InputGroup>
        </Form>
        <div className="text-center text-muted">
          <small>
            ✨ If you guess the complete sentence correctly, you win instantly!
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}
