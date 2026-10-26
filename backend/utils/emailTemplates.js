/**
 * Modern Executive Dual-Logo Email Templates for AI & DS Student Information Portal
 * Integrates College Emblem (AAMEC) & Department Emblem (AI & DS).
 * Clean, institutional light-theme design system.
 * Senders: Brevo HTTPS REST API
 */

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const getPortalUrl = () => {
  if (process.env.PORTAL_URL) return process.env.PORTAL_URL.trim();
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL.split(',')[0].trim();
  return 'https://aamec-ai-ds-portal.vercel.app';
};

const SUPPORT_EMAIL = 'aiandds.support@gmail.com';
const SUPPORT_PHONE = '+91 99448 23120';
const COLLEGE_NAME = 'Anjalai Ammal Mahalingam Engineering College';
const DEPT_NAME = 'Department of Artificial Intelligence & Data Science';

/**
 * Base executive dual-logo email layout wrapper
 */
function layout({ title, preheader, badge, badgeColor = '#0284c7', content }) {
  const safeTitle = esc(title);
  const safePreheader = esc(preheader || title);
  const safeBadge = esc(badge || 'OFFICIAL NOTIFICATION');
  const portalUrl = getPortalUrl();
  const collegeLogoUrl = `${portalUrl}/college-logo.webp`;
  const aidsLogoUrl = `${portalUrl}/aids-logo.jpg`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'SF Pro Display', Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: separate;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 16px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 12px 35px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
    }
    .top-gradient-stripe {
      height: 4px;
      width: 100%;
      background: linear-gradient(90deg, #0284c7 0%, #4f46e5 50%, #06b6d4 100%);
    }
    .header-panel {
      padding: 28px 30px 24px 30px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    .logo-container {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: inline-block;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .college-tagline {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 3px;
    }
    .dept-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
      margin: 0 0 6px 0;
      line-height: 1.3;
    }
    .badge-pill {
      display: inline-block;
      padding: 3px 11px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      background-color: #f0f9ff;
      color: ${badgeColor};
      border: 1px solid #bae6fd;
    }
    .body-panel {
      padding: 36px 34px 28px 34px;
    }
    .headline {
      font-size: 21px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.4px;
      line-height: 1.35;
      margin: 0 0 16px 0;
    }
    .salutation {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 14.5px;
      line-height: 1.7;
      color: #475569;
      margin: 0 0 18px 0;
    }
    .card-block {
      border-radius: 14px;
      padding: 22px 24px;
      margin: 22px 0;
    }
    .btn-action {
      display: inline-block;
      padding: 13px 30px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.2px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      margin: 8px 0;
    }
    .footer-panel {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 28px 34px;
      font-size: 12px;
      line-height: 1.65;
      color: #64748b;
    }
    .footer-links a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 12px 6px !important; }
      .header-panel { padding: 20px 16px !important; }
      .body-panel { padding: 26px 18px 20px 18px !important; }
      .footer-panel { padding: 22px 18px !important; }
      .headline { font-size: 19px !important; }
      .dept-title { font-size: 13.5px !important; }
      .college-tagline { font-size: 9px !important; letter-spacing: 1px !important; }
      .logo-container { width: 42px !important; height: 42px !important; }
      .logo-img { width: 34px !important; height: 34px !important; }
      .btn-action { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body>
  <!-- Preheader text for inbox preview -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    ${safePreheader}
  </div>

  <table role="presentation" class="email-wrapper" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Cyber Gradient Accent Stripe -->
          <tr>
            <td class="top-gradient-stripe"></td>
          </tr>

          <!-- DUAL LOGO HEADER: College Logo (Left) + Titles (Center) + Department Logo (Right) -->
          <tr>
            <td class="header-panel">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <!-- Left: Official College Emblem -->
                  <td width="54" align="left" valign="middle">
                    <div class="logo-container" title="${COLLEGE_NAME}">
                      <img src="${collegeLogoUrl}" alt="AAMEC" width="40" height="40" class="logo-img" style="margin-top: 5px; display: inline-block; object-fit: contain;" />
                    </div>
                  </td>

                  <!-- Center: Institution & Department Branding -->
                  <td align="center" valign="middle" style="padding: 0 10px;">
                    <div class="college-tagline">${COLLEGE_NAME}</div>
                    <h1 class="dept-title">${DEPT_NAME}</h1>
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">Department of AI &amp; DS</div>
                    <div class="badge-pill">${safeBadge}</div>
                  </td>

                  <!-- Right: AI & DS Department Emblem -->
                  <td width="54" align="right" valign="middle">
                    <div class="logo-container" title="${DEPT_NAME}">
                      <img src="${aidsLogoUrl}" alt="AI &amp; DS" width="44" height="44" class="logo-img" style="margin-top: 3px; display: inline-block; object-fit: contain; border-radius: 8px;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Email Content Area -->
          <tr>
            <td class="body-panel">
              ${content}
            </td>
          </tr>

          <!-- Department Footer -->
          <tr>
            <td class="footer-panel">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Dual Logo Signature in Footer -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 14px;">
                      <tr>
                        <td valign="middle">
                          <div style="font-weight: 700; color: #1e293b; font-size: 12.5px;">
                            ${DEPT_NAME}
                          </div>
                          <div style="color: #64748b; font-size: 11.5px; line-height: 1.5;">
                            ${COLLEGE_NAME}<br>
                            Kovilvenni, Thiruvarur District, Tamil Nadu – 614 403
                          </div>
                        </td>
                        <td width="72" align="right" valign="middle">
                          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                            <img src="${collegeLogoUrl}" alt="AAMEC" width="28" height="28" style="display: inline-block; opacity: 0.85;" />
                            <img src="${aidsLogoUrl}" alt="AI&DS" width="28" height="28" style="display: inline-block; border-radius: 4px; opacity: 0.85;" />
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div class="footer-links" style="font-size: 11.5px; margin-bottom: 12px;">
                      <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
                      &nbsp;&bull;&nbsp;
                      <a href="tel:+919944823120">${SUPPORT_PHONE}</a>
                      &nbsp;&bull;&nbsp;
                      <a href="${portalUrl}" target="_blank">Portal Sign In</a>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; line-height: 1.5;">
                      This is an automated administrative notification dispatched by the AAMEC AI &amp; DS Portal (UMIS). 
                      Please do not reply directly to this email. For assistance or record corrections, contact the department office.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * E1: Email Verification Code (OTP)
 */
function verificationCode({ name, code, validMinutes = 10 }) {
  const safeName = esc(name);
  const safeCode = esc(code);
  const safeMinutes = esc(validMinutes);

  const content = `
    <h2 class="headline">Email Verification Code</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      Thank you for initiating your student registration on the <strong>AI &amp; DS Department Portal</strong>. 
      Please use the single-use 6-digit security code below to authenticate your institutional email address:
    </p>

    <!-- OTP Display Box -->
    <div class="card-block" style="background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; text-align: center;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0369a1; margin-bottom: 10px;">
        Authentication Security Code
      </div>
      <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 12px; color: #0284c7; padding: 12px 0 12px 12px; text-shadow: 0 1px 2px rgba(2,132,199,0.15);">
        ${safeCode}
      </div>
      <div style="font-size: 12px; font-weight: 600; color: #0369a1; margin-top: 6px;">
        &#9201; Valid for ${safeMinutes} minutes only
      </div>
    </div>

    <!-- Security Warning Card -->
    <div style="background: #f8fafc; border-left: 3px solid #0284c7; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 3px;">Important Security Advisory</div>
      <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
        Never share this verification code with anyone. Department faculty and system administrators will never ask for your verification code or password.
      </div>
    </div>

    <p class="paragraph" style="font-size: 13px; color: #64748b; margin-top: 20px;">
      If you did not request this verification code, please ignore this email or notify the department office immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${SUPPORT_EMAIL}</a>.
    </p>
  `;

  return {
    subject: 'Verification Code - AI & DS Portal',
    html: layout({
      title: 'Verification Code - AI & DS Portal',
      preheader: `Your verification code is ${code}. Valid for ${validMinutes} minutes.`,
      badge: 'SECURITY AUTHENTICATION',
      badgeColor: '#0284c7',
      content
    })
  };
}

/**
 * E2: Welcome & Account Created Confirmation
 */
function accountCreated({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();

  const content = `
    <h2 class="headline">Welcome to the AI &amp; DS Portal</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      Your student portal account has been successfully verified and registered. You are now pre-registered in the departmental database and can proceed with completing your academic profile and statutory concession particulars.
    </p>

    <!-- Credential Summary Card -->
    <div class="card-block" style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px -2px rgba(15,23,42,0.04); padding: 0; overflow: hidden;">
      <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">
        Verified Student Credentials
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="12" style="font-size: 13.5px; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td width="38%" style="color: #64748b; font-weight: 600;">Full Name:</td>
          <td style="color: #0f172a; font-weight: 700;">${safeName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Register Number:</td>
          <td style="font-family: monospace; font-size: 14px; font-weight: 700; color: #0284c7;">${safeReg}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Academic Department:</td>
          <td style="color: #0f172a; font-weight: 600;">${DEPT_NAME}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Account Status:</td>
          <td>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
              ACTIVE &bull; ELIGIBLE
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Onboarding Steps -->
    <div style="margin: 24px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Next Steps to Complete Your Record:</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.6; color: #475569;">
        <tr>
          <td width="28" valign="top" style="padding-bottom: 10px;"><div style="width: 20px; height: 20px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 20px; font-size: 11px; font-weight: 800;">1</div></td>
          <td valign="top" style="padding-bottom: 10px;">Log in to the portal using your Register Number and chosen password.</td>
        </tr>
        <tr>
          <td width="28" valign="top" style="padding-bottom: 10px;"><div style="width: 20px; height: 20px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 20px; font-size: 11px; font-weight: 800;">2</div></td>
          <td valign="top" style="padding-bottom: 10px;">Fill out the 6-Step Multi-Step Form (Personal, Academic, Statutory Concessions, Arrears).</td>
        </tr>
        <tr>
          <td width="28" valign="top"><div style="width: 20px; height: 20px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 20px; font-size: 11px; font-weight: 800;">3</div></td>
          <td valign="top">Submit for Faculty Advisor review and departmental approval.</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${portalUrl}" class="btn-action" target="_blank">
        Sign In to Student Portal &rarr;
      </a>
    </div>
  `;

  return {
    subject: 'Welcome to the AI & DS Student Portal',
    html: layout({
      title: 'Account Registered - AI & DS Portal',
      preheader: `Welcome ${name}! Your student portal account (${registerNo}) is ready.`,
      badge: 'ACCOUNT ACTIVATED',
      badgeColor: '#059669',
      content
    })
  };
}

/**
 * E3: Profile Submitted for Verification
 */
function submitted({ name, registerNo, submissionDate, attachmentCount = 0, omittedCount = 0 }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();
  const dateStr = submissionDate ? esc(new Date(submissionDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })) : esc(new Date().toLocaleDateString('en-GB'));

  const content = `
    <h2 class="headline">Profile Submitted for Department Review</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      Your student profile and statutory concession particulars have been successfully submitted to the <strong>${DEPT_NAME}</strong> for official verification.
    </p>

    <!-- Submission Acknowledgement Card -->
    <div class="card-block" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px 22px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; margin-bottom: 12px;">
        Submission Receipt Details
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="font-size: 13.5px; color: #334155;">
        <tr>
          <td width="40%" style="color: #64748b; font-weight: 600;">Student Name:</td>
          <td style="font-weight: 700; color: #0f172a;">${safeName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Register Number:</td>
          <td style="font-family: monospace; font-size: 14px; font-weight: 700; color: #0284c7;">${safeReg}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Timestamp:</td>
          <td style="font-weight: 600; color: #0f172a;">${dateStr}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Current Workflow:</td>
          <td>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">
              UNDER VERIFICATION
            </span>
          </td>
        </tr>
      </table>
    </div>

    ${attachmentCount > 0 ? `
      <!-- Attached Documents Box -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
          Attached Dossier Documents (${attachmentCount} Files):
        </div>
        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
          Attached to this email is a generated copy of your submitted application summary (PDF) along with your uploaded certificates for your personal records.
        </p>
        ${omittedCount > 0 ? `
          <div style="margin-top: 12px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 12px; color: #92400e; line-height: 1.5;">
            <strong>Notice:</strong> ${omittedCount} certificate(s) could not be attached directly to this email due to attachment size constraints. All submitted certificates remain securely archived and can be viewed or downloaded anytime directly from your student portal.
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Review Workflow Info -->
    <div style="margin: 22px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Department Verification Pipeline:</div>
      <p class="paragraph" style="font-size: 13px; margin-bottom: 0;">
        Your Faculty Advisor and Department Office will review your submitted academic data, certificates, and statutory concession particulars against institutional records. You will receive an automated notification as soon as verification is concluded.
      </p>
    </div>

    <div style="text-align: center; margin: 26px 0 10px 0;">
      <a href="${portalUrl}" class="btn-action" target="_blank">
        View Submission Status &rarr;
      </a>
    </div>
  `;

  return {
    subject: 'Profile Submitted Successfully - AI & DS Portal',
    html: layout({
      title: 'Profile Submitted - AI & DS Portal',
      preheader: `Profile submission received for ${name} (${registerNo}). Under departmental verification.`,
      badge: 'SUBMISSION ACKNOWLEDGED',
      badgeColor: '#d97706',
      content
    })
  };
}

/**
 * E4: Profile Verified & Approved
 */
function verified({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();
  const approvalDate = esc(new Date().toLocaleDateString('en-GB'));

  const content = `
    <h2 class="headline" style="color: #047857;">Profile Verified &amp; Endorsed</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      We are pleased to inform you that your student information record and statutory concession particulars have been <strong>formally reviewed and verified</strong> by the ${DEPT_NAME}.
    </p>

    <!-- Success Certificate Card -->
    <div class="card-block" style="background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; text-align: center; padding: 26px 20px;">
      <div style="width: 52px; height: 52px; border-radius: 50%; background: #10b981; color: #ffffff; line-height: 52px; font-size: 26px; margin: 0 auto 12px auto; box-shadow: 0 4px 14px rgba(16,185,129,0.35);">
        &#10003;
      </div>
      <div style="font-size: 18px; font-weight: 800; color: #065f46; margin-bottom: 4px;">
        Institutional Verification Completed
      </div>
      <div style="font-size: 13px; color: #047857; margin-bottom: 12px;">
        Register Number: <strong>${safeReg}</strong> &bull; Endorsed on ${approvalDate}
      </div>
      <span style="display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; background: #059669; color: #ffffff; letter-spacing: 0.5px;">
        RECORD LOCKED &amp; COMPLIANT
      </span>
    </div>

    <p class="paragraph">
      Your official Student Information Sheet has been archived in compliance with statutory concession requirements and Anna University record standards. Your profile is now locked against unintentional edits.
    </p>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${portalUrl}" class="btn-action" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(5,150,105,0.35);" target="_blank">
        Download Verified Application PDF &rarr;
      </a>
    </div>
  `;

  return {
    subject: 'Profile Approved & Verified - AI & DS Portal',
    html: layout({
      title: 'Profile Approved - AI & DS Portal',
      preheader: `Congratulations ${name}! Your student record (${registerNo}) has been formally approved.`,
      badge: 'VERIFICATION APPROVED',
      badgeColor: '#059669',
      content
    })
  };
}

/**
 * E5: Action Required: Profile Revision
 */
function rejected({ name, registerNo, reason }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const safeReason = esc(reason || 'Please review your uploaded documents and particulars.');
  const portalUrl = getPortalUrl();

  const content = `
    <h2 class="headline" style="color: #b45309;">Action Required: Profile Revision</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      During institutional review of your student record for Register Number <strong>${safeReg}</strong>, the Department Review Committee identified items requiring your immediate revision.
    </p>

    <!-- Administrative Feedback Card -->
    <div class="card-block" style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d97706; padding: 20px 22px;">
      <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #92400e; margin-bottom: 8px;">
        Administrator Revision Feedback:
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #78350f; font-weight: 500;">
        &ldquo;${safeReason}&rdquo;
      </div>
    </div>

    <!-- Remediation Guidance -->
    <div style="margin: 22px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">How to Complete Your Revision:</div>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;">
        <li style="margin-bottom: 6px;">Sign in to your student account on the portal.</li>
        <li style="margin-bottom: 6px;">Navigate to the indicated form sections to update the information or replace the documents.</li>
        <li>Click <strong>Submit for Verification</strong> to re-enter the approval queue.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${portalUrl}" class="btn-action" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); box-shadow: 0 4px 14px rgba(217,119,6,0.35);" target="_blank">
        Revise Profile Details Now &rarr;
      </a>
    </div>
  `;

  return {
    subject: 'Action Required: Profile Revision - AI & DS Portal',
    html: layout({
      title: 'Revision Required - AI & DS Portal',
      preheader: `Action required for student profile (${registerNo}). Please review administrator comments.`,
      badge: 'REVISION REQUIRED',
      badgeColor: '#d97706',
      content
    })
  };
}

/**
 * E6: Account Locked Notice
 */
function locked({ name, registerNo, reason }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const safeReason = esc(reason || 'Temporary administrative security hold pending document authentication.');

  const content = `
    <h2 class="headline" style="color: #b91c1c;">Account Temporarily Restricted</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      Your student portal account for Register Number <strong>${safeReg}</strong> has been placed on temporary administrative hold by the department.
    </p>

    <!-- Notice Card -->
    <div class="card-block" style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 20px 22px;">
      <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #991b1b; margin-bottom: 8px;">
        Administrative Notice:
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #7f1d1d;">
        ${safeReason}
      </div>
    </div>

    <p class="paragraph" style="font-size: 13.5px; color: #64748b;">
      While this restriction is active, sign-in attempts and profile modifications are suspended. If you have questions or require resolution, please contact the AI &amp; DS Department Coordinator.
    </p>
  `;

  return {
    subject: 'Account Restricted - AI & DS Portal',
    html: layout({
      title: 'Account Restricted - AI & DS Portal',
      preheader: `Notice: Student account (${registerNo}) has been placed on administrative hold.`,
      badge: 'SECURITY RESTRICTION',
      badgeColor: '#dc2626',
      content
    })
  };
}

/**
 * E7: Account Unlocked Notice
 */
function unlocked({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();

  const content = `
    <h2 class="headline" style="color: #047857;">Account Restored &amp; Active</h2>
    <div class="salutation">Dear ${safeName},</div>
    
    <p class="paragraph">
      The administrative restriction on your student portal account for Register Number <strong>${safeReg}</strong> has been formally lifted. 
      Your account is now fully active with standard access permissions restored.
    </p>

    <!-- Active Status Card -->
    <div class="card-block" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px 22px; text-align: center;">
      <div style="font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 4px;">
        Account Status: Active
      </div>
      <div style="font-size: 13px; color: #047857;">
        You can now sign in and manage your academic profile without restrictions.
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${portalUrl}" class="btn-action" target="_blank">
        Sign In to Student Portal &rarr;
      </a>
    </div>
  `;

  return {
    subject: 'Account Restored - AI & DS Portal',
    html: layout({
      title: 'Account Restored - AI & DS Portal',
      preheader: `Good news! Your student portal account (${registerNo}) has been restored.`,
      badge: 'ACCESS RESTORED',
      badgeColor: '#059669',
      content
    })
  };
}

module.exports = {
  esc,
  layout,
  verificationCode,
  accountCreated,
  submitted,
  verified,
  rejected,
  locked,
  unlocked
};
