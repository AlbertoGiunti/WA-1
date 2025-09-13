import { Modal, Button } from 'react-bootstrap';

/**
 * AbandonMatchModal - Reusable atomic component for match abandonment confirmation
 * 
 * This component provides a standardized modal dialog for confirming match abandonment
 * across different contexts (abandon button, home navigation, etc.)
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {function} onConfirm - Callback when user confirms abandonment
 * @param {function} onCancel - Callback when user cancels
 * @param {string} title - Modal title
 * @param {string} message - Main confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Abandon")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {boolean} showWarning - Whether to show warning alert (default: false)
 */
const AbandonMatchModal = ({ 
  show, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = "Abandon",
  cancelText = "Cancel",
  showWarning = false,
  isGuest = false  // New prop for guest mode
}) => {
  
  // Default values based on mode
  const defaultTitle = isGuest ? "🏃‍♂️ Leave Game?" : "🏃‍♂️ Abandon Match?";
  const defaultMessage = isGuest 
    ? "Are you sure you want to leave this game? Your progress will be lost."
    : "Are you sure you want to abandon this match? You'll lose coins and the match will be marked as lost.";
  
  const modalTitle = title || defaultTitle;
  const modalMessage = message || defaultMessage;
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{modalMessage}</p>
        {showWarning && (
          <div className="alert alert-warning" role="alert">
            <small>
              ⚠️ <strong>Warning:</strong> You will lose your progress and the sentence will not be revealed.
              {!isGuest && " You will also lose coins as penalty."}
            </small>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AbandonMatchModal;