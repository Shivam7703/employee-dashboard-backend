const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      console.warn('⚠️ Email service not configured');
    }
  }

  async sendEmail(to, subject, html, attachments = []) {
    if (!this.transporter) {
      console.log('Email service not configured, skipping email send');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Employee Dashboard" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
      });
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendPayslipEmail(employee, payslipUrl, month, year) {
    const subject = `Salary Slip - ${month}/${year}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello ${employee.name},</h2>
        <p>Your salary slip for ${month}/${year} has been generated.</p>
        <p>Please click the link below to download your payslip:</p>
        <a href="${payslipUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Payslip</a>
        <br/><br/>
        <p>Thank you,<br/>HR Team</p>
      </div>
    `;
    
    return await this.sendEmail(employee.email, subject, html);
  }

  async sendWelcomeEmail(employee, password) {
    const subject = 'Welcome to Employee Dashboard';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome ${employee.name}!</h2>
        <p>Your employee account has been created successfully.</p>
        <p><strong>Login Credentials:</strong></p>
        <p>Email: ${employee.email}</p>
        <p>Password: ${password}</p>
        <p>Please login and change your password immediately.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
        <br/><br/>
        <p>Best regards,<br/>Admin Team</p>
      </div>
    `;
    
    return await this.sendEmail(employee.email, subject, html);
  }

  async sendTaskAssignmentEmail(employee, task) {
    const subject = `New Task Assigned: ${task.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>New Task Assigned</h2>
        <p>Dear ${employee.name},</p>
        <p>A new task has been assigned to you:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
          <h3>${task.title}</h3>
          <p>${task.description}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/employee" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
        <br/><br/>
        <p>Regards,<br/>Management</p>
      </div>
    `;
    
    return await this.sendEmail(employee.email, subject, html);
  }
}

module.exports = new EmailService();