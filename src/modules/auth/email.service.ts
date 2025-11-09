import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Send a generic email
   */
  async send(options: EmailOptions): Promise<void> {
    this.logger.log(`Sending email to ${options.to} with subject: ${options.subject}`);
    // TODO: Integrate with a real email provider (e.g., SendGrid, Nodemailer, AWS SES)
    // For now, this is a stub that logs the request
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, resetLink: string): Promise<void> {
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>Or use this token directly: ${resetToken}</p>
      <p>This link expires in 1 hour.</p>
    `;

    await this.send({
      to: email,
      subject: 'Password Reset Request',
      html,
      text: `Reset your password using this link: ${resetLink}`,
    });
  }

  /**
   * Send an email verification email
   */
  async sendVerificationEmail(email: string, verifyToken: string, verifyLink: string): Promise<void> {
    const html = `
      <h1>Verify Your Email</h1>
      <p>Welcome! Please verify your email address by clicking the link below:</p>
      <a href="${verifyLink}">Verify Email</a>
      <p>Or use this token directly: ${verifyToken}</p>
      <p>This link expires in 24 hours.</p>
    `;

    await this.send({
      to: email,
      subject: 'Email Verification',
      html,
      text: `Verify your email using this link: ${verifyLink}`,
    });
  }

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const html = `
      <h1>Welcome, ${userName}!</h1>
      <p>Your account has been created successfully. You can now log in and start using our platform.</p>
    `;

    await this.send({
      to: email,
      subject: 'Welcome to Our Platform',
      html,
      text: `Welcome, ${userName}! Your account has been created successfully.`,
    });
  }
}
