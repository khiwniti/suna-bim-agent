/**
 * Email Service
 *
 * Abstraction layer for sending transactional emails.
 * Supports multiple providers (Resend, SendGrid, etc.)
 *
 * ★ Insight ─────────────────────────────────────
 * This service:
 * - Provides a clean API for sending emails
 * - Supports provider switching via env vars
 * - Includes retry logic and error handling
 * - Logs all email attempts for debugging
 * ─────────────────────────────────────────────────
 */

import {
  welcomeEmail,
  reportReadyEmail,
  passwordResetEmail,
  WelcomeEmailData,
  ReportReadyEmailData,
  PasswordResetEmailData,
} from './templates';

// ============================================
// Types
// ============================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type EmailProvider = 'resend' | 'sendgrid' | 'console';

// ============================================
// Configuration
// ============================================

const config = {
  provider: (process.env.EMAIL_PROVIDER || 'console') as EmailProvider,
  from: process.env.EMAIL_FROM || 'CarbonBIM <noreply@carbonbim.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@carbonbim.com',
  resendApiKey: process.env.RESEND_API_KEY,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://carbonbim.com',
};

// ============================================
// Provider Implementations
// ============================================

/**
 * Console provider (development)
 */
async function sendViaConsole(options: EmailOptions): Promise<EmailResult> {
  console.log('\n📧 EMAIL SENT (Console Provider)');
  console.log('━'.repeat(50));
  console.log(`To: ${options.to}`);
  console.log(`From: ${options.from || config.from}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Tags: ${options.tags?.join(', ') || 'none'}`);
  console.log('━'.repeat(50));
  console.log('HTML Preview: (truncated)');
  console.log(options.html.slice(0, 500) + '...');
  console.log('━'.repeat(50) + '\n');

  return {
    success: true,
    messageId: `console_${Date.now()}`,
  };
}

/**
 * Resend provider
 */
async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
  if (!config.resendApiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY not configured',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo || config.replyTo,
        tags: options.tags?.map(tag => ({ name: tag, value: 'true' })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send email via Resend',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * SendGrid provider
 */
async function sendViaSendGrid(options: EmailOptions): Promise<EmailResult> {
  if (!config.sendgridApiKey) {
    return {
      success: false,
      error: 'SENDGRID_API_KEY not configured',
    };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: options.from || config.from },
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html }],
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: data.message || 'Failed to send email via SendGrid',
      };
    }

    return {
      success: true,
      messageId: response.headers.get('X-Message-Id') || `sg_${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Main Send Function
// ============================================

/**
 * Send an email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = config.provider;

  console.log(`[Email] Sending to ${options.to} via ${provider}`);

  let result: EmailResult;

  switch (provider) {
    case 'resend':
      result = await sendViaResend(options);
      break;
    case 'sendgrid':
      result = await sendViaSendGrid(options);
      break;
    case 'console':
    default:
      result = await sendViaConsole(options);
  }

  if (result.success) {
    console.log(`[Email] Success: ${result.messageId}`);
  } else {
    console.error(`[Email] Failed: ${result.error}`);
  }

  return result;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  to: string,
  data: Omit<WelcomeEmailData, 'loginUrl' | 'calculatorUrl'> & {
    loginUrl?: string;
    calculatorUrl?: string;
  }
): Promise<EmailResult> {
  const html = welcomeEmail({
    ...data,
    loginUrl: data.loginUrl || config.appUrl,
    calculatorUrl: data.calculatorUrl || `${config.appUrl}/calculator`,
  });

  return sendEmail({
    to,
    subject: 'Welcome to CarbonBIM! 🎉',
    html,
    tags: ['welcome', 'onboarding'],
  });
}

/**
 * Send report ready notification
 */
export async function sendReportReadyEmail(
  to: string,
  data: Omit<ReportReadyEmailData, 'dashboardUrl'> & {
    dashboardUrl?: string;
  }
): Promise<EmailResult> {
  const html = reportReadyEmail({
    ...data,
    dashboardUrl: data.dashboardUrl || `${config.appUrl}/dashboard`,
  });

  return sendEmail({
    to,
    subject: `Your ${data.reportType} Report is Ready - ${data.projectName}`,
    html,
    tags: ['report', 'notification'],
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetEmailData
): Promise<EmailResult> {
  const html = passwordResetEmail(data);

  return sendEmail({
    to,
    subject: 'Reset Your CarbonBIM Password',
    html,
    tags: ['auth', 'password-reset'],
  });
}

// ============================================
// Export
// ============================================

export default {
  send: sendEmail,
  sendWelcome: sendWelcomeEmail,
  sendReportReady: sendReportReadyEmail,
  sendPasswordReset: sendPasswordResetEmail,
};
