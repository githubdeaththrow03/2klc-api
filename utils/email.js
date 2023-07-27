const nodemailer = require('nodemailer');
require('dotenv').config();

// specifying email recipient
const sendEmail = async (recipient, subject, message) => {
  try {

    // nodemail transporter using gmail and lebrown city gmail acc
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // gmail configuration (content)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;


