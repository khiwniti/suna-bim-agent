/**
 * Email Templates
 *
 * Transactional email templates for CarbonBIM platform.
 * Built with inline styles for maximum email client compatibility.
 *
 * Templates:
 * - Welcome email (signup confirmation)
 * - Report ready notification
 * - Password reset
 */

// ============================================
// Shared Styles
// ============================================

const styles = {
  // Container
  container: `
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f8fafc;
  `,
  // Card
  card: `
    background-color: #ffffff;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `,
  // Logo header
  logoHeader: `
    text-align: center;
    margin-bottom: 32px;
  `,
  logo: `
    display: inline-flex;
    align-items: center;
    gap: 8px;
  `,
  logoIcon: `
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #10b981, #06b6d4);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  logoText: `
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
  `,
  // Typography
  heading: `
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
    text-align: center;
  `,
  paragraph: `
    font-size: 16px;
    line-height: 1.6;
    color: #475569;
    margin: 0 0 16px 0;
  `,
  // Button
  button: `
    display: inline-block;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    text-align: center;
  `,
  buttonContainer: `
    text-align: center;
    margin: 32px 0;
  `,
  // Footer
  footer: `
    text-align: center;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
  `,
  footerText: `
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  `,
  footerLink: `
    color: #10b981;
    text-decoration: none;
  `,
  // Highlight box
  highlightBox: `
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 16px;
    margin: 24px 0;
  `,
  highlightText: `
    font-size: 14px;
    color: #166534;
    margin: 0;
  `,
  // Stats
  statsContainer: `
    display: flex;
    justify-content: space-around;
    margin: 24px 0;
    text-align: center;
  `,
  statItem: `
    padding: 0 16px;
  `,
  statValue: `
    font-size: 28px;
    font-weight: 700;
    color: #10b981;
    margin: 0;
  `,
  statLabel: `
    font-size: 12px;
    color: #64748b;
    margin: 4px 0 0 0;
    text-transform: uppercase;
  `,
};

// ============================================
// Email Header Component
// ============================================

function emailHeader(): string {
  return `
    <div style="${styles.logoHeader}">
      <div style="${styles.logo}">
        <div style="${styles.logoIcon}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 17L12 22L21 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 12L12 17L21 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span style="${styles.logoText}">CarbonBIM</span>
      </div>
    </div>
  `;
}

// ============================================
// Email Footer Component
// ============================================

function emailFooter(unsubscribeUrl?: string): string {
  return `
    <div style="${styles.footer}">
      <p style="${styles.footerText}">
        © 2025 CarbonBIM. All rights reserved.
      </p>
      <p style="${styles.footerText}">
        Bangkok, Thailand
      </p>
      ${unsubscribeUrl ? `
        <p style="${styles.footerText}; margin-top: 16px;">
          <a href="${unsubscribeUrl}" style="${styles.footerLink}">Unsubscribe</a>
        </p>
      ` : ''}
    </div>
  `;
}

// ============================================
// Welcome Email Template
// ============================================

export interface WelcomeEmailData {
  userName: string;
  loginUrl: string;
  calculatorUrl: string;
}

export function welcomeEmail(data: WelcomeEmailData): string {
  const { userName, loginUrl, calculatorUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CarbonBIM</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="${styles.container}">
    <div style="${styles.card}">
      ${emailHeader()}

      <h1 style="${styles.heading}">Welcome to CarbonBIM! 🎉</h1>

      <p style="${styles.paragraph}">
        Hi ${userName},
      </p>

      <p style="${styles.paragraph}">
        Thank you for joining CarbonBIM - Thailand's leading carbon calculation platform
        for the construction industry. You're now ready to analyze your building projects
        and generate TGO-compliant carbon reports.
      </p>

      <div style="${styles.highlightBox}">
        <p style="${styles.highlightText}">
          🎁 <strong>Your account includes 5 free carbon analyses</strong> to get started.
          No credit card required.
        </p>
      </div>

      <div style="${styles.buttonContainer}">
        <a href="${calculatorUrl}" style="${styles.button}">
          Start Your First Analysis →
        </a>
      </div>

      <p style="${styles.paragraph}">
        <strong>What you can do with CarbonBIM:</strong>
      </p>

      <ul style="${styles.paragraph}">
        <li>Calculate carbon footprint from IFC models or manual input</li>
        <li>Access 105+ Thai materials with TGO emission factors</li>
        <li>Generate CFO, CFP, and TREES certification reports</li>
        <li>Get AI-powered recommendations to reduce carbon</li>
      </ul>

      <p style="${styles.paragraph}">
        Need help getting started? Reply to this email or check out our
        <a href="${loginUrl}/case-studies" style="${styles.footerLink}">case studies</a>
        to see how other Thai companies are using CarbonBIM.
      </p>

      <p style="${styles.paragraph}">
        Best regards,<br>
        The CarbonBIM Team
      </p>

      ${emailFooter()}
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// Report Ready Email Template
// ============================================

export interface ReportReadyEmailData {
  userName: string;
  projectName: string;
  reportType: 'CFO' | 'CFP' | 'TREES';
  totalCarbon: number;
  carbonIntensity: number;
  downloadUrl: string;
  dashboardUrl: string;
}

export function reportReadyEmail(data: ReportReadyEmailData): string {
  const {
    userName,
    projectName,
    reportType,
    totalCarbon,
    carbonIntensity,
    downloadUrl,
    dashboardUrl,
  } = data;

  const formattedCarbon = totalCarbon.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const formattedIntensity = carbonIntensity.toFixed(1);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Carbon Report is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="${styles.container}">
    <div style="${styles.card}">
      ${emailHeader()}

      <h1 style="${styles.heading}">Your Report is Ready! 📊</h1>

      <p style="${styles.paragraph}">
        Hi ${userName},
      </p>

      <p style="${styles.paragraph}">
        Great news! Your <strong>${reportType}</strong> carbon analysis report for
        <strong>${projectName}</strong> is now ready to download.
      </p>

      <div style="${styles.highlightBox}">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="text-align: center; padding: 8px;">
              <p style="${styles.statValue}">${formattedCarbon}</p>
              <p style="${styles.statLabel}">kg CO₂e Total</p>
            </td>
            <td style="text-align: center; padding: 8px;">
              <p style="${styles.statValue}">${formattedIntensity}</p>
              <p style="${styles.statLabel}">kg CO₂e/m²</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="${styles.buttonContainer}">
        <a href="${downloadUrl}" style="${styles.button}">
          Download Report (PDF) →
        </a>
      </div>

      <p style="${styles.paragraph}">
        This report includes:
      </p>

      <ul style="${styles.paragraph}">
        <li>Detailed carbon breakdown by material category</li>
        <li>TGO emission factor references</li>
        <li>TREES benchmark comparison</li>
        <li>Low-carbon material recommendations</li>
      </ul>

      <p style="${styles.paragraph}">
        You can also view and manage all your reports in the
        <a href="${dashboardUrl}" style="${styles.footerLink}">dashboard</a>.
      </p>

      <p style="${styles.paragraph}">
        Questions about your results? Reply to this email and our team
        will be happy to help.
      </p>

      <p style="${styles.paragraph}">
        Best regards,<br>
        The CarbonBIM Team
      </p>

      ${emailFooter()}
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// Password Reset Email Template
// ============================================

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export function passwordResetEmail(data: PasswordResetEmailData): string {
  const { userName, resetUrl, expiresIn } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="${styles.container}">
    <div style="${styles.card}">
      ${emailHeader()}

      <h1 style="${styles.heading}">Reset Your Password 🔐</h1>

      <p style="${styles.paragraph}">
        Hi ${userName},
      </p>

      <p style="${styles.paragraph}">
        We received a request to reset your CarbonBIM password.
        Click the button below to create a new password.
      </p>

      <div style="${styles.buttonContainer}">
        <a href="${resetUrl}" style="${styles.button}">
          Reset Password →
        </a>
      </div>

      <div style="${styles.highlightBox}">
        <p style="${styles.highlightText}">
          ⏱️ This link will expire in <strong>${expiresIn}</strong>.
        </p>
      </div>

      <p style="${styles.paragraph}">
        If you didn't request this password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </p>

      <p style="${styles.paragraph}">
        For security reasons, never share this link with anyone.
      </p>

      <p style="${styles.paragraph}">
        Best regards,<br>
        The CarbonBIM Team
      </p>

      ${emailFooter()}
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// Export All Templates
// ============================================

export const emailTemplates = {
  welcome: welcomeEmail,
  reportReady: reportReadyEmail,
  passwordReset: passwordResetEmail,
};

export default emailTemplates;
