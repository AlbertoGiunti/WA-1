import { useState } from 'react';
import { Card, Form, Button, InputGroup } from 'react-bootstrap';

export default function GuessSentence({ disabled, onGuess }) {
  const [txt, setTxt] = useState('');
  
  const submit = (e) => {
    e.preventDefault();
    if (!txt.trim()) return;
    onGuess(txt.toUpperCase());
    setTxt('');
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">💭 Guess the Full Sentence</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={submit}>
          <InputGroup className="mb-3">
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
