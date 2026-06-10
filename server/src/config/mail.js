import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'mail.lbbs.co.za',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(studentNumber, otp) {
  const to = `${studentNumber}@ufh.ac.za`;
  await transporter.sendMail({
    from:    process.env.SMTP_FROM || 'LS Port <noreply@lbbs.co.za>',
    to,
    subject: 'LS Port — Password Reset Code',
    text: [
      'Your LS Port password reset code is:',
      '',
      `    ${otp}`,
      '',
      'This code is valid for 10 minutes and can only be used once.',
      'If you did not request a password reset, you can safely ignore this email.',
      '',
      '— LS Port',
    ].join('\n'),
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background:#0f172a;padding:24px 32px;">
          <div style="font-family:'Poppins',sans-serif;font-weight:800;font-size:1.2rem;color:#FA7921;letter-spacing:-0.5px;">LS PORT</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:2px;">LBBS Student Portal</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h2 style="font-family:'Poppins',sans-serif;font-size:1.1rem;color:#1F2937;margin:0 0 8px;">Password Reset Code</h2>
          <p style="color:#6b7280;font-size:0.9rem;margin:0 0 28px;line-height:1.6;">
            Use the code below to reset your LS Port password. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#fff7ed;border:2px solid #FA7921;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <div style="font-family:'Courier New',monospace;font-size:2.4rem;font-weight:800;letter-spacing:10px;color:#1F2937;">${otp}</div>
          </div>
          <p style="color:#9ca3af;font-size:0.8rem;margin:0;line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email. Your account remains secure.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;">
          <p style="color:#d1d5db;font-size:0.72rem;margin:0;text-align:center;">
            This is an automated message from LS Port &mdash; LBBS Student Portal.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

function brandedHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
        <tr><td style="background:#0f172a;padding:24px 32px;">
          <div style="font-family:'Poppins',sans-serif;font-weight:800;font-size:1.2rem;color:#FA7921;">LS PORT</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:2px;">LBBS Student Portal</div>
        </td></tr>
        <tr><td style="padding:28px 32px 24px;">${bodyHtml}</td></tr>
        <tr><td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #f0f0f0;">
          <p style="color:#d1d5db;font-size:0.72rem;margin:0;text-align:center;">Automated message from LS Port — LBBS Student Portal. Log in at portal.lbbs.co.za</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const QUERY_STATUS_TEMPLATES = {
  acknowledged: (name, subject) => ({
    emailSubject: `Query Received — ${subject}`,
    body: `Dear ${name},<br><br>Your query regarding <strong>"${subject}"</strong> has been received and acknowledged. We will review it and get back to you.<br><br>Track your query at <a href="https://portal.lbbs.co.za">portal.lbbs.co.za</a>.`,
    text: `Dear ${name}, your query regarding "${subject}" has been received and acknowledged. Track it at portal.lbbs.co.za`,
  }),
  in_progress: (name, subject) => ({
    emailSubject: `Query Update — ${subject}`,
    body: `Dear ${name},<br><br>Your query <strong>"${subject}"</strong> is currently being reviewed. You may receive a message on this portal shortly.`,
    text: `Dear ${name}, your query "${subject}" is currently being reviewed.`,
  }),
  resolved: (name, subject) => ({
    emailSubject: `Query Resolved — ${subject}`,
    body: `Dear ${name},<br><br>Your query <strong>"${subject}"</strong> has been resolved. Please log in to <a href="https://portal.lbbs.co.za">portal.lbbs.co.za</a> to view the full response.<br><br>If you have further questions, please submit a new query.`,
    text: `Dear ${name}, your query "${subject}" has been resolved. Log in to portal.lbbs.co.za to view the response.`,
  }),
  closed: (name, subject) => ({
    emailSubject: `Query Closed — ${subject}`,
    body: `Dear ${name},<br><br>Your query <strong>"${subject}"</strong> has been closed. Thank you for reaching out.`,
    text: `Dear ${name}, your query "${subject}" has been closed. Thank you for reaching out.`,
  }),
};

export async function sendQueryStatusEmail(to, studentName, querySubject, newStatus) {
  if (!to || !QUERY_STATUS_TEMPLATES[newStatus]) return;
  const { emailSubject, body, text } = QUERY_STATUS_TEMPLATES[newStatus](studentName, querySubject);
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LS Port <noreply@lbbs.co.za>',
    to, subject: emailSubject, text,
    html: brandedHtml(`<p style="color:#1F2937;font-size:0.92rem;line-height:1.7;margin:0;">${body}</p>`),
  });
}

export async function sendQueryReplyEmail(to, studentName, querySubject) {
  if (!to) return;
  const body = `Dear ${studentName},<br><br>There is a new reply on your query <strong>"${querySubject}"</strong>.<br><br>Log in to <a href="https://portal.lbbs.co.za">portal.lbbs.co.za</a> to read it.`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LS Port <noreply@lbbs.co.za>',
    to,
    subject: `New Reply — ${querySubject}`,
    text: `Dear ${studentName}, there is a new reply on your query "${querySubject}". Log in to portal.lbbs.co.za to read it.`,
    html: brandedHtml(`<p style="color:#1F2937;font-size:0.92rem;line-height:1.7;margin:0;">${body}</p>`),
  });
}
