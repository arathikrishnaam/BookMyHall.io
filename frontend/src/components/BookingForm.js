// src/components/BookingForm.js
import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap'; // Import Bootstrap components
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router-dom
import { createBooking } from '../api'; // Your API service for booking

// Import the terms content from the new dedicated file
import { TERMS_AND_CONDITIONS_CONTENT } from '../constants/termsAndConditions';
 // Adjust path if your 'constants' folder is elsewhere

const BookingForm = () => {
  // Added clubName state
  const [clubName, setClubName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false); // State for the main form checkbox
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Added missing message state

  // States for the modal
  const [showTermsModal, setShowTermsModal] = useState(false); // Controls modal visibility
  const [modalTermsAccepted, setModalTermsAccepted] = useState(false); // State for checkbox INSIDE the modal
  const [modalError, setModalError] = useState(''); // Error message for modal validation

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setMessage(''); // Clear previous messages

    // Client-side validation for required fields including new clubName
    if (!clubName.trim() || !title.trim() || !date || !startTime || !endTime || !termsAccepted) {
      setError('Please fill in all required fields and accept the terms and conditions.');
      return;
    }

    // Basic date/time validation (more robust validation happens on the backend)
    // Convert to Date objects for comparison
    const eventDateTimeStart = new Date(`${date}T${startTime}`);
    const eventDateTimeEnd = new Date(`${date}T${endTime}`);

    if (eventDateTimeStart >= eventDateTimeEnd) {
      setError('End time must be after start time on the same day.');
      return;
    }
    // Also ensure the date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day
    if (eventDateTimeStart < today) {
        setError('Booking date cannot be in the past.');
        return;
    }

    try {
      const bookingData = {
        club_name: clubName, // Include new field
        title,
        description,
        date,
        startTime, // Use startTime and endTime as is, backend will parse
        endTime,
        termsAccepted,
      };

      console.log('Sending booking data:', bookingData); // Debug log

      const response = await createBooking(bookingData);
      console.log('Booking response:', response); // Debug log
      
      // Navigate to ThankYou page immediately after successful booking
      navigate('/Thankyou');
      
    } catch (err) {
      console.error('Booking creation error:', err.response?.data || err.message || err);
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
      {message && <div className="alert alert-success">{message}</div>}

      <Form onSubmit={handleSubmit}>
        {/* NEW: Club or Organization Name - Made first field */}
        <Form.Group className="mb-3" controlId="formClubName">
          <Form.Label>Club or Organization Name <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter club or organization name"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            required // Made required
          />
        </Form.Group>

        {/* Event Title */}
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label>Event Title <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required // Made required
          />
        </Form.Group>

        {/* Description (Optional) */}
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

        {/* Date */}
        <Form.Group className="mb-3" controlId="formDate">
          <Form.Label>Date <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required // Made required
          />
        </Form.Group>

        <div className="row mb-3">
          <Form.Group as={Form.Col} controlId="formStartTime">
            <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required // Made required
            />
          </Form.Group>

          <Form.Group as={Form.Col} controlId="formEndTime">
            <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required // Made required
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
                </span> <span className="text-danger">*</span>
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