/**
 * Email Module
 *
 * Transactional email system for CarbonBIM.
 */

export {
  sendEmail,
  sendWelcomeEmail,
  sendReportReadyEmail,
  sendPasswordResetEmail,
} from './service';

export type { EmailOptions, EmailResult, EmailProvider } from './service';

export {
  welcomeEmail,
  reportReadyEmail,
  passwordResetEmail,
  emailTemplates,
} from './templates';

export type {
  WelcomeEmailData,
  ReportReadyEmailData,
  PasswordResetEmailData,
} from './templates';
