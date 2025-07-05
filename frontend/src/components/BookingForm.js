import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap'; // Import Bootstrap components
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router-dom
import { createBooking } from '../api'; // Your API service for booking

// Import the terms content from the new dedicated file
import { TERMS_AND_CONDITIONS_CONTENT } from '../constants/termsAndConditions';
 // Adjust path if your 'constants' folder is elsewhere

const BookingForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false); // State for the main form checkbox
  const [error, setError] = useState('');

  // States for the modal
  const [showTermsModal, setShowTermsModal] = useState(false); // Controls modal visibility
  const [modalTermsAccepted, setModalTermsAccepted] = useState(false); // State for checkbox INSIDE the modal
  const [modalError, setModalError] = useState(''); // Error message for modal validation

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Client-side validation: Check if terms are accepted before sending
    if (!termsAccepted) {
      setError('You must accept the terms and conditions to submit the booking.');
      return; // Prevent form submission
    }
    if (!title || !date || !startTime || !endTime) {
      setError('Please fill in all required fields: Title, Date, Start Time, End Time.');
      return;
    }

    // Basic time validation (more robust validation happens on the backend)
    if (startTime && endTime && startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }

    try {
      await createBooking({ title, description, date, startTime, endTime, termsAccepted });
      navigate('/Thankyou'); // Redirect to thank you page on success
    } catch (err) {
      // Handle backend errors (e.g., overlap)
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Booking failed. Please try again.');
    }
  };

  // Handler for "Accept & Close" button inside the modal
  const handleAcceptTermsInModal = () => {
    if (modalTermsAccepted) {
      setTermsAccepted(true); // Automatically check the main form's checkbox
      setShowTermsModal(false); // Close the modal
      setModalError(''); // Clear any modal-specific error
    } else {
      setModalError('You must check the box to accept the terms.'); // Show error inside modal
    }
  };

  // Handler for just "Close" button or clicking outside the modal
  const handleCloseModal = () => {
    setShowTermsModal(false);
    setModalTermsAccepted(false); // Reset modal's checkbox state when closing without accepting
    setModalError(''); // Clear any modal-specific error
  };

  return (
    <div className="container mt-5">
      <h3>Create New Booking</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDescription">
          <Form.Label>Description (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Describe your event"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDate">
          <Form.Label>Date</Form.Label>
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Form.Group>

        <div className="row mb-3">
          <Form.Group as={Form.Col} controlId="formStartTime">
            <Form.Label>Start Time</Form.Label>
            <Form.Control
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group as={Form.Col} controlId="formEndTime">
            <Form.Label>End Time</Form.Label>
            <Form.Control
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </Form.Group>
        </div>

        {/* This is the main form checkbox */}
        <div className="mb-3 form-check">
          <Form.Check
            type="checkbox"
            id="termsAccepted"
            label={
              <>
                I accept the{' '}
                <span
                  className="text-primary"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => {
                    // Prevent the checkbox itself from toggling when the text is clicked
                    e.preventDefault();
                    setShowTermsModal(true); // Open the modal
                  }}
                >
                  terms and conditions
                </span>
              </>
            }
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)} // Allows direct check/uncheck
            required // Ensures HTML5 validation prevents submission if unchecked
          />
        </div>

        <Button variant="primary" type="submit">
          Submit Booking
        </Button>
      </Form>

      {/* Terms and Conditions Modal */}
      <Modal show={showTermsModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Terms and Conditions for Hall Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Render the HTML content of terms */}
          <div dangerouslySetInnerHTML={{ __html: TERMS_AND_CONDITIONS_CONTENT }} />
          <hr className="my-3" />

          {/* Checkbox inside the modal */}
          <Form.Check
            type="checkbox"
            id="modalTermsAccepted"
            label="I have read and agree to the terms and conditions."
            checked={modalTermsAccepted}
            onChange={(e) => setModalTermsAccepted(e.target.checked)}
            className="mt-3"
          />
          {modalError && <div className="alert alert-danger mt-2">{modalError}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleAcceptTermsInModal}
            // disabled={!modalTermsAccepted} // Optional: disable button if modalTermsAccepted is false
          >
            Accept & Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookingForm;