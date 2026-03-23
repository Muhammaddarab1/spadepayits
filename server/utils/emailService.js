/**
 * Email Notification Service
 * Sends emails via Office 365 or configured mail server
 * Handles ticket assignment, status changes, and other notifications
 */
import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initialize email transporter
 * Supports: Office 365 (SMTP), Gmail, or generic SMTP
 */
const initializeTransporter = () => {
  if (transporter) return transporter;

  const emailService = process.env.EMAIL_SERVICE || 'office365';
  const emailFrom = process.env.EMAIL_FROM;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailFrom || !emailUser || !emailPassword) {
    console.warn('Email configuration incomplete. Email features will be disabled.');
    return null;
  }

  if (emailService === 'office365') {
    transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else if (emailService === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword, // Use App Password, not regular password
      },
    });
  } else {
    // Generic SMTP configuration
    const host = process.env.SMTP_HOST || 'localhost';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: emailUser ? { user: emailUser, pass: emailPassword } : undefined,
    });
  }

  return transporter;
};

/**
 * Send ticket assignment email
 */
export const sendTicketAssignmentEmail = async (ticket, assignee) => {
  try {
    const transport = initializeTransporter();
    if (!transport) return false;

    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const ticketLink = `${clientURL}/tickets/${ticket._id}`;

    const subject = `🎟️ New Ticket Assigned: ${ticket.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">You have been assigned a new ticket</h2>
          
          <div style="background-color: #f0f8ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>Ticket:</strong> ${ticket.title}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Description:</strong> ${ticket.description || 'No description'}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Priority:</strong> <span style="background-color: #${
              ticket.priority === 'High' ? 'fee2e2' : ticket.priority === 'Medium' ? 'fef3c7' : 'dbeafe'
            }; padding: 4px 8px; border-radius: 4px;">${ticket.priority}</span></p>
            <p style="margin: 8px 0; color: #666;"><strong>Status:</strong> ${ticket.status}</p>
            ${ticket.dueDate ? `<p style="margin: 8px 0; color: #666;"><strong>Due Date:</strong> ${new Date(ticket.dueDate).toLocaleDateString()}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${ticketLink}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Ticket</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated notification. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: assignee.email,
      subject,
      html,
    });

    console.log('Ticket assignment email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send ticket assignment email:', error.message);
    return false;
  }
};

/**
 * Send ticket status change email
 */
export const sendTicketStatusChangeEmail = async (ticket, user, oldStatus) => {
  try {
    const transport = initializeTransporter();
    if (!transport) return false;

    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const ticketLink = `${clientURL}/tickets/${ticket._id}`;

    const subject = `🔄 Ticket Status Changed: ${ticket.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Ticket Status Updated</h2>
          
          <div style="background-color: #f0f8ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>Ticket:</strong> ${ticket.title}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Status Change:</strong> <span style="background-color: #fee2e2; padding: 4px 8px; border-radius: 4px;">${oldStatus}</span> → <span style="background-color: #dcfce7; padding: 4px 8px; border-radius: 4px;">${ticket.status}</span></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${ticketLink}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Ticket</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated notification. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    console.log('Ticket status change email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send ticket status change email:', error.message);
    return false;
  }
};

/**
 * Send bulk notification email
 */
export const sendBulkEmail = async (recipients, subject, htmlContent) => {
  try {
    const transport = initializeTransporter();
    if (!transport) return false;

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipients.join(','),
      subject,
      html: htmlContent,
    });

    console.log('Bulk email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send bulk email:', error.message);
    return false;
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async () => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      return { success: false, message: 'Email service not configured' };
    }

    await transport.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration test failed:', error.message);
    return { success: false, message: error.message };
  }
};
