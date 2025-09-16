import { useState } from 'react';
import { Card, Form, Button, InputGroup } from 'react-bootstrap';

/**
 * Component for guessing the complete sentence in the word game
 * Allows users to attempt to solve the puzzle by typing the full sentence
 * Provides both compact and full layouts for different UI contexts
 * @param {boolean} disabled - Whether the input is disabled (game over/timeout)
 * @param {Function} onGuess - Callback function when sentence is submitted
 * @param {boolean} compact - Whether to render in compact mode for status bars
 */
export default function GuessSentence({ disabled, onGuess, compact = false }) {
  const [txt, setTxt] = useState('');
  
  /**
   * Handles form submission by processing the guess and clearing input
   * @param {Event} e - Form submission event
   */
  const submit = (e) => {
    e.preventDefault();
    if (!txt.trim()) return;
    onGuess(txt.toUpperCase());
    setTxt('');
  };

  // Render compact version for embedding in status bars or tight spaces
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

  // Render full card layout for main game interface
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
        
        {/* Instructional text for user guidance */}
        <div className="text-center text-muted">
          <small>
            ✨ If you guess the complete sentence correctly, you win instantly!
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}
