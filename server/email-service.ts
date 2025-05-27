import sgMail from '@sendgrid/mail';
import { db } from './db';
import { users, businesses } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Email service configuration
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface InvitationEmailData {
  pmName: string;
  companyName: string;
  tradieEmail: string;
  personalMessage?: string;
  registrationLink: string;
  expiryDate: string;
  appName: string;
}

interface NotificationEmailData {
  pmEmail: string;
  pmName: string;
  companyName: string;
  tradieEmail?: string;
  tradieName?: string;
  responseType?: 'accepted' | 'rejected';
  responseDate?: string;
}

interface RemovalEmailData {
  tradieEmail: string;
  tradieName: string;
  companyName: string;
  pmName: string;
  supportEmail: string;
}

class EmailService {
  private fromEmail = 'noreply@firefireparts.com';
  private supportEmail = 'support@firefireparts.com';
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.replit.app' 
    : 'http://localhost:5000';

  // Generate registration link with invitation token
  generateRegistrationLink(token: string, email: string): string {
    const encodedEmail = encodeURIComponent(email);
    return `${this.baseUrl}/register?invitation_token=${token}&email=${encodedEmail}`;
  }

  // Format date for email display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  // New Tradie Invitation Email Template
  generateInvitationEmail(data: InvitationEmailData): EmailTemplate {
    const subject = `You've been invited to join ${data.companyName} on Fire Parts Supply`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Invitation - Fire Parts Supply</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E35 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 30px -20px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 16px; opacity: 0.9; }
        .content { padding: 0 10px; }
        .invitation-box { background-color: #f8f9fa; border-left: 4px solid #FF6B35; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .personal-message { background-color: #e8f4f8; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0; font-style: italic; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8E35 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 20px 0; text-align: center; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); }
        .details { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .details h4 { margin-top: 0; color: #FF6B35; }
        .expiry-notice { color: #dc3545; font-weight: bold; background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
        .security-note { font-size: 12px; color: #888; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔥 Fire Parts Supply</div>
            <div class="subtitle">Professional Fire Sprinkler Parts & Equipment</div>
        </div>
        
        <div class="content">
            <h2>You're Invited to Join ${data.companyName}!</h2>
            
            <div class="invitation-box">
                <h3>Company Invitation</h3>
                <p><strong>${data.pmName}</strong> from <strong>${data.companyName}</strong> has invited you to join their team on Fire Parts Supply.</p>
                <p>This will give you access to:</p>
                <ul>
                    <li>Browse and order fire sprinkler parts and equipment</li>
                    <li>View company-specific pricing and catalogs</li>
                    <li>Track orders and delivery status</li>
                    <li>Access technical specifications and documentation</li>
                </ul>
            </div>

            ${data.personalMessage ? `
            <div class="personal-message">
                <h4>Personal Message from ${data.pmName}:</h4>
                <p>"${data.personalMessage}"</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.registrationLink}" class="cta-button">
                    Accept Invitation & Register
                </a>
            </div>

            <div class="details">
                <h4>Invitation Details:</h4>
                <p><strong>Company:</strong> ${data.companyName}</p>
                <p><strong>Invited by:</strong> ${data.pmName}</p>
                <p><strong>Your email:</strong> ${data.tradieEmail}</p>
            </div>

            <div class="expiry-notice">
                ⏰ This invitation expires on ${data.expiryDate}
            </div>

            <div class="security-note">
                <p><strong>Security Note:</strong> This invitation link is unique to you and should not be shared. If you didn't expect this invitation, please contact our support team.</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Fire Parts Supply</strong> - Your trusted partner for professional fire sprinkler solutions</p>
            <p>Questions? Contact us at <a href="mailto:support@firefireparts.com">support@firefireparts.com</a></p>
            <p style="font-size: 12px; color: #888;">This email was sent to ${data.tradieEmail}. This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Fire Parts Supply - Company Invitation

You're Invited to Join ${data.companyName}!

${data.pmName} from ${data.companyName} has invited you to join their team on Fire Parts Supply.

${data.personalMessage ? `Personal Message: "${data.personalMessage}"` : ''}

This will give you access to:
- Browse and order fire sprinkler parts and equipment
- View company-specific pricing and catalogs
- Track orders and delivery status
- Access technical specifications and documentation

Accept your invitation by visiting: ${data.registrationLink}

Invitation Details:
- Company: ${data.companyName}
- Invited by: ${data.pmName}
- Your email: ${data.tradieEmail}
- Expires: ${data.expiryDate}

Questions? Contact us at support@firefireparts.com

Fire Parts Supply - Your trusted partner for professional fire sprinkler solutions
`;

    return { subject, html, text };
  }

  // PM Notification Email Templates
  generateAcceptanceNotificationEmail(data: NotificationEmailData): EmailTemplate {
    const subject = `Great news! ${data.tradieName || data.tradieEmail} has joined your company`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation Accepted - Fire Parts Supply</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745 0%, #34ce57 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 30px -20px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 0 10px; }
        .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .details { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .next-steps { background-color: #e8f4f8; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎉 Invitation Accepted!</div>
        </div>
        
        <div class="content">
            <div class="success-box">
                <h2>Wonderful news, ${data.pmName}!</h2>
                <p><strong>${data.tradieName || data.tradieEmail}</strong> has accepted your invitation and joined <strong>${data.companyName}</strong> on Fire Parts Supply.</p>
            </div>

            <div class="details">
                <h4>New Team Member Details:</h4>
                <p><strong>Email:</strong> ${data.tradieEmail}</p>
                <p><strong>Joined:</strong> ${data.responseDate ? this.formatDate(data.responseDate) : 'Just now'}</p>
                <p><strong>Status:</strong> Active - Full access granted</p>
            </div>

            <div class="next-steps">
                <h4>Next Steps:</h4>
                <ul>
                    <li>The new team member now has full access to browse and order parts</li>
                    <li>You can assign them to specific jobs in your project management dashboard</li>
                    <li>They'll receive notifications about order updates and company announcements</li>
                    <li>You can manage their permissions anytime from your team management page</li>
                </ul>
            </div>

            <p>Welcome aboard! Your team is growing stronger with Fire Parts Supply.</p>
        </div>

        <div class="footer">
            <p><strong>Fire Parts Supply</strong> - Building better teams, delivering better results</p>
            <p>Questions? Contact us at <a href="mailto:support@firefireparts.com">support@firefireparts.com</a></p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Fire Parts Supply - Invitation Accepted

Wonderful news, ${data.pmName}!

${data.tradieName || data.tradieEmail} has accepted your invitation and joined ${data.companyName} on Fire Parts Supply.

New Team Member Details:
- Email: ${data.tradieEmail}
- Joined: ${data.responseDate ? this.formatDate(data.responseDate) : 'Just now'}
- Status: Active - Full access granted

Next Steps:
- The new team member now has full access to browse and order parts
- You can assign them to specific jobs in your project management dashboard
- They'll receive notifications about order updates and company announcements
- You can manage their permissions anytime from your team management page

Welcome aboard! Your team is growing stronger with Fire Parts Supply.

Questions? Contact us at support@firefireparts.com
`;

    return { subject, html, text };
  }

  generateRejectionNotificationEmail(data: NotificationEmailData): EmailTemplate {
    const subject = `Invitation to ${data.tradieEmail} was declined`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation Declined - Fire Parts Supply</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6c757d 0%, #868e96 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 30px -20px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 0 10px; }
        .info-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .details { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .suggestions { background-color: #e8f4f8; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📋 Invitation Update</div>
        </div>
        
        <div class="content">
            <div class="info-box">
                <h2>Invitation Status Update</h2>
                <p>Hi ${data.pmName},</p>
                <p>We wanted to let you know that <strong>${data.tradieEmail}</strong> has declined your invitation to join <strong>${data.companyName}</strong> on Fire Parts Supply.</p>
            </div>

            <div class="details">
                <h4>Invitation Details:</h4>
                <p><strong>Invited Email:</strong> ${data.tradieEmail}</p>
                <p><strong>Response Date:</strong> ${data.responseDate ? this.formatDate(data.responseDate) : 'Just now'}</p>
                <p><strong>Status:</strong> Declined</p>
            </div>

            <div class="suggestions">
                <h4>What's Next?</h4>
                <ul>
                    <li>You can send a new invitation anytime from your team management dashboard</li>
                    <li>Consider reaching out directly to discuss any concerns they might have</li>
                    <li>The invitation slot is now available for other team members</li>
                    <li>You can continue building your team with other qualified professionals</li>
                </ul>
            </div>

            <p>Don't worry - building the right team takes time. Keep growing your Fire Parts Supply network!</p>
        </div>

        <div class="footer">
            <p><strong>Fire Parts Supply</strong> - Connecting the right people for every project</p>
            <p>Questions? Contact us at <a href="mailto:support@firefireparts.com">support@firefireparts.com</a></p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Fire Parts Supply - Invitation Declined

Hi ${data.pmName},

We wanted to let you know that ${data.tradieEmail} has declined your invitation to join ${data.companyName} on Fire Parts Supply.

Invitation Details:
- Invited Email: ${data.tradieEmail}
- Response Date: ${data.responseDate ? this.formatDate(data.responseDate) : 'Just now'}
- Status: Declined

What's Next?
- You can send a new invitation anytime from your team management dashboard
- Consider reaching out directly to discuss any concerns they might have
- The invitation slot is now available for other team members
- You can continue building your team with other qualified professionals

Don't worry - building the right team takes time. Keep growing your Fire Parts Supply network!

Questions? Contact us at support@firefireparts.com
`;

    return { subject, html, text };
  }

  // Tradie Removal Notification Email
  generateRemovalEmail(data: RemovalEmailData): EmailTemplate {
    const subject = `Your access to ${data.companyName} has been updated`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Update - Fire Parts Supply</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ffc107 0%, #ffca28 100%); color: #333; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 30px -20px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 0 10px; }
        .update-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .access-info { background-color: #e8f4f8; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0; }
        .contact-info { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔄 Access Update</div>
        </div>
        
        <div class="content">
            <div class="update-box">
                <h2>Access Level Changed</h2>
                <p>Hi ${data.tradieName},</p>
                <p>Your access level for <strong>${data.companyName}</strong> on Fire Parts Supply has been updated by ${data.pmName}.</p>
            </div>

            <div class="access-info">
                <h4>Your Current Access Level:</h4>
                <p><strong>Browse Access Only</strong></p>
                <p>You can still:</p>
                <ul>
                    <li>Browse the complete parts catalog</li>
                    <li>View product specifications and documentation</li>
                    <li>Search for specific parts and equipment</li>
                    <li>Access technical resources</li>
                </ul>
                <p><strong>Note:</strong> Ordering capabilities have been temporarily restricted for your account with this company.</p>
            </div>

            <div class="contact-info">
                <h4>Questions or Concerns?</h4>
                <p>If you have any questions about this change or would like to discuss your access level, please contact:</p>
                <ul>
                    <li><strong>Company Contact:</strong> ${data.pmName} at ${data.companyName}</li>
                    <li><strong>Fire Parts Supply Support:</strong> <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></li>
                </ul>
            </div>

            <p>Thank you for being part of the Fire Parts Supply community. We're here to support your professional needs.</p>
        </div>

        <div class="footer">
            <p><strong>Fire Parts Supply</strong> - Professional fire sprinkler solutions for every project</p>
            <p>Questions? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Fire Parts Supply - Access Update

Hi ${data.tradieName},

Your access level for ${data.companyName} on Fire Parts Supply has been updated by ${data.pmName}.

Your Current Access Level: Browse Access Only

You can still:
- Browse the complete parts catalog
- View product specifications and documentation
- Search for specific parts and equipment
- Access technical resources

Note: Ordering capabilities have been temporarily restricted for your account with this company.

Questions or Concerns?
If you have any questions about this change or would like to discuss your access level, please contact:
- Company Contact: ${data.pmName} at ${data.companyName}
- Fire Parts Supply Support: ${data.supportEmail}

Thank you for being part of the Fire Parts Supply community. We're here to support your professional needs.

Questions? Contact us at ${data.supportEmail}
`;

    return { subject, html, text };
  }

  // Send email with error handling and logging
  async sendEmail(to: string, template: EmailTemplate, retryCount = 0): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY not configured');
        return false;
      }

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: 'Fire Parts Supply'
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}: ${template.subject}`);
      return true;

    } catch (error: any) {
      console.error(`Email send failed to ${to}:`, error?.response?.body || error.message);
      
      // Retry logic for temporary failures
      if (retryCount < 2 && error?.code >= 500) {
        console.log(`Retrying email send to ${to} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.sendEmail(to, template, retryCount + 1);
      }
      
      return false;
    }
  }

  // Get company information for email templates
  async getCompanyInfo(businessId: number) {
    try {
      const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
      return business[0]?.name || 'Your Company';
    } catch (error) {
      console.error('Error fetching company info:', error);
      return 'Your Company';
    }
  }

  // Get PM information for email templates
  async getPMInfo(pmId: number) {
    try {
      const pm = await db.select().from(users).where(eq(users.id, pmId)).limit(1);
      const pmData = pm[0];
      if (pmData) {
        return {
          name: `${pmData.firstName || ''} ${pmData.lastName || ''}`.trim() || 'Project Manager',
          email: pmData.email
        };
      }
      return { name: 'Project Manager', email: '' };
    } catch (error) {
      console.error('Error fetching PM info:', error);
      return { name: 'Project Manager', email: '' };
    }
  }

  // Main invitation email sending function
  async sendInvitationEmail(
    tradieEmail: string, 
    pmId: number, 
    businessId: number, 
    invitationToken: string, 
    tokenExpiry: string, 
    personalMessage?: string
  ): Promise<boolean> {
    try {
      const [pmInfo, companyName] = await Promise.all([
        this.getPMInfo(pmId),
        this.getCompanyInfo(businessId)
      ]);

      const emailData: InvitationEmailData = {
        pmName: pmInfo.name,
        companyName,
        tradieEmail,
        personalMessage,
        registrationLink: this.generateRegistrationLink(invitationToken, tradieEmail),
        expiryDate: this.formatDate(tokenExpiry),
        appName: 'Fire Parts Supply'
      };

      const template = this.generateInvitationEmail(emailData);
      return await this.sendEmail(tradieEmail, template);

    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }

  // Send PM notification emails
  async sendPMNotificationEmail(
    pmEmail: string,
    pmId: number,
    businessId: number,
    tradieEmail: string,
    responseType: 'accepted' | 'rejected',
    responseDate?: string,
    tradieName?: string
  ): Promise<boolean> {
    try {
      const [pmInfo, companyName] = await Promise.all([
        this.getPMInfo(pmId),
        this.getCompanyInfo(businessId)
      ]);

      const emailData: NotificationEmailData = {
        pmEmail,
        pmName: pmInfo.name,
        companyName,
        tradieEmail,
        tradieName,
        responseType,
        responseDate
      };

      const template = responseType === 'accepted' 
        ? this.generateAcceptanceNotificationEmail(emailData)
        : this.generateRejectionNotificationEmail(emailData);

      return await this.sendEmail(pmEmail, template);

    } catch (error) {
      console.error('Error sending PM notification email:', error);
      return false;
    }
  }

  // Send tradie removal notification
  async sendRemovalNotificationEmail(
    tradieEmail: string,
    tradieName: string,
    pmId: number,
    businessId: number
  ): Promise<boolean> {
    try {
      const [pmInfo, companyName] = await Promise.all([
        this.getPMInfo(pmId),
        this.getCompanyInfo(businessId)
      ]);

      const emailData: RemovalEmailData = {
        tradieEmail,
        tradieName,
        companyName,
        pmName: pmInfo.name,
        supportEmail: this.supportEmail
      };

      const template = this.generateRemovalEmail(emailData);
      return await this.sendEmail(tradieEmail, template);

    } catch (error) {
      console.error('Error sending removal notification email:', error);
      return false;
    }
  }

  // Validate email address format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Rate limiting check (simple implementation)
  private emailRateLimit = new Map<string, number[]>();
  
  checkRateLimit(email: string, maxEmails = 5, timeWindow = 3600000): boolean {
    const now = Date.now();
    const emailHistory = this.emailRateLimit.get(email) || [];
    
    // Remove old entries outside time window
    const recentEmails = emailHistory.filter(timestamp => now - timestamp < timeWindow);
    
    if (recentEmails.length >= maxEmails) {
      return false; // Rate limit exceeded
    }
    
    recentEmails.push(now);
    this.emailRateLimit.set(email, recentEmails);
    return true;
  }
}

export const emailService = new EmailService();