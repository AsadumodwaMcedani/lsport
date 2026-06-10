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
