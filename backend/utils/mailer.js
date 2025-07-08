// backend/utils/mailer.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a Nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Additional options for better reliability
    tls: {
        rejectUnauthorized: false
    },
    // Add connection timeout and socket timeout
    connectionTimeout: 60000, // 60 seconds
    socketTimeout: 60000, // 60 seconds
    // Pool connections for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 10
});

// Verify transporter connection with better error handling
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('✅ Mailer is ready to send messages');
    } catch (error) {
        console.error('❌ Mailer connection error:', error.message);
        // Don't throw here, just log the error
    }
};

// Initialize verification
verifyTransporter();

/**
 * Sends an email using the configured Nodemailer transporter.
 * @param {Object} mailOptions - Options for the email
 * @param {string} mailOptions.to - Recipient email address
 * @param {string} mailOptions.from - Sender email address (optional, defaults to EMAIL_USER)
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML content of the email
 * @param {string} mailOptions.text - Plain text content (optional)
 * @returns {Promise<Object>} - A promise that resolves with the info object from Nodemailer
 */
const sendEmail = async (mailOptions) => {
    try {
        // Validate required fields
        if (!mailOptions.to || !mailOptions.subject) {
            throw new Error('Missing required email fields: to, subject');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mailOptions.to)) {
            throw new Error('Invalid email format');
        }

        // Set default from address if not provided
        if (!mailOptions.from) {
            mailOptions.from = process.env.EMAIL_USER;
        }

        // Add default styling to HTML emails
        if (mailOptions.html && !mailOptions.html.includes('<div style="font-family: Arial, sans-serif;')) {
            mailOptions.html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    ${mailOptions.html}
                </div>
            `;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw error;
    }
};

// ================================
// BOOKING RELATED EMAIL FUNCTIONS
// ================================

/**
 * Send booking notification to admin
 * @param {Object} bookingData - Booking details
 * @param {Object} userData - User details
 */
const sendBookingNotificationToAdmin = async (bookingData, userData) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('ADMIN_EMAIL is not set in environment variables. Cannot send booking notification to admin.');
        return;
    }

    const mailOptions = {
        to: adminEmail,
        subject: '🔔 New Hall Booking Request Awaiting Approval',
        html: `
            <h2 style="color: #007bff;">New Hall Booking Request</h2>
            <p>A new hall booking request has been submitted and is awaiting your approval.</p>
            
            <h3>Booking Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Club/Organization:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.club_name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Event Title:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.title}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Date:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(bookingData.date).toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Time:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.start_time} - ${bookingData.end_time}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Description:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.description || 'N/A'}</td>
                </tr>
            </table>
            
            <p style="margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL}/login"
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Login
                </a>
            </p>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                This is an automated message from the Seminar Hall Booking System.
            </p>
        `,
    };

    return await sendEmail(mailOptions);
};

/**
 * Send booking approval notification to user
 * @param {Object} bookingData - Booking details including user info
 * @param {string} adminComments - Optional admin comments
 */
const sendBookingApprovalToUser = async (bookingData, adminComments = '') => {
    const mailOptions = {
        to: bookingData.user_email,
        subject: '🎉 Your Hall Booking Has Been Approved!',
        html: `
            <h2 style="color: #28a745;">Booking Approved!</h2>
            <p>Dear ${bookingData.user_name},</p>
            <p>Great news! Your booking for the seminar hall has been <strong>approved</strong>.</p>
            
            <h3>Booking Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Club/Organization:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.club_name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Event Title:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.title}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Date:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(bookingData.date).toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Time:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.start_time} - ${bookingData.end_time}</td>
                </tr>
                ${adminComments ? `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Admin Comments:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${adminComments}</td>
                </tr>` : ''}
            </table>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h4 style="color: #155724; margin-top: 0;">Important Reminders:</h4>
                <ul style="color: #155724; margin-bottom: 0;">
                    <li>Please ensure you adhere to all terms and conditions</li>
                    <li>Contact administration if you need to make any changes</li>
                    
                </ul>
            </div>
            
            <p>Thank you for using our booking system!</p>
            <p><strong>Seminar Hall Booking System</strong></p>
        `,
    };

    return await sendEmail(mailOptions);
};

/**
 * Send booking rejection notification to user
 * @param {Object} bookingData - Booking details including user info
 * @param {string} adminComments - Optional admin comments explaining rejection
 */
const sendBookingRejectionToUser = async (bookingData, adminComments = '') => {
    const mailOptions = {
        to: bookingData.user_email,
        subject: '❌ Your Hall Booking Request Update',
        html: `
            <h2 style="color: #dc3545;">Booking Request Rejected</h2>
            <p>Dear ${bookingData.user_name},</p>
            <p>We regret to inform you that your booking request for the seminar hall has been <strong>rejected</strong>.</p>
            
            <h3>Booking Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Club/Organization:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.club_name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Event Title:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.title}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Date:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(bookingData.date).toLocaleDateString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Time:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${bookingData.start_time} - ${bookingData.end_time}</td>
                </tr>
                ${adminComments ? `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Reason for Rejection:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${adminComments}</td>
                </tr>` : ''}
            </table>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0;">
                    If you have any questions about this rejection or would like to discuss alternative arrangements, 
                    please contact the administration team.
                </p>
            </div>
            
            <p>Thank you for your understanding.</p>
            <p><strong>Seminar Hall Booking System</strong></p>
        `,
    };

    return await sendEmail(mailOptions);
};

// ================================
// USER SIGNUP RELATED EMAIL FUNCTIONS
// ================================

/**
 * Send new user signup notification to admin
 * @param {Object} user - The new user object containing name and email
 */
const sendNewUserSignupNotificationToAdmin = async (user) => {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        console.warn('ADMIN_EMAIL environment variable is not set. New user signup notification to admin will not be sent.');
        return;
    }

    const mailOptions = {
        to: adminEmail,
        subject: '🔔 New User Registration Awaiting Approval',
        html: `
            <h2 style="color: #007bff;">New User Registration</h2>
            <p>Hello Admin,</p>
            <p>A new user has registered on the Seminar Hall Booking System and is awaiting your approval.</p>
            
            <h3>User Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Name:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Email:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.email}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Registration Date:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Status:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;"><span style="color: #ffc107; font-weight: bold;">Pending Approval</span></td>
                </tr>
            </table>
            
            <p style="margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL}/login"
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Login
                </a>
            </p>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                This is an automated notification from the Seminar Hall Booking System.
            </p>
        `,
    };

    return await sendEmail(mailOptions);
};

/**
 * Send account approval notification to user
 * @param {Object} user - The user object whose account was approved
 */
const sendUserAccountApprovalToUser = async (user) => {
    const mailOptions = {
        to: user.email,
        subject: '🎉 Your Seminar Hall Booking Account Has Been Approved!',
        html: `
            <h2 style="color: #28a745;">Account Approved!</h2>
            <p>Dear ${user.name},</p>
            <p>Congratulations! Your account on the Seminar Hall Booking System has been successfully <strong>approved</strong> by the administrator.</p>
            <p>You can now log in and start booking seminar halls for your events.</p>
            
            <h3>Your Account Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Name:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Email:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.email}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Role:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Account Status:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;"><span style="color: #28a745; font-weight: bold;">Active</span></td>
                </tr>
            </table>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h4 style="color: #155724; margin-top: 0;">What's Next?</h4>
                <ul style="color: #155724; margin-bottom: 0;">
                    <li>Log in to your account using your registered email and password</li>
                    <li>Browse available seminar halls and time slots</li>
                    <li>Submit booking requests for your events</li>
                   
                </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions or need assistance, please contact the administration team.
            </p>
            <p>Welcome to the Seminar Hall Booking System!</p>
            <p><strong>Seminar Hall Booking System</strong></p>
        `,
    };

    return await sendEmail(mailOptions);
};

/**
 * Send account rejection notification to user
 * @param {Object} user - The user object whose account was rejected
 * @param {string} rejectionReason - Reason for rejection
 */
const sendUserAccountRejectionToUser = async (user, rejectionReason = 'Your registration did not meet our requirements.') => {
    const mailOptions = {
        to: user.email,
        subject: '❌ Your Seminar Hall Account Registration Update',
        html: `
            <h2 style="color: #dc3545;">Account Registration Rejected</h2>
            <p>Dear ${user.name},</p>
            <p>We regret to inform you that your account registration on the Seminar Hall Booking System has been <strong>rejected</strong>.</p>
            
            <h3>Your Registration Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Name:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Email:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${user.email}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f8f9fa;">Registration Date:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date().toLocaleString()}</td>
                </tr>
            </table>
            
            <h3>Reason for Rejection:</h3>
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0;">${rejectionReason}</p>
            </div>

        
            
            <p>Thank you for your interest in the Seminar Hall Booking System.</p>
            <p><strong>Seminar Hall Booking System</strong></p>
        `,
    };

    return await sendEmail(mailOptions);
};


module.exports = { 
    sendEmail, 
    // Booking related functions
    sendBookingNotificationToAdmin, 
    sendBookingApprovalToUser, 
    sendBookingRejectionToUser,
    // User signup related functions
    sendNewUserSignupNotificationToAdmin, 
    sendUserAccountApprovalToUser,
    sendUserAccountRejectionToUser,
    
};