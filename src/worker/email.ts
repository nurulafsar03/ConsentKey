// Sends the real magic-link verification email via Resend's HTTP API.
// Needs RESEND_API_KEY set as a Cloudflare secret. See README-DEPLOY.md.

export async function sendMagicLinkEmail(opts: {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  toName: string;
  magicLink: string;
  circleName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { apiKey, fromEmail, toEmail, toName, magicLink, circleName } = opts;

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0f172a; color:#e2e8f0; border-radius: 16px;">
    <h2 style="color:#34d399; margin-top:0;">Confirm your ConsentKey account</h2>
    <p>Hi ${escapeHtml(toName)},</p>
    <p>You just registered for <strong>${escapeHtml(circleName)}</strong> on ConsentKey. Click the button below to verify your email and activate real live location sharing.</p>
    <p style="text-align:center; margin: 32px 0;">
      <a href="${magicLink}" style="background:#10b981; color:#052e1f; text-decoration:none; font-weight:700; padding:12px 24px; border-radius:12px; display:inline-block;">Verify my email</a>
    </p>
    <p style="font-size:12px; color:#94a3b8;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'Verify your ConsentKey account',
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `Resend API error (${res.status}): ${errText}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to reach Resend API' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
