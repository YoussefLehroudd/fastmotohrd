const nodemailer = require('nodemailer');
require('dotenv').config();



const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true
});

// Test SMTP Connection
const testConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection successful');
    return true;
  } catch (error) {
    console.error('SMTP connection error:', error);
    return false;
  }
};

// Test connection on startup
testConnection();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, otp, type = 'login') => {
  const mailOptions = {
    from: {
      name: 'FastMoto',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: type === 'login' ? 'FastMoto - Login Verification Code' : 'FastMoto - Password Reset Code',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #1a237e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f3cd_fe0f/32.png" alt="🏍️" style="width: 32px; height: 32px;">
          </div>
          <div style="font-size: 24px; font-weight: bold;">FastMoto</div>
          <div style="margin-top: 5px;">Your Premium Motorcycle Marketplace</div>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 20px;">${type === 'login' ? 'Login Verification' : 'Password Reset'}</h2>
          <p style="color: #666; margin-bottom: 20px;">Here is your one-time password (OTP) to ${type === 'login' ? 'complete your login' : 'reset your password'}:</p>
          <div style="font-size: 32px; font-weight: bold; color: #1a237e; background-color: #f5f5f5; padding: 15px 30px; display: inline-block; border-radius: 4px;">${otp}</div>
          <p style="color: #666; margin-top: 20px;">This OTP will expire in 5 minutes. Do not share this code with anyone.</p>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} FastMoto. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendLoginOTP = (email, otp) => sendOTP(email, otp, 'login');
const sendPasswordResetOTP = (email, otp) => sendOTP(email, otp, 'reset');

const sendPasswordChangeNotification = async (email) => {
  const mailOptions = {
    from: {
      name: 'FastMoto',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: 'FastMoto - Password Changed Successfully',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #1a237e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f3cd_fe0f/32.png" alt="🏍️" style="width: 32px; height: 32px;">
          </div>
          <div style="font-size: 24px; font-weight: bold;">FastMoto</div>
          <div style="margin-top: 5px;">Your Premium Motorcycle Marketplace</div>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 20px;">Password Changed Successfully</h2>
          <p style="color: #666; margin-bottom: 20px;">Your password has been successfully changed. If you did not make this change, please contact us immediately.</p>
          <p style="color: #666; margin-top: 20px;">For security reasons, you may want to review your recent account activity.</p>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} FastMoto. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendBookingCancellationEmail = async (email, { bookingId, reason }) => {
  const mailOptions = {
    from: {
      name: 'FastMoto',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: 'FastMoto - Booking Cancellation Confirmation',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #1a237e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f3cd_fe0f/32.png" alt="🏍️" style="width: 32px; height: 32px;">
          </div>
          <div style="font-size: 24px; font-weight: bold;">FastMoto</div>
          <div style="margin-top: 5px;">Your Premium Motorcycle Marketplace</div>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 20px;">Booking Cancellation Confirmation</h2>
          <p style="color: #666; margin-bottom: 20px;">Your booking (ID: ${bookingId}) has been cancelled successfully.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: left;">
            <p style="color: #666; margin: 0;"><strong>Reason for cancellation:</strong></p>
            <p style="color: #666; margin: 10px 0 0 0;">${reason}</p>
          </div>
          <p style="color: #666; margin-top: 20px;">If you have any questions or concerns, please don't hesitate to contact our support team.</p>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} FastMoto. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendBookingStatusEmail = async (email, { bookingId, motorName, status, startDate, endDate, pickupTime, returnTime, location, paymentMethod, paymentInfo }) => {
  let statusInfo;
  switch (status) {
    case 'confirmed':
      statusInfo = {
        subject: 'Booking Confirmed',
        title: 'Your Booking is Confirmed!',
        message: 'Great news! Your motorcycle booking has been confirmed by the seller.'
      };
      break;
    case 'rejected':
      statusInfo = {
        subject: 'Booking Rejected',
        title: 'Booking Status Update',
        message: 'Unfortunately, your motorcycle booking request has been rejected by the seller.'
      };
      break;
    case 'cancelled':
      statusInfo = {
        subject: 'Booking Cancelled',
        title: 'Booking Cancellation',
        message: 'Your motorcycle booking has been cancelled.'
      };
      break;
    case 'completed':
      statusInfo = {
        subject: 'Booking Completed',
        title: 'Booking Completed',
        message: 'Your motorcycle booking has been marked as completed. Thank you for using FastMoto!'
      };
      break;
    case 'pending':
      statusInfo = {
        subject: 'Booking Status Updated',
        title: 'Booking Status Updated',
        message: 'Your motorcycle booking status has been updated to pending.'
      };
      break;
    default:
      throw new Error(`Invalid booking status: ${status}`);
  }

  const mailOptions = {
    from: {
      name: 'FastMoto',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: `FastMoto - ${statusInfo.subject}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #1a237e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f3cd_fe0f/32.png" alt="🏍️" style="width: 32px; height: 32px;">
          </div>
          <div style="font-size: 24px; font-weight: bold;">FastMoto</div>
          <div style="margin-top: 5px;">Your Premium Motorcycle Marketplace</div>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 20px;">${statusInfo.title}</h2>
          <p style="color: #666; margin-bottom: 20px;">${statusInfo.message}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: left;">
            <p style="color: #666; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Motorcycle:</strong> ${motorName}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Dates:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Times:</strong> ${pickupTime} - ${returnTime}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Location:</strong> ${location}</p>
            ${paymentMethod ? `<p style="color: #666; margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : paymentMethod}</p>` : ''}
            ${paymentInfo ? `<p style="color: #666; margin: 5px 0;"><strong>Payment Status:</strong> ${paymentInfo.status || 'pending'}</p>` : ''}
          </div>
          ${status === 'confirmed' ? `
            <p style="color: #666; margin-top: 20px;">Please arrive at the pickup location on time. Don't forget to bring your driver's license and payment method.</p>
          ` : `
            <p style="color: #666; margin-top: 20px;">You can browse other available motorcycles and make a new booking.</p>
          `}
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} FastMoto. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendNewBookingEmail = async (recipientEmail, { bookingId, motorName, startDate, endDate, pickupTime, returnTime, location, paymentMethod, paymentInfo, isUser }) => {
  const mailOptions = {
    from: {
      name: 'FastMoto',
      address: process.env.EMAIL_USER
    },
    to: recipientEmail,
    subject: isUser ? 'FastMoto - Booking Request Submitted' : 'FastMoto - New Booking Request',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #1a237e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f3cd_fe0f/32.png" alt="🏍️" style="width: 32px; height: 32px;">
          </div>
          <div style="font-size: 24px; font-weight: bold;">FastMoto</div>
          <div style="margin-top: 5px;">Your Premium Motorcycle Marketplace</div>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 20px;">
            ${isUser ? 'Booking Request Submitted' : 'New Booking Request'}
          </h2>
          <p style="color: #666; margin-bottom: 20px;">
            ${isUser 
              ? 'Your booking request has been submitted successfully. The seller will review your request shortly.'
              : 'You have received a new booking request. Please review and respond to this request.'}
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: left;">
            <p style="color: #666; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Motorcycle:</strong> ${motorName}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Dates:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Times:</strong> ${pickupTime} - ${returnTime}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Location:</strong> ${location}</p>
            ${paymentMethod ? `<p style="color: #666; margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : paymentMethod}</p>` : ''}
          </div>
          ${isUser 
            ? '<p style="color: #666; margin-top: 20px;">We will notify you once the seller responds to your booking request.</p>'
            : '<p style="color: #666; margin-top: 20px;">Please log in to your account to accept or reject this booking request.</p>'}
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} FastMoto. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendSubscriptionEmail = async (email, { type, planName, endDate, price, duration, maxListings }) => {
  let subject, title, message;
  
  switch (type) {
    case 'requested':
      subject = 'Subscription Request Received';
      title = 'Subscription Request Submitted';
      message = `Your request for the ${planName} subscription has been submitted successfully. Our support team will review your request and activate your subscription once payment is confirmed.`;
      break;
    case 'approved':
      subject = 'Subscription Activated Successfully';
      title = 'Subscription Activated';
      message = `Your ${planName} subscription has been activated successfully. You can now start listing your motorcycles.`;
      break;
    case 'expired':
      subject = 'Subscription Expired';
      title = 'Subscription Expired';
      message = `Your ${planName} subscription has expired. Please renew your subscription to continue listing motorcycles.`;
      break;
   
  }

  const mailOptions = {
    from: {
      name: 'FastMoto',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: `FastMoto - ${subject}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #1a237e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f3cd_fe0f/32.png" alt="🏍️" style="width: 32px; height: 32px;">
          </div>
          <div style="font-size: 24px; font-weight: bold;">FastMoto</div>
          <div style="margin-top: 5px;">Your Premium Motorcycle Marketplace</div>
        </div>
        <div style="padding: 30px 20px; text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 20px;">${title}</h2>
          <p style="color: #666; margin-bottom: 20px;">${message}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: left;">
            <p style="color: #666; margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Price:</strong> ${price} MAD</p>
            <p style="color: #666; margin: 5px 0;"><strong>Duration:</strong> ${duration}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Maximum Listings:</strong> Up to ${maxListings} listings</p>
            ${endDate ? `<p style="color: #666; margin: 5px 0;"><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>` : ''}
          </div>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} FastMoto. All rights reserved.</p>
          <p style="margin: 5px 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendLoginOTP,
  sendPasswordResetOTP,
  sendPasswordChangeNotification,
  sendBookingCancellationEmail,
  sendBookingStatusEmail,
  sendNewBookingEmail,
  sendSubscriptionEmail
};
