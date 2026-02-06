const nodemailer = require("nodemailer");

// Parse MAILER_DSN or use individual environment variables
function getEmailConfig() {
  const mailerDsn = process.env.MAILER_DSN;
  
  if (mailerDsn) {
    // Parse DSN format: smtp://username:password@host:port?encryption=tls&auth_mode=login
    const dsnMatch = mailerDsn.match(/^smtp:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (dsnMatch) {
      const [, user, pass, host, port] = dsnMatch;
      return {
        host: host,
        port: parseInt(port),
        secure: false, // TLS uses port 587 with secure: false
        requireTLS: true, // Require TLS encryption
        auth: {
          user: decodeURIComponent(user),
          pass: decodeURIComponent(pass),
        },
      };
    }
  }
  
  // Fallback to individual environment variables
  return {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };
}

// Create transporter
const transporter = nodemailer.createTransport(getEmailConfig());

exports.sendOTPEmail = async (email, otpCode) => {
  try {
    // Get email from DSN or env variable
    const mailerDsn = process.env.MAILER_DSN;
    let fromEmail = process.env.EMAIL_USER;
    
    if (mailerDsn) {
      const dsnMatch = mailerDsn.match(/^smtp:\/\/([^:]+):/);
      if (dsnMatch) {
        fromEmail = decodeURIComponent(dsnMatch[1]);
      }
    }
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Use the following OTP code to proceed:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #000; font-size: 32px; letter-spacing: 8px; margin: 0;">${otpCode}</h1>
          </div>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};
