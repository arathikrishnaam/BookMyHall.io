/*
import './Termsandcondition.css';
import { TERMS_AND_CONDITIONS_CONTENT } from '../constants/TermsAndConditions';
*/
import { TERMS_AND_CONDITIONS_CONTENT } from '../constants/termsAndConditions';
// ✅ lowercase 't' and 'a'
import './TermsAndConditions.css';

 // ✅ Capital 'A' and 'C'

const TermsAndConditionsPage = () => {
  return (
    // The main container div for the page (Bootstrap's .container)
    <div className="terms-wrapper container mt-5">
    <h2 className="terms-heading">Terms and Conditions for Seminar Hall Booking</h2>

      {/*
        The <form> tag is used here as a workaround to hide the global banner/footer
        due to your index.css's ":has(form)" rule.

        We're adding specific inline styles to this form to:
        - Remove any default form styling (box-shadow, padding, background, margin)
        - Set a maximum width (e.g., 800px) to make the text readable (very wide text is hard to read)
        - Center the form horizontally within its parent (.container) using margin: '0 auto'
        - Ensure the text within is left-aligned, as terms usually are.
      */}
      <form
        style={{
          boxShadow: 'none',        // Removes any default form shadow
          padding: '20px',         // Add some internal padding for content inside the form
          margin: '0 auto',        // Centers the form horizontally
          background: '#fff',      // Give it a white background like other content boxes
          maxWidth: '900px',       // Sets a comfortable maximum width for the content
          borderRadius: '10px',    // Add some rounded corners
          border: '1px solid #eee' // Add a light border
        }}
      >
        {/*
          This div renders the raw HTML content of your terms and conditions.
        */}
        <div dangerouslySetInnerHTML={{ __html: TERMS_AND_CONDITIONS_CONTENT }} />
      </form>
    </div>
  );
};

export default TermsAndConditionsPage;