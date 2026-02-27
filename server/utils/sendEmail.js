// Email utility using Nodemailer for transactional emails (forgot/reset password)
import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Ticket System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return info;
};
