/**
 * Modern Executive Email Templates for AI & DS Student Information Portal
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
  return process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'https://aamec-ai-ds-portal.vercel.app';
};

/**
 * Base executive email layout wrapper
 */
function layout({ title, preheader, content }) {
  const safeTitle = esc(title);
  const safePreheader = esc(preheader || title);
  const portalUrl = getPortalUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f6fc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'SF Pro Display', Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f3f6fc;
      padding: 36px 12px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .top-accent-bar {
      height: 5px;
      width: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
    }
    .header {
      background: linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%);
      padding: 34px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header-icon {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.35) 100%);
      border: 1px solid rgba(129, 140, 248, 0.4);
      font-size: 22px;
      margin-bottom: 14px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .header-institution {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .header-dept {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #ffffff;
      margin: 0;
      line-height: 1.35;
    }
    .header-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 14px;
      padding: 4px 14px;
      background: rgba(99, 102, 241, 0.18);
      border: 1px solid rgba(129, 140, 248, 0.35);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: #c7d2fe;
      letter-spacing: 0.5px;
    }
    .body {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.2px;
      margin-bottom: 14px;
    }
    .text {
      font-size: 15px;
      line-height: 1.7;
      color: #334155;
      margin: 0 0 16px 0;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 26px 32px;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
      color: #64748b;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }
    .btn-primary {
      display: inline-block;
      padding: 13px 28px;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      margin: 10px 0;
      transition: all 0.2s ease;
    }
    .card-box {
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
      border: 1px solid transparent;
    }
    .card-indigo {
      background: #f5f7ff;
      border-color: #dbe4ff;
    }
    .card-emerald {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .card-amber {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .card-rose {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .digit-box {
      width: 44px;
      height: 54px;
      background: #ffffff;
      border: 2px solid #6366f1;
      border-radius: 12px;
      font-size: 26px;
      font-weight: 800;
      color: #3730a3;
      text-align: center;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      box-shadow: 0 4px 8px rgba(99, 102, 241, 0.12);
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f3f6fc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${safePreheader}
  </div>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div class="top-accent-bar"></div>
            </td>
          </tr>
          <tr>
            <td class="header">
              <div class="header-icon">&#127891;</div>
              <div class="header-institution">Anjalai Ammal Mahalingam Engineering College</div>
              <div class="header-dept">Department of Artificial Intelligence &amp; Data Science</div>
              <div class="header-tag">
                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#34d399;"></span>
                Student Information Portal
              </div>
            </td>
          </tr>
          <tr>
            <td class="body">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #334155;">
                Department of AI &amp; DS &bull; Academic Portal
              </p>
              <p style="margin: 0 0 10px 0;">
                Anjalai Ammal Mahalingam Engineering College<br>
                Kovilvenni, Thiruvarur District, Tamil Nadu &ndash; 614403
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8;">
                &#128274; Secured Institutional Delivery &bull; Please do not reply directly to this automated email.
              </p>
              <div style="padding-top: 8px; border-top: 1px solid #e2e8f0;">
                <a href="${portalUrl}" target="_blank" style="margin: 0 8px;">Portal Home</a> &bull;
                <a href="${portalUrl}" target="_blank" style="margin: 0 8px;">Student Login</a>
              </div>
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
 * E1: Email Verification Code (Registration Step 1)
 */
function verificationCode({ name, code, validMinutes = 10 }) {
  const safeName = esc(name || 'Student');
  const safeCode = esc(code);
  const digits = safeCode.split('');

  const content = `
    <div class="greeting">Hello, ${safeName} &#128075;</div>
    <p class="text">
      Thank you for registering on the <strong>AI &amp; DS Student Information Portal</strong>.
      To complete your onboarding and activate your student account, please enter the 6-digit verification code below:
    </p>

    <!-- 6 Futuristic Digit Boxes -->
    <div style="background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%); border: 1px solid #c7d2fe; border-radius: 14px; padding: 24px 16px; margin: 26px 0; text-align: center;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6366f1; margin-bottom: 14px;">
        One-Time Verification Code
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          ${digits.map((d, idx) => `
            ${idx === 3 ? '<td style="width: 14px; text-align: center; font-size: 20px; font-weight: bold; color: #818cf8;">&bull;</td>' : ''}
            <td class="digit-box">${d}</td>
            ${idx < 5 && idx !== 2 ? '<td style="width: 8px;"></td>' : ''}
          `).join('')}
        </tr>
      </table>
      <div style="margin-top: 16px; font-size: 12px; font-weight: 600; color: #4338ca; display: inline-flex; align-items: center; gap: 5px;">
        <span>&#9200;</span> Valid for <strong>${validMinutes} minutes</strong>
      </div>
    </div>

    <!-- Security advisory card -->
    <div style="background: #f8fafc; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 3px;">
        &#128737;&#65039; Security Notice
      </div>
      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
        This code is intended solely for you. Department staff will never ask for your verification code. If you did not initiate this registration, please disregard this email.
      </p>
    </div>
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
  const portalUrl = getPortalUrl();

  const content = `
    <div class="greeting">Welcome to the Department, ${safeName}! &#127881;</div>
    
    <div class="card-box card-emerald">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 22px;">&#10004;</span>
        <div>
          <div style="font-size: 15px; font-weight: 700; color: #065f46;">
            Student Account Successfully Activated
          </div>
          <div style="font-size: 13px; color: #047857; margin-top: 2px;">
            Register Number: <strong style="font-family: monospace; font-size: 14px;">${safeReg}</strong>
          </div>
        </div>
      </div>
    </div>

    <p class="text">
      Your official profile account has been verified and activated in the <strong>AI &amp; DS Academic Registry</strong>.
      You can now log in to the portal using your Register Number and your chosen password.
    </p>

    <!-- Onboarding Steps Roadmap -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 14px;">
        Recommended Next Steps:
      </div>
      
      <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 12px; text-align: center; line-height: 24px; shrink: 0;">1</div>
        <div style="font-size: 14px; color: #334155;">
          <strong>Log In:</strong> Sign in with your Register Number and chosen password.
        </div>
      </div>

      <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 12px; text-align: center; line-height: 24px; shrink: 0;">2</div>
        <div style="font-size: 14px; color: #334155;">
          <strong>Complete Dossier:</strong> Fill out your 6-step Student Information Dossier (Personal, Academic, Family &amp; Bank details).
        </div>
      </div>

      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 12px; text-align: center; line-height: 24px; shrink: 0;">3</div>
        <div style="font-size: 14px; color: #334155;">
          <strong>Upload &amp; Submit:</strong> Upload your passport photo and certificates, then submit for departmental verification.
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${portalUrl}" class="btn-primary" target="_blank">
        Log In to Student Portal &rarr;
      </a>
    </div>
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
function submitted({ name, registerNo, submissionDate, attachmentCount = 0, omittedCount = 0 }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();
  const dateStr = submissionDate ? esc(new Date(submissionDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })) : esc(new Date().toLocaleDateString('en-IN'));

  const content = `
    <div class="greeting">Hello, ${safeName}! &#128221;</div>

    <div class="card-box card-indigo">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase;">
            SUBMITTED
          </span>
          <div style="font-size: 16px; font-weight: 700; color: #1e1b4b; margin-top: 4px;">
            Profile Dossier Submitted Successfully
          </div>
        </div>
        <div style="font-size: 12px; color: #6366f1; font-weight: 600;">
          &#128197; ${dateStr}
        </div>
      </div>
      <div style="font-size: 13px; color: #3730a3; margin-top: 6px;">
        Register Number: <strong style="font-family: monospace;">${safeReg}</strong>
      </div>
    </div>

    <p class="text">
      Your official Student Information Dossier has been securely locked and submitted to the <strong>AI &amp; DS Department Review Committee</strong>.
    </p>

    <!-- Attached Documents Box -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
      <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        <span>&#128206;</span> Attached Dossier Documents (${attachmentCount} Files):
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

    <!-- Review Progress Tracker -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 22px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 12px; text-align: center;">
        Verification Pipeline Status
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; text-align: center;">
        <tr>
          <td style="width: 33%; font-weight: 700; color: #16a34a;">
            &#10004; Submitted
          </td>
          <td style="width: 33%; font-weight: 700; color: #2563eb;">
            &#9654; Under Review
          </td>
          <td style="width: 33%; font-weight: 600; color: #94a3b8;">
            &#9711; Verified
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${portalUrl}" class="btn-primary" target="_blank">
        View Submission Details &rarr;
      </a>
    </div>
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
 * E4: Profile Verified & Approved
 */
function verified({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();

  const content = `
    <div class="greeting">Congratulations, ${safeName}! &#127891;</div>

    <!-- Official Verified Badge Card -->
    <div class="card-box card-emerald" style="border: 1px solid #86efac; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #10b981; color: #ffffff; text-align: center; line-height: 38px; font-size: 20px;">
            &#10003;
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #065f46;">
              Profile Verified &amp; Approved
            </div>
            <div style="font-size: 12px; color: #047857; margin-top: 1px;">
              Register Number: <strong>${safeReg}</strong>
            </div>
          </div>
        </div>
        <span style="background: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">
          VERIFIED
        </span>
      </div>
    </div>

    <p class="text">
      The faculty coordinators and academic administration of the <strong>Department of Artificial Intelligence &amp; Data Science</strong> have reviewed and approved your submitted student profile and supporting certificates.
    </p>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
        &#128220; Institutional Record Status
      </div>
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
        Your record has been permanently marked as <strong>VERIFIED</strong> in the department database. If you require any critical updates in the future, please contact your Faculty Advisor or Department Head.
      </p>
    </div>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${portalUrl}" class="btn-primary" target="_blank">
        Access Verified Portal &rarr;
      </a>
    </div>
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
 * E5: Profile Rejected / Action Required
 */
function rejected({ name, registerNo, reason }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const safeReason = esc(reason || 'Clarification or certificate re-upload required.');
  const portalUrl = getPortalUrl();

  const content = `
    <div class="greeting">Hello, ${safeName} &#9888;</div>

    <div class="card-box card-amber" style="border: 1px solid #fcd34d;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #f59e0b; color: #ffffff; text-align: center; line-height: 36px; font-size: 18px; font-weight: bold;">
            !
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #92400e;">
              Profile Revision Required
            </div>
            <div style="font-size: 12px; color: #b45309;">
              Register Number: <strong>${safeReg}</strong>
            </div>
          </div>
        </div>
        <span style="background: #f59e0b; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 11px;">
          ACTION REQUIRED
        </span>
      </div>
    </div>

    <p class="text">
      The department office has reviewed your profile submission and requested corrections before approval can be completed.
    </p>

    <!-- Highlighted Remark Box -->
    <div style="background: #ffffff; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #b45309; margin-bottom: 8px;">
        Reviewer Remarks &amp; Instructions:
      </div>
      <div style="font-size: 14px; font-style: italic; color: #78350f; line-height: 1.6; background: #fffbeb; padding: 12px 14px; border-radius: 8px;">
        &ldquo;${safeReason}&rdquo;
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #475569;">
      <strong>What to do next:</strong>
      <ol style="margin: 8px 0 0 16px; padding: 0; line-height: 1.7;">
        <li>Log in to your student portal account.</li>
        <li>Your profile is unlocked for editing &ndash; correct the mentioned details or re-upload documents.</li>
        <li>Review your details and click <strong>Submit</strong> to send for re-verification.</li>
      </ol>
    </div>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${portalUrl}" class="btn-primary" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);" target="_blank">
        Log In &amp; Revise Profile &rarr;
      </a>
    </div>
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
 * E6: Account Locked Notice
 */
function locked({ name, registerNo, reason }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const safeReason = esc(reason || 'Locked by administrator.');

  const content = `
    <div class="greeting">Hello, ${safeName} &#128274;</div>

    <div class="card-box card-rose" style="border: 1px solid #fca5a5;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #ef4444; color: #ffffff; text-align: center; line-height: 36px; font-size: 18px;">
            &#128274;
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #991b1b;">
              Account Temporarily Locked
            </div>
            <div style="font-size: 12px; color: #b91c1c;">
              Register Number: <strong>${safeReg}</strong>
            </div>
          </div>
        </div>
        <span style="background: #ef4444; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 11px;">
          LOCKED
        </span>
      </div>
    </div>

    <p class="text">
      Your student portal account has been temporarily locked by the department administration. While locked, you will not be able to log in or alter your submitted details.
    </p>

    <div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #991b1b; margin-bottom: 6px;">
        Administrative Notice:
      </div>
      <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.5;">
        ${safeReason}
      </p>
    </div>

    <p class="text" style="font-size: 13px; color: #64748b;">
      If you believe this was done in error or need your account unlocked, please contact the AI &amp; DS Department Coordinator or your Faculty Advisor.
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
 * E7: Account Unlocked Notice
 */
function unlocked({ name, registerNo }) {
  const safeName = esc(name);
  const safeReg = esc(registerNo);
  const portalUrl = getPortalUrl();

  const content = `
    <div class="greeting">Hello, ${safeName}! &#128275;</div>

    <div class="card-box card-emerald">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #10b981; color: #ffffff; text-align: center; line-height: 36px; font-size: 18px;">
            &#128275;
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #065f46;">
              Account Successfully Unlocked
            </div>
            <div style="font-size: 12px; color: #047857;">
              Register Number: <strong>${safeReg}</strong>
            </div>
          </div>
        </div>
        <span style="background: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 11px;">
          ACTIVE
        </span>
      </div>
    </div>

    <p class="text">
      Your student portal account has been unlocked by the department administration. You can now log in to the portal and access all features as usual.
    </p>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${portalUrl}" class="btn-primary" target="_blank">
        Sign In to Student Portal &rarr;
      </a>
    </div>
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
