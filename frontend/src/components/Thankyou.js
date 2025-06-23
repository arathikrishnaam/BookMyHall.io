// components/ThankYou.js
import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="mt-5 text-center">
      <h2>🎉 Thank You for Your Booking!</h2>
      <p>Your request has been submitted and is pending approval.</p>
      <Link to="/" className="btn btn-primary mt-3">
        Go to Calendar
      </Link>
    </div>
  );
};

export default ThankYou;
