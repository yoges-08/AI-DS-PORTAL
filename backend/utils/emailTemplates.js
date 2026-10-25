/**
 * Email Templates for AI & DS Student Information Portal
 * Senders: Brevo HTTPS API
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

/**
 * Base responsive email layout wrapper
 */
function layout({ title, preheader, content }) {
  const safeTitle = esc(title);
  const safePreheader = esc(preheader || title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 30px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      padding: 28px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header-institution {
      font-size: 11px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .header-dept {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #ffffff;
      margin: 0;
    }
    .header-tag {
      display: inline-block;
      margin-top: 10px;
      padding: 3px 10px;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(129, 140, 248, 0.3);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: #c7d2fe;
    }
    .body {
      padding: 32px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.65;
      color: #334155;
      margin: 0 0 16px 0;
    }
    .code-box {
      background: #f8fafc;
      border: 2px dashed #6366f1;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #4338ca;
      padding-left: 8px;
    }
    .code-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .card {
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #4f46e5;
      padding: 16px;
      margin: 20px 0;
    }
    .card-success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }
    .card-danger {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    .card-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 22px 30px;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
      color: #64748b;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 6px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${safePreheader}
  </div>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td class="header">
              <div class="header-institution">Anjalai Ammal Mahalingam Engineering College</div>
              <div class="header-dept">Department of AI &amp; DS</div>
              <div class="header-tag">Student Information Portal</div>
            </td>
          </tr>
          <tr>
            <td class="body">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin: 0 0 6px 0;">This is an automated notification. Please do not reply directly to this email.</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Department of Artificial Intelligence &amp; Data Science, AAMEC.</p>
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
 * E1: Email Verification Code
 */
function verificationCode({ name, code, validMinutes = 10 }) {
  const safeName = esc(name || 'Student');
  const safeCode = esc(code);

  const content = `
    <div class="greeting">Hello, ${safeName}!</div>
    <p class="text">
      Thank you for registering on the <strong>AI &amp; DS Student Information Portal</strong>.
      Please use the 6-digit verification code below to verify your email address and activate your account:
    </p>
    <div class="code-box">
      <div class="code-digits">${safeCode}</div>
      <div class="code-expiry">&#9200; This code is valid for <strong>${validMinutes} minutes</strong>.</div>
    </div>
    <p class="text" style="font-size: 13px; color: #64748b;">
      &#9888; If you did not initiate this registration, please disregard this email. Never share this code with anyone.
    </p>
  `;

  return {
    subject: `Your AI & DS Portal Verification Code: ${code}`,
    html: layout({
      title: 'Email Verification Code',
      preheader: `Your verification code is ${code} (valid for ${validMinutes} mins)`,
      content
    })
  };
}

/**
 * E2: Account Created Successfully
 */
function accountCreated({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);

  const content = `
    <div class="greeting">Welcome to the Department, ${safeName}!</div>
    <div class="card card-success">
      <strong style="color: #065f46;">&#10004; Account Activated Successfully</strong>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #047857;">
        Register Number: <strong>${safeReg}</strong>
      </p>
    </div>
    <p class="text">
      Your student portal account has been activated. You can now log in to the portal using your Register Number and your chosen password.
    </p>
    <p class="text">
      <strong>Next Steps:</strong>
    </p>
    <ol style="margin: 0 0 20px 20px; padding: 0; font-size: 14px; color: #334155; line-height: 1.8;">
      <li>Log in to your account.</li>
      <li>Fill out your 6-step Student Profile Dossier.</li>
      <li>Upload required certificates and passport photo.</li>
      <li>Review and submit for departmental verification.</li>
    </ol>
  `;

  return {
    subject: 'Account Activated - AI & DS Student Portal',
    html: layout({
      title: 'Account Activated',
      preheader: `Welcome ${name}! Your student portal account is now active.`,
      content
    })
  };
}

/**
 * E3: Profile Dossier Submitted Successfully
 */
function submitted({ name, registerNo, submissionDate, attachmentCount = 0 }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const dateStr = submissionDate ? esc(new Date(submissionDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })) : esc(new Date().toLocaleDateString('en-IN'));

  const content = `
    <div class="greeting">Hello, ${safeName}!</div>
    <div class="card card-success">
      <strong style="color: #065f46;">&#10004; Profile Dossier Submitted</strong>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #047857;">
        Register Number: <strong>${safeReg}</strong><br>
        Submission Timestamp: <strong>${dateStr}</strong>
      </p>
    </div>
    <p class="text">
      Your Student Information Dossier has been successfully submitted and locked for departmental verification.
    </p>
    <p class="text">
      ${attachmentCount > 0 ? `<strong>Attachments:</strong> Attached to this email is a copy of your submitted application summary (PDF) along with your uploaded certificates for your records.` : `A copy of your submitted application has been archived for verification.`}
    </p>
    <p class="text" style="font-size: 13px; color: #64748b;">
      The department office will review your submitted credentials. You will receive an automated notification once your profile is verified or if any revision is requested.
    </p>
  `;

  return {
    subject: 'Profile Submitted Successfully - AI & DS Portal',
    html: layout({
      title: 'Profile Submitted',
      preheader: `Profile dossier submitted successfully for Reg No: ${registerNo}`,
      content
    })
  };
}

/**
 * E4: Profile Verified
 */
function verified({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);

  const content = `
    <div class="greeting">Congratulations, ${safeName}!</div>
    <div class="card card-success">
      <strong style="color: #065f46;">&#10004; Profile Dossier Verified &amp; Approved</strong>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #047857;">
        Register Number: <strong>${safeReg}</strong><br>
        Status: <span style="background: #10b981; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">VERIFIED</span>
      </p>
    </div>
    <p class="text">
      The Department of Artificial Intelligence &amp; Data Science has verified and approved your student profile and documentation.
    </p>
    <p class="text">
      Your official record is now up to date in the department registry. If you ever need to update critical personal details, please contact the department office.
    </p>
  `;

  return {
    subject: 'Profile Verified - AI & DS Student Portal',
    html: layout({
      title: 'Profile Verified',
      preheader: `Your student profile has been verified and approved by the department.`,
      content
    })
  };
}

/**
 * E5: Profile Rejected / Revision Requested
 */
function rejected({ name, registerNo, reason }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const safeReason = esc(reason || 'Clarification or re-upload required.');

  const content = `
    <div class="greeting">Hello, ${safeName}!</div>
    <div class="card card-warning">
      <strong style="color: #92400e;">&#9888; Profile Revision Required</strong>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #78350f;">
        Register Number: <strong>${safeReg}</strong><br>
        Status: <span style="background: #f59e0b; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">ACTION REQUIRED</span>
      </p>
    </div>
    <p class="text">
      The department office has reviewed your profile submission and noted the following item(s) that need correction:
    </p>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin: 16px 0; color: #92400e; font-size: 14px; line-height: 1.5;">
      <strong>Reviewer Remarks:</strong><br>
      ${safeReason}
    </div>
    <p class="text">
      Your profile has been unlocked for editing. Please log in to your portal account, make the requested updates or document re-uploads, and click <strong>Submit</strong> again.
    </p>
  `;

  return {
    subject: 'Action Required: Profile Revision - AI & DS Portal',
    html: layout({
      title: 'Profile Revision Required',
      preheader: `Revisions requested for student profile: ${registerNo}`,
      content
    })
  };
}

/**
 * E6: Account Locked
 */
function locked({ name, registerNo, reason }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const safeReason = esc(reason || 'Locked by administrator.');

  const content = `
    <div class="greeting">Hello, ${safeName}!</div>
    <div class="card card-danger">
      <strong style="color: #991b1b;">&#128274; Account Locked</strong>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #b91c1c;">
        Register Number: <strong>${safeReg}</strong><br>
        Status: <span style="background: #ef4444; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">LOCKED</span>
      </p>
    </div>
    <p class="text">
      Your student portal account has been temporarily locked by the department administration. While your account is locked, you will not be able to log in or edit your profile.
    </p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 18px; margin: 16px 0; color: #991b1b; font-size: 14px;">
      <strong>Reason:</strong> ${safeReason}
    </div>
    <p class="text" style="font-size: 13px; color: #64748b;">
      If you believe this is an error, please contact the AI &amp; DS Department Coordinator or Faculty Advisor.
    </p>
  `;

  return {
    subject: 'Account Locked - AI & DS Portal',
    html: layout({
      title: 'Account Locked',
      preheader: `Your AI & DS portal account (${registerNo}) has been locked.`,
      content
    })
  };
}

/**
 * E7: Account Unlocked
 */
function unlocked({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);

  const content = `
    <div class="greeting">Hello, ${safeName}!</div>
    <div class="card card-success">
      <strong style="color: #065f46;">&#128275; Account Unlocked</strong>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #047857;">
        Register Number: <strong>${safeReg}</strong><br>
        Status: <span style="background: #10b981; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">ACTIVE</span>
      </p>
    </div>
    <p class="text">
      Your student portal account has been unlocked by the department administration. You may now log in to the portal as usual.
    </p>
  `;

  return {
    subject: 'Account Unlocked - AI & DS Portal',
    html: layout({
      title: 'Account Unlocked',
      preheader: `Your AI & DS portal account (${registerNo}) has been unlocked.`,
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
