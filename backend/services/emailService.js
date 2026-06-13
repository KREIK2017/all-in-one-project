const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP settings from .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Sends a notification email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} text Plain text content
 * @param {string} html HTML content (optional)
 */
const sendNotificationEmail = async (to, subject, text, html) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Skipping email send: SMTP credentials not configured in .env');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"AioSpace Notifications" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendNotificationEmail };
