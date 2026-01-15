import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service for sending transactional emails
 */
class EmailService {
    constructor() {
        // Create transporter based on environment
        if (process.env.EMAIL_SERVICE === 'gmail') {
            // Gmail configuration
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
                },
            });
        } else if (process.env.SMTP_HOST) {
            // Custom SMTP configuration
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
        } else {
            // Development mode - use ethereal (fake SMTP)
            console.warn('⚠️  No email configuration found. Using development mode (no real emails sent)');
            this.transporter = null;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Smart Restaurant'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - Smart Restaurant',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>You requested to reset your password for your Smart Restaurant account.</p>
                            <p>Click the button below to reset your password:</p>
                            
                            <center>
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </center>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                ${resetUrl}
                            </p>
                            
                            <div class="warning">
                                <strong>⏰ Important:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
                            </div>
                            
                            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Smart Restaurant. All rights reserved.</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Password Reset Request
                
                You requested to reset your password for your Smart Restaurant account.
                
                Click this link to reset your password:
                ${resetUrl}
                
                This link will expire in 1 hour.
                
                If you didn't request this password reset, please ignore this email.
            `,
        };

        return this.sendEmail(mailOptions);
    }

    /**
     * Send email verification email
     */
    async sendVerificationEmail(email, verificationToken) {
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Smart Restaurant'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - Smart Restaurant',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✨ Welcome to Smart Restaurant!</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Thank you for registering with Smart Restaurant!</p>
                            <p>Please verify your email address to activate your account:</p>
                            
                            <center>
                                <a href="${verifyUrl}" class="button">Verify Email</a>
                            </center>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                ${verifyUrl}
                            </p>
                            
                            <p>This link will expire in <strong>24 hours</strong>.</p>
                            
                            <p>If you didn't create this account, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} Smart Restaurant. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Welcome to Smart Restaurant!
                
                Thank you for registering!
                
                Please verify your email address by clicking this link:
                ${verifyUrl}
                
                This link will expire in 24 hours.
            `,
        };

        return this.sendEmail(mailOptions);
    }

    /**
     * Send email wrapper with error handling
     */
    async sendEmail(mailOptions) {
        try {
            // Development mode - just log
            if (!this.transporter) {
                console.log('📧 [DEV MODE] Email would be sent:');
                console.log('   To:', mailOptions.to);
                console.log('   Subject:', mailOptions.subject);
                console.log('   Preview URL would be generated here in production');

                return {
                    success: true,
                    messageId: 'dev-mode-' + Date.now(),
                    message: 'Email logged in development mode'
                };
            }

            // Send real email
            const info = await this.transporter.sendMail(mailOptions);

            console.log('✅ Email sent successfully:');
            console.log('   Message ID:', info.messageId);
            console.log('   To:', mailOptions.to);

            return {
                success: true,
                messageId: info.messageId,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('❌ Error sending email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Verify email configuration
     */
    async verifyConnection() {
        if (!this.transporter) {
            console.log('⚠️  Running in development mode - no email service configured');
            return false;
        }

        try {
            await this.transporter.verify();
            console.log('✅ Email service is ready to send emails');
            return true;
        } catch (error) {
            console.error('❌ Email service verification failed:', error.message);
            return false;
        }
    }
}

// Export singleton instance
export default new EmailService();
